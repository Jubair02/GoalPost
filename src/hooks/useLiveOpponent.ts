import { useEffect, useRef, useState } from "react";
import type { PlayerAvatar } from "../types";
import { subscribePlayers, type LivePlayer } from "../services/liveBattle";

export interface LiveOpponentState {
  /** The opponent's row exists (they've joined and seeded their state). */
  joined: boolean;
  /** We've heard from them recently (heartbeat within the staleness window). */
  present: boolean;
  name: string;
  avatar: PlayerAvatar;
  score: number;
  correctCount: number;
  index: number;
  answeredCurrent: boolean;
  correctCurrent: boolean | null;
  finished: boolean;
}

// Consider the opponent disconnected if their row hasn't changed for this long.
// They heartbeat every ~5s, so ~18s of silence means they're really gone.
const STALE_MS = 18_000;

const FALLBACK_AVATAR: PlayerAvatar = { emoji: "⚽", color: "#00de5f" };

/**
 * Live view of the OTHER player in a match. Presence is derived from the
 * opponent's `lastSeen` value CHANGING (a heartbeat), never from comparing
 * their clock to ours — so device clock skew can't produce false disconnects.
 */
export function useLiveOpponent(code: string, myUid: string): LiveOpponentState {
  const [opp, setOpp] = useState<LivePlayer | null>(null);
  const [present, setPresent] = useState(false);
  const lastBeatAt = useRef(0); // local time of the last opponent change
  const prevLastSeen = useRef<number | null>(null);

  useEffect(() => {
    prevLastSeen.current = null;
    lastBeatAt.current = 0;
    setPresent(false);
    const unsub = subscribePlayers(code, (players) => {
      const other = players.find((p) => p.uid !== myUid) ?? null;
      // Only treat it as a heartbeat when THEIR row actually changed — our own
      // writes also fire this snapshot, and must not reset their liveness.
      if (other && other.lastSeen !== prevLastSeen.current) {
        prevLastSeen.current = other.lastSeen;
        lastBeatAt.current = Date.now();
        setPresent(true);
      }
      setOpp(other);
    });
    return unsub;
  }, [code, myUid]);

  useEffect(() => {
    const t = setInterval(() => {
      if (lastBeatAt.current && Date.now() - lastBeatAt.current > STALE_MS) setPresent(false);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return {
    joined: !!opp,
    present: !!opp && present,
    name: opp?.name ?? "Opponent",
    avatar: opp?.avatar ?? FALLBACK_AVATAR,
    score: opp?.score ?? 0,
    correctCount: opp?.correctCount ?? 0,
    index: opp?.index ?? 0,
    answeredCurrent: opp?.answeredCurrent ?? false,
    correctCurrent: opp?.correctCurrent ?? null,
    finished: opp?.finished ?? false,
  };
}
