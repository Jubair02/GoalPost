/**
 * Global daily leaderboard.
 *
 * When Firebase is configured, scores are written to and streamed from
 * Firestore in real time (`onSnapshot`), so every player sees the same board
 * updating live. When it isn't, we transparently fall back to the deterministic
 * local simulation in lib/daily so the app is fully playable offline.
 *
 * Firestore layout:  leaderboards/{YYYY-MM-DD}/scores/{uid}
 */
import type { LeaderboardEntry, PlayerAvatar } from "../types";
import { dailyLeaderboard, todayKey } from "../lib/daily";
import { firebaseEnabled, getFirebase } from "./firebase";

export interface DailyScoreDoc {
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

/** Submit (or overwrite) the player's score for the given day. */
export async function submitDailyScore(
  score: number,
  name: string,
  avatar: PlayerAvatar,
  country = "⭐",
  key = todayKey()
): Promise<void> {
  if (!firebaseEnabled) return;
  try {
    const { db, uid } = await getFirebase();
    const { doc, getDoc, setDoc } = await import("firebase/firestore");
    const ref = doc(db, "leaderboards", key, "scores", uid);
    // Keep the player's best score for the day.
    const existing = await getDoc(ref);
    if (existing.exists() && (existing.data() as DailyScoreDoc).score >= score) return;
    const payload: DailyScoreDoc = { name: name || "Anonymous", avatar, country, score, updatedAt: Date.now() };
    await setDoc(ref, payload);
  } catch (err) {
    // Never let a leaderboard write break the play flow.
    console.warn("Leaderboard submit failed:", err);
  }
}

/**
 * Subscribe to the live top-N daily leaderboard. The callback fires on every
 * change. Returns an unsubscribe function. When Firebase is off, returns a
 * no-op and never fires — callers should use the simulated board instead.
 */
export function subscribeDailyLeaderboard(
  onUpdate: (entries: LeaderboardEntry[]) => void,
  onError?: (err: unknown) => void,
  key = todayKey(),
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
            const data = d.data() as DailyScoreDoc;
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

/** Fallback board used when Firebase is disabled. */
export function simulatedDailyBoard(
  playerScore: number | null,
  name: string,
  avatar: PlayerAvatar
): LeaderboardEntry[] {
  return dailyLeaderboard(playerScore, name || "You", avatar).slice(0, 20);
}
