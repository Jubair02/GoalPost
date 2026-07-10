/**
 * Cloud profile sync.
 *
 * Binds the local player store to a per-user Firestore document — players/{uid}
 * — so a signed-in user's entire profile (name, avatar, XP, coins, stats,
 * achievements, match history, season score) is tied to their identity and
 * roams across devices. The same account signing in anywhere resolves the same
 * uid and therefore the same document — never a duplicate.
 *
 * Design: local storage stays the instant, offline-first cache (the store's
 * existing persist middleware). This layer mirrors it up to the cloud and
 * merges remote changes back down, so the two converge. All writes are keyed by
 * the uid observed from auth — we never call getFirebase() here, so syncing can
 * never itself mint an anonymous session.
 *
 * Firestore layout:  players/{uid}
 */
import type { MatchRecord, PlayerState } from "../types";
import { usePlayerStore } from "../store/playerStore";
import { firebaseEnabled, getFirestoreDb, subscribeAuth } from "./firebase";
import { monthKey } from "../lib/daily";

/** Strip the store's action functions, leaving only the serializable state. */
function extractState(store: object): PlayerState {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(store)) {
    if (typeof v !== "function") out[k] = v;
  }
  return out as unknown as PlayerState;
}

function earliest(a: string, b: string): string {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}

