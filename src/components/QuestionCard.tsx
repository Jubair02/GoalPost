import { motion, AnimatePresence } from "framer-motion";
import type { Question } from "../types";
import { CATEGORY_MAP } from "../data/categories";
import { commentary } from "../data/commentary";
import { ProgressRing } from "./ProgressRing";

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  phase: "question" | "reveal";
  selected: number | null;
  timeLeftMs: number;
  totalTimeMs: number;
  streak: number;
  lastPoints: number;
  onAnswer: (option: number) => void;
  onNext: () => void;
  nextLabel?: string;
  /** Hide the Next button (battle mode auto-advances). */
  autoAdvance?: boolean;
}

const OPTION_KEYS = ["A", "B", "C", "D"];

export function QuestionCard({
  question,
  index,
  total,
  phase,
  selected,
  timeLeftMs,
  totalTimeMs,
  streak,
  lastPoints,
  onAnswer,
  onNext,
  nextLabel = "Next",
  autoAdvance = false,
}: QuestionCardProps) {
  const meta = CATEGORY_MAP[question.category];
  const secondsLeft = Math.ceil(timeLeftMs / 1000);
  const urgent = phase === "question" && timeLeftMs <= 5000;
  const revealed = phase === "reveal";
  const timePct = Math.max(0, Math.min(1, timeLeftMs / totalTimeMs));

  const wasCorrect = revealed && selected === question.answer;
  const wasWrong = revealed && selected !== null && selected !== question.answer;
  const timedOut = revealed && selected === null;
  const seed = question.id.split("").reduce((h, c) => h + c.charCodeAt(0), 0);

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 60, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -60, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="glass-strong relative w-full overflow-hidden rounded-3xl p-5 sm:p-8"
    >
      {/* Timer drain bar across the top edge */}
      <div className="absolute inset-x-0 top-0 h-1.5 bg-black/20" aria-hidden>
        <div
          className="h-full origin-left rounded-r-full transition-[width] duration-150 ease-linear"
          style={{
            width: `${timePct * 100}%`,
            background: urgent
              ? "linear-gradient(90deg, var(--color-danger), #ff8a3d)"
              : "linear-gradient(90deg, var(--color-pitch-500), var(--color-volt))",
          }}
        />
      </div>

      {/* Goal / card feedback flash */}
      <AnimatePresence>
        {wasCorrect && (
          <motion.div
            key="goal"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.7 }}
            className="pointer-events-none absolute inset-0 z-10"
            style={{ background: "radial-gradient(circle at 50% 40%, rgba(0,222,95,0.5), transparent 65%)" }}
            aria-hidden
          />
        )}
        {(wasWrong || timedOut) && (
          <motion.div
            key="refcard"
            initial={{ opacity: 0, y: -8, rotate: -18, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, rotate: 5, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 300, damping: 16 }}
            className="pointer-events-none absolute right-5 top-5 z-10 h-11 w-8 rounded-sm shadow-lg"
            style={{ background: "linear-gradient(160deg, #ffd11a, #f5b400)", boxShadow: "0 6px 18px -4px rgba(0,0,0,0.5)" }}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* Header row */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="chip" aria-hidden>
            {meta.icon} <span className="hidden sm:inline">{meta.name}</span>
          </span>
          <span className="led text-sm text-(--text-dim)">
            Q{index + 1}<span className="text-(--text-faint)">/{total}</span>
          </span>
          <AnimatePresence>
            {streak >= 3 && (
              <motion.span
                initial={{ scale: 0, rotate: -12, x: -10 }}
                animate={{ scale: 1, rotate: 0, x: 0 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1 rounded-full border border-orange-400/50 bg-gradient-to-r from-orange-500/25 to-amber-500/10 px-2.5 py-1 text-xs font-extrabold text-orange-300"
              >
                <motion.span animate={{ scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 0.9 }} aria-hidden>🔥</motion.span>
                {streak} STREAK
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <ProgressRing
          progress={timePct}
          size={54}
          stroke={5}
          color={urgent ? "var(--color-danger)" : "var(--color-pitch-400)"}
          label="Time remaining"
        >
          <motion.span
            key={secondsLeft}
            initial={urgent ? { scale: 1.4 } : false}
            animate={{ scale: 1 }}
            className={`led led-glow text-sm ${urgent ? "text-(--color-danger)" : "text-(--text)"}`}
          >
            {secondsLeft}
          </motion.span>
        </ProgressRing>
      </div>

      {/* Question */}
      <h2 className="mb-6 text-lg font-bold leading-snug sm:text-2xl" style={{ fontFamily: "var(--font-display)" }}>
        {question.question}
      </h2>

      {/* Options */}
      <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Answer options">
        {question.options.map((option, i) => {
          const isAnswer = i === question.answer;
          const isSelected = i === selected;
          let state = "idle";
          if (revealed) {
            if (isAnswer) state = "correct";
            else if (isSelected) state = "wrong";
            else state = "dimmed";
          }
          return (
            <motion.button
              key={i}
              whileHover={!revealed ? { scale: 1.02, y: -2 } : undefined}
              whileTap={!revealed ? { scale: 0.97 } : undefined}
              animate={
                state === "wrong"
                  ? { x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.4 } }
                  : state === "correct" && revealed
                    ? { scale: [1, 1.04, 1], transition: { duration: 0.45 } }
                    : {}
              }
              onClick={() => onAnswer(i)}
              disabled={revealed}
              className={`focus-ring flex items-center gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition-colors sm:text-base ${
                state === "correct"
                  ? "border-(--color-pitch-400) bg-(--color-pitch-500)/15 text-(--color-pitch-300)"
                  : state === "wrong"
                    ? "border-(--color-danger) bg-(--color-danger)/10 text-(--color-danger)"
                    : state === "dimmed"
                      ? "border-(--border) bg-(--surface) opacity-45"
                      : "border-(--border-strong) bg-(--surface) hover:border-(--color-pitch-500) hover:bg-(--surface-strong)"
              }`}
            >
              {/* Kit-number style option marker */}
              <span
                aria-hidden
                className={`led flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm ${
                  state === "correct"
                    ? "bg-(--color-pitch-500) text-black"
                    : state === "wrong"
                      ? "bg-(--color-danger) text-white"
                      : "bg-(--surface-strong) text-(--text-dim) ring-1 ring-(--border-strong)"
                }`}
                style={{ textShadow: state === "idle" ? "0 1px 1px rgba(0,0,0,0.4)" : undefined }}
              >
                {revealed && isAnswer ? "✓" : revealed && isSelected ? "✗" : OPTION_KEYS[i]}
              </span>
              {option}
            </motion.button>
          );
        })}
      </div>

      {/* Reveal: commentary + explanation + points */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {/* Commentary line */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`mt-5 text-sm font-bold ${wasCorrect ? "text-(--color-pitch-300)" : "text-(--color-danger)"}`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {commentary(wasCorrect ? "correct" : timedOut ? "timeout" : "wrong", seed)}
            </motion.div>

            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="glass flex-1 rounded-2xl p-4 text-sm leading-relaxed text-(--text-dim)">
                <span className="mr-2" aria-hidden>💡</span>
                {question.explanation}
              </div>
              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                {lastPoints > 0 ? (
                  <motion.div
                    initial={{ scale: 0.4, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    className="led text-xl text-(--color-volt)"
                  >
                    +{lastPoints}
                  </motion.div>
                ) : (
                  <div className="led text-xl text-(--text-faint)">+0</div>
                )}
                {!autoAdvance && (
                  <button onClick={onNext} className="btn-primary focus-ring px-6 py-2.5 text-sm" autoFocus>
                    {nextLabel} →
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
