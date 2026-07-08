import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Difficulty, Opponent, Question, QuizResult } from "../types";
import { buildQuiz, coinsFromScore, xpFromScore } from "../lib/quizEngine";
import { pickOpponent } from "../data/opponents";
import { useQuiz } from "../hooks/useQuiz";
import { useOpponentSim } from "../hooks/useOpponentSim";
import { usePlayerStore } from "../store/playerStore";
import { useOutcomeToasts } from "../hooks/useOutcomeToasts";
import { PageHeader } from "../components/PageHeader";
import { DifficultyPicker } from "../components/DifficultyPicker";
import { QuestionCard } from "../components/QuestionCard";
import { ResultScreen } from "../components/ResultScreen";
import { CountdownOverlay } from "../components/CountdownOverlay";
import { VersusHud } from "../components/VersusHud";
import { Avatar } from "../components/Avatar";
import { MediaBg } from "../components/MediaBg";
import { IMG } from "../lib/assets";
import { sfx } from "../lib/sound";

type Stage = "lobby" | "searching" | "countdown" | "playing";

export function BattlePage() {
  const [stage, setStage] = useState<Stage>("lobby");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const matchHistory = usePlayerStore((s) => s.matchHistory);
  const battles = useMemo(() => matchHistory.filter((m) => m.mode === "battle").slice(0, 8), [matchHistory]);

  const findMatch = () => {
    sfx.click();
    setStage("searching");
    setOpponent(null);
    // Simulated matchmaking delay before an opponent is "found".
    setTimeout(() => {
      setOpponent(pickOpponent(difficulty));
      setQuestions(buildQuiz({ count: 7, difficulty }));
      setTimeout(() => setStage("countdown"), 1400);
    }, 1600 + Math.random() * 1200);
  };

  if (stage === "playing" && opponent) {
    return (
      <BattleMatch
        questions={questions}
        difficulty={difficulty}
        opponent={opponent}
        onRematch={findMatch}
        onExit={() => setStage("lobby")}
      />
    );
  }

  return (
    <div>
      <PageHeader icon="⚔️" title="Multiplayer Battle" subtitle="Seven questions. Two players. Fastest correct answers win." />

      {/* Head-to-head banner */}
      <div className="relative mb-6 hidden h-32 overflow-hidden rounded-3xl border border-(--border-strong) shadow-[var(--card-shadow)] sm:block">
        <MediaBg src={IMG.clash} focal="center 22%" scrim="left" />
        <div className="relative flex h-full flex-col justify-center gap-1 px-8">
          <span className="text-xs font-bold uppercase tracking-widest text-(--color-pitch-300)">Head to head</span>
          <span className="max-w-md text-2xl font-extrabold leading-tight text-white" style={{ fontFamily: "var(--font-display)" }}>
            Outscore your rival before the whistle
          </span>
        </div>
      </div>

      <AnimatePresence>{stage === "countdown" && <CountdownOverlay onDone={() => setStage("playing")} />}</AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-5">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl p-6 sm:p-8 lg:col-span-3"
          aria-label="Matchmaking"
        >
          {stage === "lobby" && (
            <>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-(--text-faint)">Battle difficulty</h2>
              <DifficultyPicker value={difficulty} onChange={setDifficulty} />
              <button onClick={findMatch} className="btn-primary focus-ring mt-8 w-full py-4 text-lg">
                🔍 Find Opponent
              </button>
              <p className="mt-3 text-center text-xs text-(--text-faint)">
                Win streaks earn achievement badges — expert wins earn the rarest.
              </p>
            </>
          )}

          {(stage === "searching" || stage === "countdown") && (
            <div className="flex min-h-72 flex-col items-center justify-center text-center" role="status">
              {!opponent ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
                    className="mb-5 text-5xl"
                    aria-hidden
                  >
                    🌍
                  </motion.div>
                  <div className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
                    Searching for opponents…
                  </div>
                  <div className="mt-2 flex gap-1.5" aria-hidden>
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ repeat: Infinity, duration: 1, delay: i * 0.25 }}
                        className="h-2 w-2 rounded-full bg-(--color-pitch-400)"
                      />
                    ))}
                  </div>
                </>
              ) : (
                <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 240, damping: 16 }}>
                  <div className="mb-3 text-sm font-bold uppercase tracking-widest text-(--color-pitch-400)">Opponent found!</div>
                  <div className="flex items-center justify-center gap-4">
                    <Avatar avatar={opponent.avatar} size={72} />
                    <div className="text-left">
                      <div className="text-xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>
                        {opponent.name} <span aria-hidden>{opponent.country}</span>
                      </div>
                      <div className="text-sm text-(--text-dim)">Skill rating: {"⭐".repeat(Math.max(1, Math.round(opponent.skill * 5)))}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.section>

        <section className="glass rounded-3xl p-5 sm:p-6 lg:col-span-2" aria-label="Recent battles">
          <h2 className="mb-4 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>🕑 Recent Battles</h2>
          {battles.length === 0 ? (
            <p className="text-sm text-(--text-dim)">No battles yet. Your match history will appear here.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {battles.map((b) => (
                <li key={b.id} className="flex items-center gap-3 rounded-2xl border border-(--border) bg-(--surface) p-3 text-sm">
                  <span
                    className={`w-11 shrink-0 rounded-lg px-1.5 py-0.5 text-center text-[10px] font-extrabold ${
                      b.result === "win"
                        ? "bg-(--color-pitch-500)/20 text-(--color-pitch-300)"
                        : b.result === "loss"
                          ? "bg-(--color-danger)/15 text-(--color-danger)"
                          : "bg-(--surface-strong) text-(--text-dim)"
                    }`}
                  >
                    {b.result.toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold">vs {b.opponentName}</span>
                  <span className="font-mono text-xs text-(--text-dim)">
                    {b.score.toLocaleString()}–{(b.opponentScore ?? 0).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export function BattleMatch({
  questions,
  difficulty,
  opponent,
  onRematch,
  onExit,
  headline,
  onWon,
  rematchLabel = "Rematch",
  mode = "battle",
}: {
  questions: Question[];
  difficulty: Difficulty;
  opponent: Opponent;
  onRematch: () => void;
  onExit: () => void;
  headline?: string;
  onWon?: (won: boolean, result: QuizResult) => void;
  rematchLabel?: string;
  mode?: "battle" | "tournament";
}) {
  const quiz = useQuiz(questions, difficulty);
  const playerName = usePlayerStore((s) => s.name);
  const playerAvatar = usePlayerStore((s) => s.avatar);
  const applyResult = usePlayerStore((s) => s.applyResult);
  const notify = useOutcomeToasts();
  const [result, setResult] = useState<QuizResult | null>(null);
  const finishedRef = useRef(false);

  const playing = quiz.phase !== "done";
  const sim = useOpponentSim(opponent, playing ? quiz.index : -1, playing, difficulty);

  // Auto-advance once BOTH sides have answered (player revealed + opponent locked in).
  useEffect(() => {
    if (quiz.phase !== "reveal" || !sim.answeredCurrent) return;
    const t = setTimeout(() => quiz.next(), 2600);
    return () => clearTimeout(t);
  }, [quiz.phase, sim.answeredCurrent, quiz]);

  useEffect(() => {
    if (quiz.phase !== "done" || finishedRef.current) return;
    finishedRef.current = true;
    const won = quiz.score > sim.score;
    const r: QuizResult = {
      mode,
      score: quiz.score,
      correct: quiz.correctCount,
      total: quiz.total,
      bestStreak: quiz.bestStreak,
      answers: quiz.answers,
      difficulty,
      xpEarned: xpFromScore(quiz.score, won),
      coinsEarned: coinsFromScore(quiz.score, won),
      date: new Date().toISOString(),
      opponentName: opponent.name,
      opponentScore: sim.score,
      won,
    };
    setResult(r);
    notify(applyResult(r));
    onWon?.(won, r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.phase]);

  if (result) {
    return (
      <ResultScreen result={result} onPlayAgain={onRematch} playAgainLabel={rematchLabel} headline={headline}>
        <div className="mb-6 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Avatar avatar={playerAvatar} size={32} />
            <span className="font-mono font-bold text-(--color-volt)">{result.score.toLocaleString()}</span>
          </div>
          <span className="text-xs font-black text-(--text-faint)">FT</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold">{sim.score.toLocaleString()}</span>
            <Avatar avatar={opponent.avatar} size={32} />
          </div>
        </div>
      </ResultScreen>
    );
  }

  if (!quiz.question) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={onExit} className="focus-ring text-sm font-semibold text-(--text-dim) hover:text-(--text)">
          ← Forfeit
        </button>
        <span className="chip">
          Q{quiz.index + 1}/{quiz.total}
        </span>
      </div>
      <VersusHud
        playerName={playerName}
        playerAvatar={playerAvatar}
        playerScore={quiz.score}
        opponent={opponent}
        opponentScore={sim.score}
        opponentAnswered={sim.answeredCurrent}
        opponentCorrect={sim.correctCurrent}
        revealed={quiz.phase === "reveal"}
      />
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
          autoAdvance
        />
      </AnimatePresence>
      {quiz.phase === "reveal" && !sim.answeredCurrent && (
        <p className="mt-3 text-center text-xs text-(--text-faint)" role="status">
          Waiting for {opponent.name} to answer…
        </p>
      )}
    </div>
  );
}
