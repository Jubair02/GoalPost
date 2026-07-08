import { memo, useRef } from "react";
import { motion } from "framer-motion";
import type { LeaderboardEntry } from "../types";
import { Avatar } from "./Avatar";

const MEDALS = ["🥇", "🥈", "🥉"];

/** ▲/▼/– indicator comparing a name's current rank to its previous rank. */
function Movement({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="w-4" aria-hidden />;
  if (delta === 0) return <span className="w-4 text-center text-[10px] text-(--text-faint)" aria-label="no change">–</span>;
  const up = delta > 0;
  return (
    <span
      className={`w-4 text-center text-[10px] font-bold ${up ? "text-(--color-pitch-400)" : "text-(--color-danger)"}`}
      aria-label={up ? `up ${delta}` : `down ${-delta}`}
    >
      {up ? "▲" : "▼"}
    </span>
  );
}

function Row({ e, delta, index }: { e: LeaderboardEntry; delta: number | null; index: number }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5), layout: { type: "spring", stiffness: 400, damping: 32 } }}
      className={`flex items-center gap-3 rounded-2xl border p-3 ${
        e.isPlayer ? "border-(--color-pitch-500)/60 bg-(--color-pitch-500)/10" : "border-(--border) bg-(--surface)"
      }`}
    >
      <span className="led w-7 text-center text-sm text-(--text-dim)">{e.rank}</span>
      <Movement delta={delta} />
      <Avatar avatar={e.avatar} size={36} />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
        {e.name}
        {e.isPlayer && <span className="ml-2 text-xs text-(--color-pitch-400)">YOU</span>}
      </span>
      {e.country && <span aria-hidden>{e.country}</span>}
      <span className="led text-sm text-(--color-volt)">{e.score.toLocaleString()}</span>
    </motion.li>
  );
}

export const LeaderboardList = memo(function LeaderboardList({
  entries,
  loading,
  player,
}: {
  entries: LeaderboardEntry[];
  loading?: boolean;
  /** The player's full entry, so it can be pinned when outside the visible list. */
  player?: LeaderboardEntry;
}) {
  // Remember each name's previous rank so we can show live movement arrows.
  const prevRanks = useRef<Map<string, number>>(new Map());
  const deltaFor = (e: LeaderboardEntry): number | null => {
    const prev = prevRanks.current.get(e.name);
    return prev === undefined ? null : prev - e.rank; // positive = climbed
  };
  if (!loading) {
    const next = new Map<string, number>();
    entries.forEach((e) => next.set(e.name, e.rank));
    prevRanks.current = next;
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2" aria-label="Loading leaderboard">
        <div className="skeleton mb-2 h-24 w-full" />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton h-14 w-full" />
        ))}
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  // Podium display order: 2nd, 1st, 3rd (1st raised in the middle).
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heights = new Map<number, string>([
    [1, "h-24"],
    [2, "h-20"],
    [3, "h-16"],
  ]);

  return (
    <div>
      {/* Podium for the top 3 */}
      {top3.length >= 3 && (
        <div className="mb-4 grid grid-cols-3 items-end gap-2">
          {podiumOrder.map((e) => (
            <motion.div
              key={`${e.rank}-${e.name}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: e.rank * 0.08, type: "spring", stiffness: 200, damping: 20 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-1">
                <div style={{ filter: e.rank === 1 ? "drop-shadow(0 0 10px var(--glow-pitch))" : undefined }}>
                  <Avatar avatar={e.avatar} size={e.rank === 1 ? 52 : 42} />
                </div>
                <span className="absolute -right-1 -top-1 text-base" aria-hidden>{MEDALS[e.rank - 1]}</span>
              </div>
              <span className="max-w-full truncate text-xs font-bold">{e.name}{e.isPlayer && " (You)"}</span>
              <span className="led text-xs text-(--color-volt)">{e.score.toLocaleString()}</span>
              <div
                className={`mt-1 w-full rounded-t-xl border-t border-(--border-strong) ${heights.get(e.rank)}`}
                style={{
                  background:
                    e.rank === 1
                      ? "linear-gradient(180deg, var(--color-gold)55, transparent)"
                      : "linear-gradient(180deg, var(--surface-strong), transparent)",
                }}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Remaining ranks (or all, if fewer than 3) */}
      <ol className="flex flex-col gap-2">
        {(top3.length >= 3 ? rest : entries).map((e, i) => (
          <Row key={`${e.rank}-${e.name}`} e={e} delta={deltaFor(e)} index={i} />
        ))}
      </ol>

      {/* Pin the player's own row if they're outside the visible list */}
      {player && !entries.some((e) => e.isPlayer) && (
        <div className="mt-3 border-t border-(--border) pt-3">
          <div className="mb-1 text-center text-[10px] font-bold uppercase tracking-wider text-(--text-faint)">Your position</div>
          <Row e={player} delta={deltaFor(player)} index={0} />
        </div>
      )}
    </div>
  );
});
