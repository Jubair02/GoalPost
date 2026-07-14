/**
 * Challenge-by-code live Battle (Phase 1, Spark-friendly, no Cloud Functions).
 *
 * Two players share a short code. One hosts (creates a match doc), the other
 * joins with the code. Both build the SAME 7 questions from a shared `seed`
 * (deterministic buildQuiz), then each writes only their own progress into
 * `matches/{code}/players/{uid}` and reads the opponent's from the same
 * subcollection in real time. There is no server to arbitrate, so scores are
 * client-reported (fine for a friendly head-to-head); security rules restrict
 * each player to writing their own row. See firestore.rules.
 *
 * Firestore layout:
 *   matches/{code}                       — { seed, difficulty, count, hostUid, guestUid?, status }
 *   matches/{code}/players/{uid}         — live per-player state (score, index, …)
 */
import type { Difficulty, PlayerAvatar } from "../types";
import { firebaseEnabled, getFirebase } from "./firebase";

// Unambiguous alphabet (no O/0, I/1) so codes are easy to read aloud/type.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LEN = 5;
const QUESTION_COUNT = 7;

function genCode(): string {
  let s = "";
  for (let i = 0; i < CODE_LEN; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return s;
}

export type MatchStatus = "waiting" | "active" | "done";

export interface LiveMatch {
  code: string;
  seed: number;
  difficulty: Difficulty;
  count: number;
  hostUid: string;
  guestUid?: string;
  status: MatchStatus;
}

export interface LivePlayer {
  uid: string;
  name: string;
  avatar: PlayerAvatar;
  score: number;
  correctCount: number;
  index: number;
  answeredCurrent: boolean;
  correctCurrent: boolean | null;
  finished: boolean;
  /** Client Date.now(); used only to detect that the value CHANGED (heartbeat),
   *  never compared across devices, so clock skew doesn't matter. */
  lastSeen: number;
}

export interface JoinResult {
  match: LiveMatch;
  uid: string;
}

function blankPlayer(uid: string, name: string, avatar: PlayerAvatar): LivePlayer {
  return {
    uid,
    name: name || "Player",
    avatar,
    score: 0,
    correctCount: 0,
    index: 0,
    answeredCurrent: false,
    correctCurrent: null,
    finished: false,
    lastSeen: Date.now(),
  };
}

/** Host: create a fresh match with a unique code and seed the host's row. */
export async function createMatch(difficulty: Difficulty, name: string, avatar: PlayerAvatar): Promise<JoinResult> {
  if (!firebaseEnabled) throw new Error("Online play needs a connection.");
  const { db, uid } = await getFirebase();
  const { doc, getDoc, setDoc } = await import("firebase/firestore");
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = genCode();
    const ref = doc(db, "matches", code);
    if ((await getDoc(ref)).exists()) continue; // extremely unlikely collision
    const seed = Math.floor(Math.random() * 1_000_000_000);
    await setDoc(ref, { seed, difficulty, count: QUESTION_COUNT, hostUid: uid, status: "waiting", createdAt: Date.now() });
    await setDoc(doc(db, "matches", code, "players", uid), blankPlayer(uid, name, avatar));
    return { match: { code, seed, difficulty, count: QUESTION_COUNT, hostUid: uid, status: "waiting" }, uid };
  }
  throw new Error("Couldn't create a match code — please try again.");
}

/** Guest: claim a waiting match by code (transactionally) and seed their row. */
export async function joinMatch(codeInput: string, name: string, avatar: PlayerAvatar): Promise<JoinResult> {
  if (!firebaseEnabled) throw new Error("Online play needs a connection.");
  const code = codeInput.trim().toUpperCase();
  if (code.length < CODE_LEN) throw new Error("Enter the full match code.");
  const { db, uid } = await getFirebase();
  const { doc, setDoc, runTransaction } = await import("firebase/firestore");
  const ref = doc(db, "matches", code);
  const data = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("No match found for that code.");
    const d = snap.data() as Record<string, unknown>;
    if (d.hostUid === uid) throw new Error("That's your own match code.");
    if (d.status !== "waiting" || d.guestUid) throw new Error("That match has already started.");
    tx.update(ref, { guestUid: uid, status: "active" });
    return d;
  });
  await setDoc(doc(db, "matches", code, "players", uid), blankPlayer(uid, name, avatar));
  return {
    match: {
      code,
      seed: data.seed as number,
      difficulty: data.difficulty as Difficulty,
      count: (data.count as number) ?? QUESTION_COUNT,
      hostUid: data.hostUid as string,
      guestUid: uid,
      status: "active",
    },
    uid,
  };
}

/** Stream the match doc (status changes: waiting → active → done, or deleted). */
export function subscribeMatch(code: string, cb: (m: LiveMatch | null) => void): () => void {
  let unsub = () => {};
  let cancelled = false;
  (async () => {
    try {
      const { db } = await getFirebase();
      const { doc, onSnapshot } = await import("firebase/firestore");
      if (cancelled) return;
      unsub = onSnapshot(
        doc(db, "matches", code),
        (snap) => {
          if (!snap.exists()) return cb(null);
          const d = snap.data() as Record<string, unknown>;
          cb({
            code,
            seed: d.seed as number,
            difficulty: d.difficulty as Difficulty,
            count: (d.count as number) ?? QUESTION_COUNT,
            hostUid: d.hostUid as string,
            guestUid: d.guestUid as string | undefined,
            status: d.status as MatchStatus,
          });
        },
        () => cb(null)
      );
    } catch {
      cb(null);
    }
  })();
  return () => {
    cancelled = true;
    unsub();
  };
}

/** Stream both players' live rows. */
export function subscribePlayers(code: string, cb: (players: LivePlayer[]) => void): () => void {
  let unsub = () => {};
  let cancelled = false;
  (async () => {
    try {
      const { db } = await getFirebase();
      const { collection, onSnapshot } = await import("firebase/firestore");
      if (cancelled) return;
      unsub = onSnapshot(
        collection(db, "matches", code, "players"),
        (snap) => cb(snap.docs.map((d) => d.data() as LivePlayer)),
        () => {}
      );
    } catch {
      /* ignore */
    }
  })();
  return () => {
    cancelled = true;
    unsub();
  };
}

/** Write (merge) this player's own progress. Always refreshes lastSeen. */
export async function publishProgress(code: string, uid: string, partial: Partial<LivePlayer>): Promise<void> {
  try {
    const { db } = await getFirebase();
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "matches", code, "players", uid), { ...partial, lastSeen: Date.now() }, { merge: true });
  } catch {
    /* best-effort — never break the match on a failed write */
  }
}

/** Leave/clean up: remove own row, and (host only) the match doc. */
export async function closeMatch(code: string, isHost: boolean): Promise<void> {
  try {
    const { db, uid } = await getFirebase();
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "matches", code, "players", uid)).catch(() => {});
    if (isHost) await deleteDoc(doc(db, "matches", code)).catch(() => {});
  } catch {
    /* ignore */
  }
}
