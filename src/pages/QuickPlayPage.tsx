import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Difficulty, Question, QuizResult } from "../types";
import { buildQuiz, coinsFromScore, xpFromScore } from "../lib/quizEngine";
import { useQuiz } from "../hooks/useQuiz";
import { usePlayerStore } from "../store/playerStore";
import { useOutcomeToasts } from "../hooks/useOutcomeToasts";
import { PageHeader } from "../components/PageHeader";
import { DifficultyPicker } from "../components/DifficultyPicker";
import { QuestionCard } from "../components/QuestionCard";
import { ResultScreen } from "../components/ResultScreen";
import { MediaBg } from "../components/MediaBg";
import { IMG } from "../lib/assets";
import { sfx } from "../lib/sound";

type Stage = "setup" | "playing" | "done";

const COUNTS = [10, 15, 20];

export function QuickPlayPage() {
  const [stage, setStage] = useState<Stage>("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<Question[]>([]);

  const start = () => {
    sfx.click();
    setQuestions(buildQuiz({ count, difficulty }));
    setStage("playing");
  };

  return (
    <div>
      <PageHeader icon="⚡" title="Quick Play" subtitle="Random questions across every category. No stakes — just glory." />
      <AnimatePresence mode="wait">
        {stage === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -14 }} className="glass-strong mx-auto max-w-3xl overflow-hidden rounded-3xl">
            {/* Stadium hero */}
            <div className="relative h-40 overflow-hidden sm:h-52">
              <MediaBg src={IMG.stadium} focal="center 58%" scrim="bottom" />
              <div className="relative flex h-full flex-col justify-end p-6">
                <span className="text-xs font-bold uppercase tracking-widest text-(--color-pitch-300)">Match day</span>
                <h2 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
                  Take your place in the stadium
                </h2>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-(--text-faint)">Difficulty</h2>
              <DifficultyPicker value={difficulty} onChange={setDifficulty} />

              <h2 className="mt-7 mb-3 text-sm font-bold uppercase tracking-wider text-(--text-faint)">Questions</h2>
              <div className="flex gap-3" role="radiogroup" aria-label="Number of questions">
                {COUNTS.map((c) => (
                  <button
                    key={c}
                    role="radio"
                    aria-checked={count === c}
                    onClick={() => { setCount(c); sfx.click(); }}
                    className={`focus-ring flex-1 rounded-2xl border p-4 font-mono text-xl font-bold transition ${
                      count === c
                        ? "border-(--color-pitch-400) bg-(--color-pitch-500)/12 text-(--color-pitch-300)"
                        : "border-(--border-strong) bg-(--surface) text-(--text-dim) hover:border-(--color-pitch-600)"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <button onClick={start} className="btn-primary focus-ring mt-8 w-full py-4 text-lg">
                Kick Off ⚽
              </button>
            </div>
          </motion.div>
        )}

        {stage === "playing" && (
          <Match key="playing" questions={questions} difficulty={difficulty} onDone={() => setStage("done")} onRestart={() => setStage("setup")} />
        )}
      </AnimatePresence>
    </div>
  );
}

function Match({
  questions,
  difficulty,
  onRestart,
}: {
  questions: Question[];
  difficulty: Difficulty;
  onDone: () => void;
  onRestart: () => void;
}) {
  const quiz = useQuiz(questions, difficulty);
  const applyResult = usePlayerStore((s) => s.applyResult);
  const notify = useOutcomeToasts();
  const [result, setResult] = useState<QuizResult | null>(null);

  // Finalize exactly once when the quiz completes.
  useEffect(() => {
    if (quiz.phase !== "done" || result) return;
    const r: QuizResult = {
      mode: "quick",
      score: quiz.score,
      correct: quiz.correctCount,
      total: quiz.total,
      bestStreak: quiz.bestStreak,
      answers: quiz.answers,
      difficulty,
      xpEarned: xpFromScore(quiz.score),
      coinsEarned: coinsFromScore(quiz.score),
      date: new Date().toISOString(),
    };
    setResult(r);
    notify(applyResult(r));
  }, [quiz.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (result) {
    return <ResultScreen result={result} onPlayAgain={onRestart} playAgainLabel="New Quiz" />;
  }

  if (!quiz.question) return null;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Immersive stadium backdrop — dimmed & blurred so the glass card stays crisp. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-[1]">
        <img
          src={IMG.stadium}
          alt=""
          className="h-full w-full object-cover"
          style={{ filter: "blur(3px)", transform: "scale(1.06)" }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(4,10,7,0.82) 0%, rgba(4,10,7,0.9) 55%, rgba(4,10,7,0.95) 100%)" }}
        />
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

export function ScoreStrip({ score, index, total, correct }: { score: number; index: number; total: number; correct: number }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex h-1.5 flex-1 gap-1" aria-label={`Question ${index + 1} of ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className="h-full flex-1 rounded-full transition-colors duration-300"
            style={{
              background: i < index ? "var(--color-pitch-500)" : i === index ? "var(--color-volt)" : "var(--surface-strong)",
            }}
          />
        ))}
      </div>
      <div className="font-mono text-sm font-bold">
        <span className="text-(--color-volt)">{score.toLocaleString()}</span>
        <span className="ml-2 text-(--text-faint)">{correct}✓</span>
      </div>
    </div>
  );
}
