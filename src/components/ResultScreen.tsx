import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { QuizResult } from "../types";
import { accuracyGrade } from "../lib/quizEngine";
import { burstConfetti, goldRain } from "../lib/celebrate";
import { sfx } from "../lib/sound";
import { CountUp } from "./CountUp";

interface ResultScreenProps {
  result: QuizResult;
  onPlayAgain: () => void;
  playAgainLabel?: string;
  headline?: string;
  children?: React.ReactNode;
}

export function ResultScreen({ result, onPlayAgain, playAgainLabel = "Play Again", headline, children }: ResultScreenProps) {
  const pct = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  const { grade, label } = accuracyGrade(pct);
  const isVersus = result.opponentName !== undefined;
  const won = result.won === true;
  const great = pct >= 80;

  useEffect(() => {
    if ((isVersus && won) || (!isVersus && pct === 100)) {
      goldRain();
      sfx.win();
    } else if (!isVersus && great) {
      burstConfetti();
      sfx.win();
    } else if (isVersus && !won) {
      sfx.lose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title =
    headline ??
    (isVersus
      ? won
        ? "VICTORY!"
        : result.opponentScore === result.score
          ? "DRAW"
          : "DEFEAT"
      : label);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
      className="glass-strong mx-auto w-full max-w-2xl rounded-3xl p-6 text-center sm:p-10"
    >
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 12 }}
        className="mx-auto mb-4 text-6xl"
        aria-hidden
      >
        {isVersus ? (won ? "🏆" : result.opponentScore === result.score ? "🤝" : "😤") : great ? "🌟" : pct >= 55 ? "👏" : "📋"}
      </motion.div>

      <h1
        className={`mb-1 text-3xl font-extrabold tracking-tight sm:text-4xl ${won || great ? "text-gradient" : ""}`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h1>
      {isVersus && result.opponentName && (
        <p className="mb-4 text-sm text-(--text-dim)">
          vs {result.opponentName} — {result.score} : {result.opponentScore}
        </p>
      )}

      <div className="my-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ResultStat label="Score" value={<CountUp to={result.score} />} accent />
        <ResultStat label="Accuracy" value={<span>{pct}%</span>} />
        <ResultStat label="Grade" value={<span>{grade}</span>} />
        <ResultStat label="Best Streak" value={<span>{result.bestStreak}🔥</span>} />
      </div>

      <div className="mb-6 flex items-center justify-center gap-4 text-sm font-semibold">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="chip !border-(--color-pitch-500)/40 text-(--color-pitch-300)"
        >
          +{result.xpEarned} XP
        </motion.span>
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="chip !border-(--color-gold)/40 text-(--color-gold)"
        >
          🪙 +{result.coinsEarned}
        </motion.span>
      </div>

      {children}

      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={onPlayAgain} className="btn-primary focus-ring px-8 py-3">
          {playAgainLabel}
        </button>
        <Link to="/" className="btn-ghost focus-ring px-8 py-3">
          Home
        </Link>
      </div>
    </motion.div>
  );
}

function ResultStat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className={`font-mono text-2xl font-bold ${accent ? "text-(--color-volt)" : ""}`}>{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-(--text-faint)">{label}</div>
    </div>
  );
}
