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
    const { doc, getDoc, setDoc } = await import("firebase/firestore");
    const ref = doc(db, "leaderboards", key, "scores", uid);
    // A season total only ever grows — never overwrite a higher value with a lower one.
    const existing = await getDoc(ref);
    if (existing.exists() && (existing.data() as SeasonScoreDoc).score >= total) return;
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
  top = 50
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
 * The player's live standing in the current season (rank + total entrants),
 * read once from Firestore. Returns null when Firebase is unavailable or the
 * player has no entry yet this month.
 */
export async function getSeasonStanding(
  key = monthKey()
): Promise<{ rank: number; total: number } | null> {
  if (!firebaseEnabled) return null;
  try {
    const { db, uid } = await getFirebase();
    const { collection, query, orderBy, getDocs } = await import("firebase/firestore");
    const snap = await getDocs(query(collection(db, "leaderboards", key, "scores"), orderBy("score", "desc")));
    const ids = snap.docs.map((d) => d.id);
    const idx = ids.indexOf(uid);
    if (idx < 0) return { rank: 0, total: ids.length };
    return { rank: idx + 1, total: ids.length };
  } catch {
    return null;
  }
}
