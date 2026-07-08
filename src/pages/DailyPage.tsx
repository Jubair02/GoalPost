import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LeaderboardEntry, QuizResult } from "../types";
import { buildDailyQuiz, msUntilNextDaily, todayKey } from "../lib/daily";
import { coinsFromScore, xpFromScore } from "../lib/quizEngine";
import {
  leaderboardIsLive,
  simulatedDailyBoard,
  submitDailyScore,
  subscribeDailyLeaderboard,
} from "../services/leaderboard";
import { useQuiz } from "../hooks/useQuiz";
import { usePlayerStore } from "../store/playerStore";
import { useOutcomeToasts } from "../hooks/useOutcomeToasts";
import { PageHeader } from "../components/PageHeader";
import { QuestionCard } from "../components/QuestionCard";
import { ResultScreen } from "../components/ResultScreen";
import { LeaderboardList } from "../components/LeaderboardList";
import { MediaBg } from "../components/MediaBg";
import { IMG } from "../lib/assets";
import { ScoreStrip } from "./QuickPlayPage";
import { sfx } from "../lib/sound";

/**
 * Live leaderboard when Firebase is configured (streams via onSnapshot),
 * deterministic local simulation otherwise. The player's own entry is merged
 * from their latest score so it shows immediately even before the write echoes.
 */
function useDailyLeaderboard(
  playerScore: number | null,
  name: string,
  avatar: { emoji: string; color: string }
): { entries: LeaderboardEntry[]; loading: boolean; live: boolean } {
  const configured = leaderboardIsLive();
  const [remote, setRemote] = useState<LeaderboardEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [simLoading, setSimLoading] = useState(true);
  const live = configured && !failed;

  useEffect(() => {
    if (!configured) return;
    const unsub = subscribeDailyLeaderboard(
      (entries) => setRemote(entries),
      () => setFailed(true) // Firebase unreachable/misconfigured → fall back to demo board.
    );
    return unsub;
  }, [configured]);

  useEffect(() => {
    if (live) return;
    const t = setTimeout(() => setSimLoading(false), 700);
    return () => clearTimeout(t);
  }, [live]);

  if (!live) {
    return { entries: simulatedDailyBoard(playerScore, name, avatar), loading: simLoading, live };
  }

  if (remote === null) return { entries: [], loading: true, live };

  // Ensure the player sees their own score instantly even if the write is in flight.
  let entries = remote;
  if (playerScore !== null && !remote.some((e) => e.isPlayer)) {
    entries = [...remote, { rank: 0, name: name || "You", avatar, country: "⭐", score: playerScore, isPlayer: true }]
      .sort((a, b) => b.score - a.score)
      .map((e, i) => ({ ...e, rank: i + 1 }));
  }
  return { entries, loading: false, live };
}

