import { motion } from "framer-motion";
import type { Opponent, PlayerAvatar } from "../types";
import { Avatar } from "./Avatar";

interface VersusHudProps {
  playerName: string;
  playerAvatar: PlayerAvatar;
  playerScore: number;
  opponent: Opponent;
  opponentScore: number;
  opponentAnswered: boolean;
  opponentCorrect: boolean | null;
  revealed: boolean;
}

/** Live scoreboard strip shown above battle questions. */
export function VersusHud({
  playerName,
  playerAvatar,
  playerScore,
  opponent,
  opponentScore,
  opponentAnswered,
  opponentCorrect,
  revealed,
}: VersusHudProps) {
  const leading = playerScore > opponentScore;
  const trailing = playerScore < opponentScore;

  return (
    <div className="glass mb-4 flex items-center justify-between gap-3 rounded-3xl p-3 sm:p-4" aria-label="Live score">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <Avatar avatar={playerAvatar} size={40} />
        <div className="min-w-0">
          <div className="truncate text-sm font-bold">{playerName || "You"}</div>
          <motion.div
            key={playerScore}
            initial={{ scale: 1.25, color: "#c8ff2e" }}
            animate={{ scale: 1 }}
            className="font-mono text-lg font-bold leading-tight text-(--color-volt)"
          >
            {playerScore.toLocaleString()}
          </motion.div>
        </div>
      </div>

      <div className="flex flex-col items-center px-1">
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold tracking-widest ${
            leading
              ? "bg-(--color-pitch-500)/20 text-(--color-pitch-300)"
              : trailing
                ? "bg-(--color-danger)/15 text-(--color-danger)"
                : "bg-(--surface-strong) text-(--text-dim)"
          }`}
        >
          {leading ? "LEADING" : trailing ? "BEHIND" : "LEVEL"}
        </span>
        <span className="mt-1 text-xs font-black text-(--text-faint)">VS</span>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5 text-right">
        <div className="min-w-0">
          <div className="flex items-center justify-end gap-1.5 truncate text-sm font-bold">
            <span className="truncate">{opponent.name}</span>
            <span aria-hidden>{opponent.country}</span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <AnswerStatus answered={opponentAnswered} correct={opponentCorrect} revealed={revealed} />
            <motion.span
              key={opponentScore}
              initial={{ scale: 1.25 }}
              animate={{ scale: 1 }}
              className="font-mono text-lg font-bold leading-tight"
            >
              {opponentScore.toLocaleString()}
            </motion.span>
          </div>
        </div>
        <Avatar avatar={opponent.avatar} size={40} />
      </div>
    </div>
  );
}

function AnswerStatus({ answered, correct, revealed }: { answered: boolean; correct: boolean | null; revealed: boolean }) {
  if (!answered) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-(--text-faint)" aria-label="Opponent thinking">
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.1 }}
          className="inline-block h-1.5 w-1.5 rounded-full bg-(--color-cyan)"
          aria-hidden
        />
        thinking
      </span>
    );
  }
  // Only reveal whether they got it right once the round is over.
  if (revealed && correct !== null) {
    return <span className="text-xs" aria-label={correct ? "Opponent correct" : "Opponent wrong"}>{correct ? "✅" : "❌"}</span>;
  }
  return <span className="text-[10px] font-semibold text-(--color-pitch-400)">locked in</span>;
}
