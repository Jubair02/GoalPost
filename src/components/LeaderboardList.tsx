import { motion } from "framer-motion";
import type { LeaderboardEntry } from "../types";
import { Avatar } from "./Avatar";

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardList({ entries, loading }: { entries: LeaderboardEntry[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2" aria-label="Loading leaderboard">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="skeleton h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {entries.map((e, i) => (
        <motion.li
          key={`${e.rank}-${e.name}`}
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(i * 0.04, 0.6) }}
          className={`flex items-center gap-3 rounded-2xl border p-3 ${
            e.isPlayer
              ? "border-(--color-pitch-500)/60 bg-(--color-pitch-500)/10"
              : "border-(--border) bg-(--surface)"
          }`}
        >
          <span className="w-8 text-center font-mono text-sm font-bold text-(--text-dim)">
            {e.rank <= 3 ? MEDALS[e.rank - 1] : e.rank}
          </span>
          <Avatar avatar={e.avatar} size={36} />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">
            {e.name}
            {e.isPlayer && <span className="ml-2 text-xs text-(--color-pitch-400)">YOU</span>}
          </span>
          {e.country && <span aria-hidden>{e.country}</span>}
          <span className="font-mono text-sm font-bold text-(--color-volt)">{e.score.toLocaleString()}</span>
        </motion.li>
      ))}
    </ol>
  );
}