function useCountdown() {
  const [ms, setMs] = useState(msUntilNextDaily());
  useEffect(() => {
    const t = setInterval(() => setMs(msUntilNextDaily()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function DailyPage() {
  const lastDaily = usePlayerStore((s) => s.lastDailyChallengeDate);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState<QuizResult | null>(null);
  const alreadyDone = lastDaily === todayKey() && !finished;

  if (playing && !finished) {
    return <DailyMatch onFinish={(r) => { setFinished(r); setPlaying(false); }} />;
  }

  return <DailyLobby alreadyDone={alreadyDone} result={finished} onStart={() => { sfx.click(); setPlaying(true); }} />;
}

function DailyLobby({ alreadyDone, result, onStart }: { alreadyDone: boolean; result: QuizResult | null; onStart: () => void }) {
  const countdown = useCountdown();
  const name = usePlayerStore((s) => s.name);
  const avatar = usePlayerStore((s) => s.avatar);
  const dailyBest = usePlayerStore((s) => s.dailyChallengeBest);
  const dailyScore = usePlayerStore((s) => s.dailyChallengeScore);
  const lastDaily = usePlayerStore((s) => s.lastDailyChallengeDate);

  const playedToday = alreadyDone || result !== null;
  // The leaderboard reflects TODAY's score, never the all-time best — otherwise
  // the player's row and their "best" line disagree after a lower-scoring day.
  const todayStored = lastDaily === todayKey() && Number.isFinite(dailyScore) ? dailyScore : null;
  const playerScore = playedToday ? (result?.score ?? todayStored) : null;

  const { entries: board, loading: boardLoading, live } = useDailyLeaderboard(playerScore, name || "You", avatar);
  const playerEntry = board.find((e) => e.isPlayer);
  // Authoritative "today" score for display: the live board row if present,
  // else the local value. Guarantees the completed box matches the board row.
  const displayScore = playerEntry?.score ?? playerScore ?? 0;

  return (
    <div>
      <PageHeader
        icon="📅"
        title="Daily Challenge"
        subtitle="Ten questions, one attempt, the whole world on the same quiz."
        right={
          <span className="chip font-mono" title="Time until next challenge">
            ⏳ {countdown}
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-(--border-strong) p-6 shadow-[var(--card-shadow)] sm:p-8 lg:col-span-2"
          aria-label="Today's challenge"
        >
          <MediaBg src={IMG.wcAction} focal="center 30%" scrim="full" />
          <div className="relative text-4xl" aria-hidden>🗓️</div>
          <h2 className="relative mt-2 text-xl font-extrabold text-white" style={{ fontFamily: "var(--font-display)" }}>
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </h2>
          <ul className="relative mt-4 flex flex-col gap-2 text-sm text-white/85">
            <li>⚽ 10 curated questions — same for everyone</li>
            <li>✨ 1.5× XP bonus on everything you score</li>
            <li>🏆 Global leaderboard resets at midnight</li>
            <li>🎯 One attempt per day — make it count</li>
          </ul>

          {playedToday ? (
            <div className="relative mt-6 rounded-2xl border border-(--color-pitch-500)/50 bg-black/40 p-4 text-center backdrop-blur-sm">
              <div className="text-sm font-semibold text-(--color-pitch-300)">✅ Completed today</div>
              <div className="mt-1 text-xs text-white/75">
                {playerEntry ? `Rank #${playerEntry.rank} · ` : ""}
                <span className="font-mono text-(--color-volt)">{displayScore.toLocaleString()}</span> pts today
              </div>
              <div className="mt-1 font-mono text-xs text-white/50">Next challenge in {countdown}</div>
            </div>
          ) : (
            <button onClick={onStart} className="btn-primary focus-ring relative mt-6 w-full py-4 text-lg">
              Play Today's Challenge
            </button>
          )}
          {/* All-time stat — clearly distinct from today's leaderboard score above. */}
          {dailyBest > 0 && dailyBest > displayScore && (
            <p className="relative mt-3 text-center text-xs text-white/60">
              All-time daily best: <span className="font-mono text-(--color-volt)">{dailyBest.toLocaleString()}</span>
            </p>
          )}
        </motion.section>

        <section className="glass rounded-3xl p-5 sm:p-6 lg:col-span-3" aria-label="Global leaderboard">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>🌍 Global Leaderboard</h2>
            {live ? (
              <span className="chip !border-(--color-pitch-500)/40 text-(--color-pitch-300)" title="Live real-time leaderboard">
                <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-(--color-pitch-400)" aria-hidden />
                LIVE
              </span>
            ) : (
              <span className="chip" title="Offline demo board — configure Firebase to go live">Demo</span>
            )}
          </div>
          <div className="max-h-[520px] overflow-y-auto pr-1">
            {!boardLoading && board.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <span className="text-3xl" aria-hidden>🏁</span>
                <p className="text-sm text-(--text-dim)">No scores yet today — be the first on the board!</p>
              </div>
            ) : (
              <LeaderboardList entries={board.slice(0, 20)} loading={boardLoading} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function DailyMatch({ onFinish }: { onFinish: (r: QuizResult) => void }) {
  const questions = useMemo(() => buildDailyQuiz(), []);
  const quiz = useQuiz(questions, "medium");
  const applyResult = usePlayerStore((s) => s.applyResult);
  const markDailyDone = usePlayerStore((s) => s.markDailyDone);
  const name = usePlayerStore((s) => s.name);
  const avatar = usePlayerStore((s) => s.avatar);
  const notify = useOutcomeToasts();
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    if (quiz.phase !== "done" || result) return;
    const r: QuizResult = {
      mode: "daily",
      score: quiz.score,
      correct: quiz.correctCount,
      total: quiz.total,
      bestStreak: quiz.bestStreak,
      answers: quiz.answers,
      difficulty: "medium",
      // Daily pays 1.5x XP.
      xpEarned: Math.round(xpFromScore(quiz.score) * 1.5),
      coinsEarned: coinsFromScore(quiz.score) + 20,
      date: new Date().toISOString(),
    };
    setResult(r);
    markDailyDone(r.score);
    notify(applyResult(r));
    // Publish to the global real-time leaderboard (no-op when Firebase is off).
    void submitDailyScore(r.score, name, avatar);
  }, [quiz.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (result) {
    return (
      <ResultScreen result={result} onPlayAgain={() => onFinish(result)} playAgainLabel="View Leaderboard">
        <p className="mb-6 text-sm text-(--text-dim)">Daily bonus applied: 1.5× XP and +20 coins 🎁</p>
      </ResultScreen>
    );
  }

  if (!quiz.question) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader icon="📅" title="Daily Challenge" subtitle={todayKey()} />
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
