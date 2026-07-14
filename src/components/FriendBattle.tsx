import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Difficulty, Opponent, QuizResult } from "../types";
import { buildQuiz, coinsFromScore, mulberry32, xpFromScore } from "../lib/quizEngine";
import { useQuiz } from "../hooks/useQuiz";
import { useLiveOpponent } from "../hooks/useLiveOpponent";
import { usePlayerStore } from "../store/playerStore";
import { useOutcomeToasts } from "../hooks/useOutcomeToasts";
import { firebaseEnabled } from "../services/firebase";
import {
  createMatch,
  joinMatch,
  subscribeMatch,
  publishProgress,
  closeMatch,
  type LiveMatch,
} from "../services/liveBattle";
import { DifficultyPicker } from "./DifficultyPicker";
import { QuestionCard } from "./QuestionCard";
import { ResultScreen } from "./ResultScreen";
import { CountdownOverlay } from "./CountdownOverlay";
import { VersusHud } from "./VersusHud";
import { Avatar } from "./Avatar";
import { sfx } from "../lib/sound";

const errMsg = (e: unknown) => (e as { message?: string })?.message || "Something went wrong. Try again.";

type View = "menu" | "waiting" | "play" | "error";

/** Challenge-a-friend live Battle flow: create/join by code → live 1v1. */
export function FriendBattle({ onExit }: { onExit: () => void }) {
  const name = usePlayerStore((s) => s.name);
  const avatar = usePlayerStore((s) => s.avatar);

  const [view, setView] = useState<View>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [codeInput, setCodeInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [myUid, setMyUid] = useState("");
  const [isHost, setIsHost] = useState(true);
  const [ready, setReady] = useState(false); // countdown finished

  // Host waiting room: react when the guest joins (status → active).
  useEffect(() => {
    if (view !== "waiting" || !match) return;
    const unsub = subscribeMatch(match.code, (m) => {
      if (!m) {
        setError("The match was closed.");
        setView("error");
      } else if (m.status === "active") {
        sfx.win();
        setMatch(m);
        setReady(false);
        setView("play");
      }
    });
    return unsub;
  }, [view, match?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const { match: m, uid } = await createMatch(difficulty, name, avatar);
      sfx.click();
      setMatch(m);
      setMyUid(uid);
      setIsHost(true);
      setView("waiting");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      const { match: m, uid } = await joinMatch(codeInput, name, avatar);
      setMatch(m);
      setMyUid(uid);
      setIsHost(false);
      setReady(false);
      setView("play");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const leave = () => {
    if (match) void closeMatch(match.code, isHost);
    onExit();
  };

  const copyCode = () => {
    if (!match) return;
    navigator.clipboard?.writeText(match.code).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {}
    );
  };

  if (!firebaseEnabled) {
    return (
      <Shell onExit={onExit}>
        <div className="glass-strong mx-auto max-w-md rounded-3xl p-8 text-center">
          <div className="text-4xl" aria-hidden>📡</div>
          <h2 className="mt-2 text-xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>Online play unavailable</h2>
          <p className="mt-1 text-sm text-(--text-dim)">Playing a friend needs the online leaderboard connection, which isn't configured right now.</p>
          <button onClick={onExit} className="btn-ghost focus-ring mt-5 px-6 py-2.5">Back</button>
        </div>
      </Shell>
    );
  }

  if (view === "play" && match) {
    return ready ? (
      <LiveBattleMatch match={match} myUid={myUid} onExit={leave} />
    ) : (
      <CountdownOverlay onDone={() => setReady(true)} />
    );
  }

  return (
    <Shell onExit={onExit}>
      <div className="glass-strong mx-auto max-w-md rounded-3xl p-6 sm:p-8">
        {view === "waiting" && match ? (
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-(--color-pitch-400)">Share this code</div>
            <button
              onClick={copyCode}
              className="focus-ring mx-auto mt-3 flex items-center gap-2 rounded-2xl border border-(--border-strong) bg-(--surface) px-6 py-4"
              title="Tap to copy"
            >
              <span className="led text-4xl font-extrabold tracking-[0.3em] text-(--color-volt)">{match.code}</span>
              <span className="text-lg" aria-hidden>{copied ? "✅" : "📋"}</span>
            </button>
            <p className="mt-3 text-sm text-(--text-dim)">Send it to a friend. The match starts the moment they join.</p>
            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-(--text-faint)" role="status">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.25 }}
                  className="h-2 w-2 rounded-full bg-(--color-pitch-400)"
                  aria-hidden
                />
              ))}
              <span className="ml-1">Waiting for opponent…</span>
            </div>
            <button onClick={leave} className="btn-ghost focus-ring mt-6 px-6 py-2.5">Cancel</button>
          </div>
        ) : (
          <>
            <h2 className="text-center text-xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>Play a Friend</h2>
            <p className="mb-5 mt-1 text-center text-sm text-(--text-dim)">Create a private match and share the code, or join with a code you were given.</p>

            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-(--text-faint)">Match difficulty</h3>
            <DifficultyPicker value={difficulty} onChange={setDifficulty} />
            <button onClick={create} disabled={busy} className="btn-primary focus-ring mt-5 w-full py-3.5 disabled:opacity-60">
              {busy ? "Creating…" : "🔗 Create match"}
            </button>

            <div className="my-5 flex items-center gap-3 text-xs text-(--text-faint)">
              <span className="h-px flex-1 bg-(--border)" /> or join a match <span className="h-px flex-1 bg-(--border)" />
            </div>

            <div className="flex gap-2">
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase().slice(0, 5))}
                onKeyDown={(e) => e.key === "Enter" && !busy && codeInput.length >= 5 && join()}
                placeholder="CODE"
                aria-label="Match code"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                className="focus-ring led w-full rounded-2xl border border-(--border-strong) bg-(--surface) p-3.5 text-center text-lg font-extrabold uppercase tracking-[0.3em] outline-none placeholder:tracking-normal placeholder:text-(--text-faint)"
              />
              <button onClick={join} disabled={busy || codeInput.length < 5} className="btn-ghost focus-ring shrink-0 px-5 disabled:opacity-50">
                Join
              </button>
            </div>

            {error && (
              <p className="mt-4 rounded-xl border border-(--color-danger)/40 bg-(--color-danger)/10 p-3 text-center text-xs text-(--color-danger)" role="alert">
                {error}
              </p>
            )}

            <button onClick={onExit} className="focus-ring mt-6 w-full text-center text-xs font-semibold text-(--text-faint) hover:text-(--text)">
              ← Back to Battle
            </button>
          </>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children, onExit }: { children: React.ReactNode; onExit: () => void }) {
  return (
    <div>
      <div className="mb-3">
        <button onClick={onExit} className="focus-ring text-sm font-semibold text-(--text-dim) hover:text-(--text)">
          ← Battle
        </button>
      </div>
      {children}
    </div>
  );
}

