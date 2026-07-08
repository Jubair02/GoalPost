/**
 * Global season leaderboard.
 *
 * Rankings accumulate each player's daily-challenge scores across a calendar
 * month, then reset for the next season. When Firebase is configured, season
 * totals are written to and streamed from Firestore in real time (onSnapshot),
 * so every player sees the same board updating live. When it isn't, we fall
 * back to the deterministic local simulation in lib/daily so the app is fully
 * playable offline.
 *
 * Firestore layout:  leaderboards/{YYYY-MM}/scores/{uid}
 */
import type { LeaderboardEntry, PlayerAvatar } from "../types";
import { monthKey } from "../lib/daily";
import { firebaseEnabled, getFirebase } from "./firebase";

export interface SeasonScoreDoc {
  name: string;
  avatar: PlayerAvatar;
  country?: string;
  score: number;
  updatedAt: number;
}

/** Whether the leaderboard is backed by a real shared datastore. */
export function leaderboardIsLive(): boolean {
  return firebaseEnabled;
}

/** Publish the player's cumulative season total for the current month. */
export async function submitSeasonScore(
  total: number,
  name: string,
  avatar: PlayerAvatar,
  country = "⭐",
  key = monthKey()
): Promise<void> {
  if (!firebaseEnabled) return;
  try {
    const { db, uid } = await getFirebase();
    const { doc, setDoc } = await import("firebase/firestore");
    const ref = doc(db, "leaderboards", key, "scores", uid);
    // The season total is monotonic locally (it only ever grows within a month)
    // and each device has its own uid, so we can write directly — no read-first
    // round-trip. Callers only submit when the total actually increased.
    const payload: SeasonScoreDoc = { name: name || "Anonymous", avatar, country, score: total, updatedAt: Date.now() };
    await setDoc(ref, payload);
  } catch (err) {
    // Never let a leaderboard write break the play flow.
    console.warn("Leaderboard submit failed:", err);
  }
}

/**
 * Subscribe to the live top-N season leaderboard. The callback fires on every
 * change. Returns an unsubscribe function. When Firebase is off, returns a
 * no-op and never fires — callers should use the simulated board instead.
 */
export function subscribeSeasonLeaderboard(
  onUpdate: (entries: LeaderboardEntry[]) => void,
  onError?: (err: unknown) => void,
  key = monthKey(),
  top = 25
): () => void {
  if (!firebaseEnabled) return () => {};

  let unsub: (() => void) | null = null;
  let cancelled = false;

  (async () => {
    try {
      const { db, uid } = await getFirebase();
      const { collection, query, orderBy, limit, onSnapshot } = await import("firebase/firestore");
      if (cancelled) return;
      const q = query(collection(db, "leaderboards", key, "scores"), orderBy("score", "desc"), limit(top));
      unsub = onSnapshot(
        q,
        (snap) => {
          const entries: LeaderboardEntry[] = snap.docs.map((d, i) => {
            const data = d.data() as SeasonScoreDoc;
            return {
              rank: i + 1,
              name: data.name,
              avatar: data.avatar,
              country: data.country,
              score: data.score,
              isPlayer: d.id === uid,
            };
          });
          onUpdate(entries);
        },
        (err) => {
          console.warn("Leaderboard stream error:", err);
          onError?.(err);
        }
      );
    } catch (err) {
      console.warn("Leaderboard subscription failed:", err);
      onError?.(err);
    }
  })();

  return () => {
    cancelled = true;
    unsub?.();
  };
}

/**
 * The player's standing in the current season (rank + total entrants).
 *
 * Uses server-side COUNT aggregation instead of downloading the whole
 * collection: rank = (players scoring higher) + 1, total = all players. That's
 * two aggregation queries (each billed as a single read) regardless of how many
 * thousands of players exist — vs. reading every document. Returns null when
 * Firebase is unavailable; rank 0 means the player has no score yet.
 */
export async function getSeasonStanding(
  playerScore: number,
  key = monthKey()
): Promise<{ rank: number; total: number } | null> {
  if (!firebaseEnabled) return null;
  try {
    const { db } = await getFirebase();
    const { collection, query, where, getCountFromServer } = await import("firebase/firestore");
    const scores = collection(db, "leaderboards", key, "scores");
    const [totalSnap, higherSnap] = await Promise.all([
      getCountFromServer(scores),
      getCountFromServer(query(scores, where("score", ">", playerScore))),
    ]);
    const total = totalSnap.data().count;
    if (playerScore <= 0) return { rank: 0, total };
    return { rank: higherSnap.data().count + 1, total };
  } catch {
    return null;
  }
}
