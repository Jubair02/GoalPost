import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { QuizResult } from "../types";
import { accuracyGrade } from "../lib/quizEngine";
import { burstConfetti, goldRain } from "../lib/celebrate";
import { sfx } from "../lib/sound";
import { haptics } from "../lib/haptics";
import { IMG } from "../lib/assets";
import { CountUp } from "./CountUp";
import { MediaBg } from "./MediaBg";

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
  const bigWin = (isVersus && won) || (!isVersus && pct === 100);

  const gradeColor = pct >= 80 ? "var(--color-pitch-400)" : pct >= 55 ? "var(--color-gold)" : "var(--color-danger)";

  useEffect(() => {
    if (bigWin) {
      goldRain();
      sfx.win();
      sfx.roar();
      haptics.win();
    } else if (!isVersus && great) {
      burstConfetti();
      sfx.win();
      sfx.roar();
      haptics.win();
    } else if (isVersus && !won) {
      sfx.lose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title =
    headline ??
    (isVersus ? (won ? "VICTORY!" : result.opponentScore === result.score ? "DRAW" : "DEFEAT") : label);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
      className="glass-strong mx-auto w-full max-w-2xl overflow-hidden rounded-3xl text-center"
    >
      {/* Stadium hero */}
      <div className="relative h-44 overflow-hidden sm:h-52">
        <MediaBg src={IMG.stadium} focal="center 52%" scrim="full" />
        <div className="relative flex h-full flex-col items-center justify-center px-6">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 12 }}
            className="mb-1 text-5xl drop-shadow-lg"
            aria-hidden
          >
            {isVersus ? (won ? "🏆" : result.opponentScore === result.score ? "🤝" : "😤") : great ? "🌟" : pct >= 55 ? "👏" : "📋"}
          </motion.div>
          <h1
            className={`text-3xl font-extrabold tracking-tight text-white sm:text-4xl ${won || great ? "text-gradient" : ""}`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h1>
          {isVersus && result.opponentName && (
            <p className="mt-1 text-sm text-white/75">
              vs {result.opponentName} — <span className="led">{result.score} : {result.opponentScore}</span>
            </p>
          )}
        </div>

        {/* Grade stamp — thuds in like a rubber stamp */}
        <motion.div
          initial={{ scale: 2.4, rotate: -24, opacity: 0 }}
          animate={{ scale: 1, rotate: -12, opacity: 1 }}
          transition={{ delay: 0.45, type: "spring", stiffness: 260, damping: 12 }}
          className="absolute right-4 top-4 flex h-16 w-16 flex-col items-center justify-center rounded-full sm:right-6"
          style={{ border: `3px solid ${gradeColor}`, color: gradeColor, background: "rgba(4,10,7,0.45)", boxShadow: `0 0 18px -4px ${gradeColor}` }}
          aria-hidden
        >
          <span className="text-2xl font-extrabold leading-none" style={{ fontFamily: "var(--font-display)" }}>{grade}</span>
          <span className="text-[8px] font-bold uppercase tracking-widest opacity-80">grade</span>
        </motion.div>
      </div>

      <div className="p-6 sm:p-10">
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ResultStat label="Score" value={<CountUp to={result.score} />} accent />
          <ResultStat label="Accuracy" value={<span>{pct}%</span>} />
          <ResultStat label="Correct" value={<span>{result.correct}/{result.total}</span>} />
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
      </div>
    </motion.div>
  );
}

function ResultStat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className={`led text-2xl ${accent ? "text-(--color-volt)" : ""}`}>{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-(--text-faint)">{label}</div>
    </div>
  );
}