/** The live 1v1 match: seeded questions, both-answered round sync, live scores. */
function LiveBattleMatch({
  match,
  myUid,
  onExit,
}: {
  match: LiveMatch;
  myUid: string;
  onExit: () => void;
}) {
  const questions = useMemo(
    () => buildQuiz({ count: match.count, difficulty: match.difficulty, random: mulberry32(match.seed) }),
    [match.count, match.difficulty, match.seed]
  );
  const quiz = useQuiz(questions, match.difficulty);
  const playerName = usePlayerStore((s) => s.name);
  const playerAvatar = usePlayerStore((s) => s.avatar);
  const applyResult = usePlayerStore((s) => s.applyResult);
  const notify = useOutcomeToasts();
  const opp = useLiveOpponent(match.code, myUid);
  const [result, setResult] = useState<QuizResult | null>(null);
  const finishedRef = useRef(false);

  // Publish my progress whenever the quiz state changes.
  useEffect(() => {
    void publishProgress(match.code, myUid, {
      score: quiz.score,
      correctCount: quiz.correctCount,
      index: quiz.index,
      answeredCurrent: quiz.phase !== "question",
      correctCurrent: quiz.answers[quiz.index]?.correct ?? null,
      finished: quiz.phase === "done",
    });
  }, [match.code, myUid, quiz.score, quiz.index, quiz.phase, quiz.correctCount, quiz.answers]);

  // Heartbeat so the opponent knows we're still connected.
  useEffect(() => {
    const t = setInterval(() => void publishProgress(match.code, myUid, {}), 5000);
    return () => clearInterval(t);
  }, [match.code, myUid]);

  // Has the opponent answered THIS question? (They may be ahead of or level with us.)
  const oppAnsweredHere =
    opp.finished || opp.index > quiz.index || (opp.index === quiz.index && opp.answeredCurrent);

  // Advance when both have answered — or after a safety wait so a stalled/absent
  // opponent can never freeze the round (their own answers still count for them).
  useEffect(() => {
    if (quiz.phase !== "reveal") return;
    const wait = oppAnsweredHere ? 1800 : 15000;
    const t = setTimeout(() => quiz.next(), wait);
    return () => clearTimeout(t);
  }, [quiz.phase, quiz.index, oppAnsweredHere, quiz]);

  // The opponent left mid-match (present went false before they finished).
  const oppGone = !opp.present && opp.joined && !opp.finished;

  // Resolve once both are done (or the opponent abandoned).
  useEffect(() => {
    if (quiz.phase !== "done" || finishedRef.current) return;
    if (!opp.finished && !oppGone) return; // still waiting for them to finish
    finishedRef.current = true;
    const won = oppGone && !opp.finished ? true : quiz.score > opp.score;
    const r: QuizResult = {
      mode: "battle",
      score: quiz.score,
      correct: quiz.correctCount,
      total: quiz.total,
      bestStreak: quiz.bestStreak,
      answers: quiz.answers,
      difficulty: match.difficulty,
      xpEarned: xpFromScore(quiz.score, won),
      coinsEarned: coinsFromScore(quiz.score, won),
      date: new Date().toISOString(),
      opponentName: opp.name,
      opponentScore: opp.score,
      won,
    };
    setResult(r);
    notify(applyResult(r));
    void publishProgress(match.code, myUid, { finished: true, score: quiz.score });
  }, [quiz.phase, opp.finished, opp.score, opp.name, oppGone]); // eslint-disable-line react-hooks/exhaustive-deps

  const oppAsOpponent: Opponent = { name: opp.name, country: "🌐", avatar: opp.avatar, skill: 0, speed: 0 };

  if (result) {
    return (
      <ResultScreen
        result={result}
        onPlayAgain={onExit}
        playAgainLabel="Leave"
        headline={result.opponentScore === result.score && !result.won ? "DRAW" : undefined}
      >
        <div className="mb-6 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Avatar avatar={playerAvatar} size={32} />
            <span className="font-mono font-bold text-(--color-volt)">{result.score.toLocaleString()}</span>
          </div>
          <span className="text-xs font-black text-(--text-faint)">FT</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold">{result.opponentScore?.toLocaleString()}</span>
            <Avatar avatar={opp.avatar} size={32} />
          </div>
        </div>
        {oppGone && <p className="mb-4 text-sm text-(--color-gold)">Your opponent left the match.</p>}
      </ResultScreen>
    );
  }

  if (quiz.phase === "done") {
    return (
      <div className="mx-auto max-w-md py-16 text-center" role="status">
        <div className="mb-4 text-5xl" aria-hidden>⏳</div>
        <div className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
          Waiting for {opp.name} to finish…
        </div>
        <div className="mt-2 font-mono text-sm text-(--text-dim)">
          You {quiz.score.toLocaleString()} · {opp.name} {opp.score.toLocaleString()}
        </div>
      </div>
    );
  }

  if (!quiz.question) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={onExit} className="focus-ring text-sm font-semibold text-(--text-dim) hover:text-(--text)">
          ← Forfeit
        </button>
        <span className="chip">Match {match.code}</span>
      </div>
      <VersusHud
        playerName={playerName}
        playerAvatar={playerAvatar}
        playerScore={quiz.score}
        opponent={oppAsOpponent}
        opponentScore={opp.score}
        opponentAnswered={oppAnsweredHere}
        opponentCorrect={opp.correctCurrent}
        revealed={quiz.phase === "reveal"}
      />
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
      {quiz.phase === "reveal" && !oppAnsweredHere && (
        <p className="mt-3 text-center text-xs text-(--text-faint)" role="status">
          {opp.present ? `Waiting for ${opp.name} to answer…` : `${opp.name} disconnected — advancing…`}
        </p>
      )}
    </div>
  );
}
