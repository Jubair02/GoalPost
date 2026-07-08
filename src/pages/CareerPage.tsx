import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CategoryId, Difficulty, Question, QuizResult } from "../types";
import { CATEGORIES } from "../data/categories";
import { buildQuiz, coinsFromScore, xpFromScore } from "../lib/quizEngine";
import { useQuiz } from "../hooks/useQuiz";
import { usePlayerStore, useLevel, categoryAccuracy } from "../store/playerStore";
import { useOutcomeToasts } from "../hooks/useOutcomeToasts";
import { PageHeader } from "../components/PageHeader";
import { DifficultyPicker } from "../components/DifficultyPicker";
import { QuestionCard } from "../components/QuestionCard";
import { ResultScreen } from "../components/ResultScreen";
import { ProgressRing } from "../components/ProgressRing";
import { MediaBg } from "../components/MediaBg";
import { ScoreStrip } from "./QuickPlayPage";
import { sfx } from "../lib/sound";

export function CareerPage() {
  const level = useLevel();
  const perf = usePlayerStore((s) => s.categoryPerformance);
  const [selected, setSelected] = useState<CategoryId | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questions, setQuestions] = useState<Question[] | null>(null);

  const selectedMeta = CATEGORIES.find((c) => c.id === selected);
  const unlockedCount = CATEGORIES.filter((c) => c.unlockLevel <= level.level).length;

  const start = () => {
    if (!selected) return;
    sfx.click();
    setQuestions(buildQuiz({ count: 10, difficulty, categories: [selected] }));
  };

  if (questions && selected) {
    return (
      <CareerMatch
        questions={questions}
        difficulty={difficulty}
        category={selected}
        onExit={() => {
          setQuestions(null);
          setSelected(null);
        }}
        onReplay={() => setQuestions(buildQuiz({ count: 10, difficulty, categories: [selected] }))}
      />
    );
  }

  return (
    <div>
      <PageHeader
        icon="📈"
        title="Career Mode"
        subtitle={`Master all 24 categories. Level up to unlock more. ${unlockedCount}/24 unlocked.`}
        right={
          <span className="chip">
            Lv {level.level} · {level.title}
          </span>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CATEGORIES.map((cat, i) => {
          const locked = cat.unlockLevel > level.level;
          const acc = categoryAccuracy(perf, cat.id);
          const mastered = acc !== null && acc >= 80 && (perf[cat.id]?.played ?? 0) >= 10;
          const showImage = !locked && !!cat.image;
          return (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.5) }}
              whileHover={!locked ? { y: -4 } : undefined}
              disabled={locked}
              onClick={() => { setSelected(cat.id); sfx.click(); }}
              aria-label={locked ? `${cat.name} — unlocks at level ${cat.unlockLevel}` : cat.name}
              className={`focus-ring relative flex min-h-[150px] flex-col justify-between overflow-hidden rounded-3xl border p-5 text-left transition ${
                locked
                  ? "border-(--border) bg-(--surface) opacity-55"
                  : showImage
                    ? "border-(--border-strong) hover:border-(--color-pitch-400)"
                    : "glass border-(--border-strong) hover:border-(--color-pitch-500)"
              }`}
            >
              {showImage ? (
                <MediaBg src={cat.image!} focal={cat.focal} scrim="bottom" />
              ) : (
                <div aria-hidden className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${cat.gradient}`} />
              )}
              <div className="relative flex items-start justify-between">
                <span className="text-3xl drop-shadow-lg" aria-hidden>{locked ? "🔒" : cat.icon}</span>
                {mastered && <span className="chip !border-(--color-gold)/50 !bg-black/40 text-(--color-gold)">★ Mastered</span>}
                {!locked && acc !== null && !mastered && (
                  <ProgressRing progress={acc / 100} size={40} stroke={4} color={acc >= 60 ? "var(--color-pitch-400)" : "var(--color-gold)"}>
                    <span className={`font-mono text-[10px] font-bold ${showImage ? "text-white" : ""}`}>{acc}</span>
                  </ProgressRing>
                )}
              </div>
              <div className="relative mt-3">
                <div className={`font-bold ${showImage ? "text-white" : ""}`} style={{ fontFamily: "var(--font-display)" }}>{cat.name}</div>
                <div className={`mt-0.5 text-xs ${showImage ? "text-white/75" : "text-(--text-dim)"}`}>
                  {locked ? `Unlocks at level ${cat.unlockLevel}` : cat.blurb}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Category start sheet */}
      <AnimatePresence>
        {selectedMeta && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
            style={{ background: "color-mix(in srgb, var(--bg) 75%, transparent)", backdropFilter: "blur(6px)" }}
            onClick={() => setSelected(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`Start ${selectedMeta.name} quiz`}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong w-full max-w-xl rounded-t-3xl p-6 sm:rounded-3xl sm:p-8"
            >
              <div className="mb-1 text-4xl" aria-hidden>{selectedMeta.icon}</div>
              <h2 className="text-xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>{selectedMeta.name}</h2>
              <p className="mb-5 text-sm text-(--text-dim)">{selectedMeta.blurb} · 10 questions</p>
              <DifficultyPicker value={difficulty} onChange={setDifficulty} />
              <div className="mt-6 flex gap-3">
                <button onClick={() => setSelected(null)} className="btn-ghost focus-ring flex-1 py-3">
                  Cancel
                </button>
                <button onClick={start} className="btn-primary focus-ring flex-1 py-3">
                  Start ⚽
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CareerMatch({
  questions,
  difficulty,
  category,
  onExit,
  onReplay,
}: {
  questions: Question[];
  difficulty: Difficulty;
  category: CategoryId;
  onExit: () => void;
  onReplay: () => void;
}) {
  const quiz = useQuiz(questions, difficulty);
  const applyResult = usePlayerStore((s) => s.applyResult);
  const notify = useOutcomeToasts();
  const [result, setResult] = useState<QuizResult | null>(null);
  const meta = CATEGORIES.find((c) => c.id === category)!;

  useEffect(() => {
    if (quiz.phase !== "done" || result) return;
    const r: QuizResult = {
      mode: "career",
      score: quiz.score,
      correct: quiz.correctCount,
      total: quiz.total,
      bestStreak: quiz.bestStreak,
      answers: quiz.answers,
      difficulty,
      // Career pays a 25% XP premium to reward focused study.
      xpEarned: Math.round(xpFromScore(quiz.score) * 1.25),
      coinsEarned: coinsFromScore(quiz.score),
      date: new Date().toISOString(),
    };
    setResult(r);
    notify(applyResult(r));
  }, [quiz.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (result) {
    return (
      <ResultScreen result={result} onPlayAgain={onReplay} playAgainLabel={`Replay ${meta.icon}`} headline={undefined}>
        <p className="mb-6 text-sm text-(--text-dim)">
          Category: {meta.icon} {meta.name} — career XP bonus applied (+25%)
        </p>
      </ResultScreen>
    );
  }

  if (!quiz.question) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={onExit} className="focus-ring text-sm font-semibold text-(--text-dim) hover:text-(--text)">
          ← Categories
        </button>
        <span className="chip">{meta.icon} {meta.name}</span>
      </div>
      <ScoreStrip score={quiz.score} index={quiz.index} total={quiz.total} correct={quiz.correctCount} />
      <AnimatePresence mode="wait">
        <QuestionCard
          key={quiz.question.id}
          question={quiz.question}
          index={quiz.index}
          total={quiz.total}
          phase={quiz.phase === "reveal" ? "reveal" : "question"}
          selected={quiz.selected}
          timeLeftMs={quiz.timeLeftMs}
          totalTimeMs={quiz.totalTimeMs}
          streak={quiz.streak}
          lastPoints={quiz.lastPoints}
          onAnswer={quiz.answer}
          onNext={quiz.next}
          nextLabel={quiz.index + 1 >= quiz.total ? "Full Time" : "Next"}
        />
      </AnimatePresence>
    </div>
  );
}