function latestDate(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

/**
 * Reconcile two copies of a profile without losing progress or double-counting.
 *
 * The record with more lifetime XP is treated as the primary for identity-ish
 * fields (name, avatar, streak state); monotonic counters take the per-field
 * max; collections (achievements, match history) are unioned. Field-wise max
 * can slightly UNDER-count cumulative totals when the same user played
 * different games offline on two devices — but that's the safe direction (no
 * loss, no inflation) short of a full event log.
 */
export function mergePlayerState(a: PlayerState, b: PlayerState): PlayerState {
  const primary = a.xp >= b.xp ? a : b;
  const secondary = primary === a ? b : a;
  const max = (k: keyof PlayerState) => Math.max(Number(a[k] ?? 0), Number(b[k] ?? 0));

  // Season score is only comparable within the same month.
  const month = monthKey();
  const aInSeason = a.leaderboardMonth === month;
  const bInSeason = b.leaderboardMonth === month;
  const monthlyScore = aInSeason && bInSeason
    ? Math.max(a.monthlyScore, b.monthlyScore)
    : aInSeason ? a.monthlyScore
    : bInSeason ? b.monthlyScore
    : Math.max(a.monthlyScore, b.monthlyScore);
  const leaderboardMonth = aInSeason || bInSeason ? month : primary.leaderboardMonth;

  const historyById = new Map<string, MatchRecord>();
  for (const m of [...a.matchHistory, ...b.matchHistory]) historyById.set(m.id, m);
  const matchHistory = [...historyById.values()]
    .sort((x, y) => +new Date(y.date) - +new Date(x.date))
    .slice(0, 60);

  const categoryPerformance = { ...a.categoryPerformance };
  for (const [k, v] of Object.entries(b.categoryPerformance)) {
    const key = k as keyof typeof categoryPerformance;
    const cur = categoryPerformance[key];
    // Can't sum (would double-count shared history); keep the more-played copy.
    if (!cur || (v?.played ?? 0) > cur.played) categoryPerformance[key] = v;
  }

  const hasAvatar = (s: PlayerState) => Boolean(s.avatar?.image || s.avatar?.color);

  return {
    ...primary,
    name: primary.name || secondary.name,
    avatar: hasAvatar(primary) ? primary.avatar : secondary.avatar,
    createdAt: earliest(a.createdAt, b.createdAt),
    xp: max("xp"),
    coins: max("coins"),
    gamesPlayed: max("gamesPlayed"),
    wins: max("wins"),
    losses: max("losses"),
    draws: max("draws"),
    totalCorrect: max("totalCorrect"),
    totalAnswered: max("totalAnswered"),
    totalTimeMs: max("totalTimeMs"),
    bestStreak: max("bestStreak"),
    currentWinStreak: primary.currentWinStreak,
    bestScore: max("bestScore"),
    perfectGames: max("perfectGames"),
    expertWins: max("expertWins"),
    tournamentsWon: max("tournamentsWon"),
    battlesPlayed: max("battlesPlayed"),
    loginStreak: max("loginStreak"),
    dailyChallengeBest: max("dailyChallengeBest"),
    dailyChallengeScore: primary.dailyChallengeScore,
    achievements: [...new Set([...a.achievements, ...b.achievements])],
    trophies: a.trophies.length >= b.trophies.length ? a.trophies : b.trophies,
    categoryPerformance,
    matchHistory,
    leaderboardMonth,
    monthlyScore,
    lastLoginDate: latestDate(a.lastLoginDate, b.lastLoginDate),
    lastDailyChallengeDate: latestDate(a.lastDailyChallengeDate, b.lastDailyChallengeDate),
  };
}

let started = false;

/**
 * Begin syncing the local store with the signed-in user's cloud profile.
 * Idempotent; returns a stop() that tears everything down. No-op when Firebase
 * isn't configured (the app stays fully local).
 */
export function startPlayerSync(): () => void {
  if (!firebaseEnabled || started) return () => {};
  started = true;

  let uid: string | null = null;
  let unsubDoc: () => void = () => {};
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let applyingRemote = false;
  // Serialized copy of what the cloud last held/received, so we never write a
  // document identical to what's already there (avoids redundant writes and
  // onSnapshot echo loops).
  let lastSyncedJson = "";

  const scheduleSave = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => void saveNow(), 1500);
  };

  const saveNow = async () => {
    saveTimer = null;
    if (!uid) return;
    const state = extractState(usePlayerStore.getState());
    const json = JSON.stringify(state);
    if (json === lastSyncedJson) return;
    try {
      const db = await getFirestoreDb();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "players", uid), state, { merge: true });
      lastSyncedJson = json;
    } catch (err) {
      console.warn("Player sync save failed:", err);
    }
  };

  // Merge a remote snapshot into the local store, then push the reconciled
  // result back if local contributed anything the cloud didn't have.
  const applyRemote = (remote: PlayerState) => {
    lastSyncedJson = JSON.stringify(remote);
    const local = extractState(usePlayerStore.getState());
    const merged = mergePlayerState(local, remote);
    applyingRemote = true;
    usePlayerStore.setState(merged);
    applyingRemote = false;
    if (JSON.stringify(merged) !== lastSyncedJson) scheduleSave();
  };

  const bindUser = async (nextUid: string) => {
    uid = nextUid;
    try {
      const db = await getFirestoreDb();
      const { doc, getDoc, onSnapshot } = await import("firebase/firestore");
      const ref = doc(db, "players", nextUid);

      const snap = await getDoc(ref);
      if (uid !== nextUid) return; // auth changed while we awaited
      if (snap.exists()) {
        applyRemote(snap.data() as PlayerState);
      } else {
        // First time this identity is seen — seed the cloud from local state.
        scheduleSave();
      }

      // Keep converging with writes from the user's other devices.
      unsubDoc = onSnapshot(ref, (s) => {
        if (!s.exists() || s.metadata.hasPendingWrites) return;
        const json = JSON.stringify(s.data());
        if (json === lastSyncedJson) return;
        applyRemote(s.data() as PlayerState);
      });
    } catch (err) {
      console.warn("Player sync bind failed:", err);
    }
  };

  // Persist local changes (games played, renames, avatar edits) to the cloud.
  const unsubStore = usePlayerStore.subscribe(() => {
    if (applyingRemote || !uid) return;
    scheduleSave();
  });

  const unsubAuth = subscribeAuth((user) => {
    if (user) {
      if (user.uid !== uid) {
        unsubDoc();
        unsubDoc = () => {};
        void bindUser(user.uid);
      }
    } else {
      // Signed out — stop writing and forget the identity. The local store is
      // cleared separately by the logout handler; the cloud copy is the durable
      // record and stays untouched.
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }
      unsubDoc();
      unsubDoc = () => {};
      uid = null;
      lastSyncedJson = "";
    }
  });

  return () => {
    unsubAuth();
    unsubDoc();
    unsubStore();
    if (saveTimer) clearTimeout(saveTimer);
    started = false;
  };
}
