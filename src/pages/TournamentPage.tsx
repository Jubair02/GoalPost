import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Difficulty, Opponent, Question } from "../types";
import { buildQuiz } from "../lib/quizEngine";
import { OPPONENTS } from "../data/opponents";
import { usePlayerStore } from "../store/playerStore";
import { useToastStore } from "../store/toastStore";
import { PageHeader } from "../components/PageHeader";
import { DifficultyPicker } from "../components/DifficultyPicker";
import { CountdownOverlay } from "../components/CountdownOverlay";
import { Avatar } from "../components/Avatar";
import { MediaBg } from "../components/MediaBg";
import { IMG } from "../lib/assets";
import { BattleMatch } from "./BattlePage";
import { goldRain, trophyCelebration } from "../lib/celebrate";
import { sfx } from "../lib/sound";

const PLAYER = "__you__";
const ROUND_NAMES = ["Quarter-final", "Semi-final", "Final"];
const ROUND_QUESTIONS = [5, 5, 7];

interface Match {
  a: string;
  b: string;
  winner?: string;
}

type Bracket = Match[][];

function seasonName(): string {
  const d = new Date();
  return `${d.toLocaleString("en", { month: "long" })} ${d.getFullYear()} Cup`;
}

function makeBracket(field: Opponent[]): Bracket {
  const names = [PLAYER, ...field.map((o) => o.name)];
  // Player sits in the first slot; the rest are shuffled in.
  const rest = names.slice(1).sort(() => Math.random() - 0.5);
  const seeded = [names[0], ...rest];
  const qf: Match[] = [];
  for (let i = 0; i < 8; i += 2) qf.push({ a: seeded[i], b: seeded[i + 1] });
  return [qf, [], []];
}

function simulateAiMatch(a: string, b: string, field: Opponent[]): string {
  const sa = field.find((o) => o.name === a)?.skill ?? 0.5;
  const sb = field.find((o) => o.name === b)?.skill ?? 0.5;
  return Math.random() < sa / (sa + sb) ? a : b;
}

type Stage = "lobby" | "bracket" | "countdown" | "playing" | "eliminated" | "champion";

export function TournamentPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [stage, setStage] = useState<Stage>("lobby");
  const [field, setField] = useState<Opponent[]>([]);
  const [bracket, setBracket] = useState<Bracket>([[], [], []]);
  const [round, setRound] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const trophies = usePlayerStore((s) => s.trophies);
  const tournamentsWon = usePlayerStore((s) => s.tournamentsWon);
  const recordTournamentWin = usePlayerStore((s) => s.recordTournamentWin);
  const push = useToastStore((s) => s.push);
  const lastMatchWonRef = useRef(false);

  const playerOpponent = useMemo(() => {
    const match = bracket[round]?.find((m) => m.a === PLAYER || m.b === PLAYER);
    if (!match) return null;
    const oppName = match.a === PLAYER ? match.b : match.a;
    return field.find((o) => o.name === oppName) ?? null;
  }, [bracket, round, field]);

  const start = () => {
    sfx.click();
    // Draw a fresh field of 7 AI entrants.
    const pool = [...OPPONENTS].sort(() => Math.random() - 0.5).slice(0, 7);
    setField(pool);
    setBracket(makeBracket(pool));
    setRound(0);
    setStage("bracket");
  };

  const playRound = () => {
    sfx.click();
    setQuestions(buildQuiz({ count: ROUND_QUESTIONS[round], difficulty }));
    setStage("countdown");
  };

  const onMatchDecided = (won: boolean) => {
    setBracket((prev) => {
      const next = prev.map((r) => r.map((m) => ({ ...m }))) as Bracket;
      // Resolve the player's match plus all AI-only matches this round.
      for (const m of next[round]) {
        if (m.winner) continue;
        if (m.a === PLAYER || m.b === PLAYER) {
          const opp = m.a === PLAYER ? m.b : m.a;
          m.winner = won ? PLAYER : opp;
        } else {
          m.winner = simulateAiMatch(m.a, m.b, field);
        }
      }
      // Build next round pairings.
      if (round < 2) {
        const winners = next[round].map((m) => m.winner!) as string[];
        const pairs: Match[] = [];
        for (let i = 0; i < winners.length; i += 2) pairs.push({ a: winners[i], b: winners[i + 1] });
        next[round + 1] = pairs;
      }
      return next;
    });

    if (!won) {
      setStage("eliminated");
      return;
    }
    if (round === 2) {
      const trophy = seasonName();
      recordTournamentWin(trophy);
      goldRain();
      trophyCelebration();
      push({ icon: "🏆", title: "CHAMPION!", message: `${trophy} added to your cabinet`, accent: "#ffc93d" });
      setStage("champion");
    } else {
      setRound((r) => r + 1);
      setStage("bracket");
    }
  };

  if (stage === "playing" && playerOpponent) {
    return (
      <BattleMatch
        questions={questions}
        difficulty={difficulty}
        opponent={playerOpponent}
        mode="tournament"
        rematchLabel="Continue"
        onWon={(won) => {
          lastMatchWonRef.current = won;
        }}
        onRematch={() => onMatchDecided(lastMatchWonRef.current)}
        onExit={() => setStage("bracket")}
      />
    );
  }

  return (
    <div>
      <PageHeader
        icon="🏆"
        title="Tournament"
        subtitle="Eight enter. One lifts the trophy. Knockout football-quiz at its purest."
        right={tournamentsWon > 0 ? <span className="chip !border-(--color-gold)/40 text-(--color-gold)">🏆 ×{tournamentsWon}</span> : undefined}
      />

      <AnimatePresence>{stage === "countdown" && <CountdownOverlay onDone={() => setStage("playing")} />}</AnimatePresence>

      {stage === "lobby" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-strong mx-auto max-w-3xl overflow-hidden rounded-3xl">
          <div className="relative h-44 overflow-hidden sm:h-52">
            <MediaBg src={IMG.madrid} focal="center 20%" scrim="bottom" />
            <div className="relative flex h-full flex-col items-center justify-end pb-4 text-center">
              <div className="text-4xl drop-shadow-lg" aria-hidden>🏆</div>
              <h2 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl" style={{ fontFamily: "var(--font-display)" }}>{seasonName()}</h2>
              <p className="mt-1 px-6 text-sm text-white/75">Quarter-final → Semi-final → Final. Lose once and you're out.</p>
            </div>
          </div>
          <div className="p-6 sm:p-8">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-(--text-faint)">Tournament difficulty</h3>
          <DifficultyPicker value={difficulty} onChange={setDifficulty} />
          <button onClick={start} className="btn-primary focus-ring mt-8 w-full py-4 text-lg">
            Enter Tournament 🏆
          </button>
          {trophies.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-(--text-faint)">Trophy cabinet</h3>
              <div className="flex flex-wrap gap-2">
                {trophies.slice(-6).map((t, i) => (
                  <span key={`${t}-${i}`} className="chip !border-(--color-gold)/40 text-(--color-gold)">🏆 {t}</span>
                ))}
              </div>
            </div>
          )}
          </div>
        </motion.div>
      )}

      {(stage === "bracket" || stage === "eliminated" || stage === "champion" || stage === "countdown") && (
        <div>
          <BracketView bracket={bracket} field={field} round={round} />

          <div className="mt-6 text-center">
            {stage === "bracket" && playerOpponent && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-strong mx-auto max-w-md rounded-3xl p-6">
                <div className="text-xs font-bold uppercase tracking-widest text-(--color-pitch-400)">{ROUND_NAMES[round]}</div>
                <div className="mt-3 flex items-center justify-center gap-4">
                  <span className="font-bold">You</span>
                  <span className="text-xs font-black text-(--text-faint)">VS</span>
                  <span className="flex items-center gap-2 font-bold">
                    <Avatar avatar={playerOpponent.avatar} size={30} /> {playerOpponent.name}
                  </span>
                </div>
                <button onClick={playRound} className="btn-primary focus-ring mt-5 w-full py-3">
                  Play {ROUND_NAMES[round]} ({ROUND_QUESTIONS[round]} questions)
                </button>
              </motion.div>
            )}

            {stage === "eliminated" && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong mx-auto max-w-md rounded-3xl p-8">
                <div className="text-5xl" aria-hidden>😞</div>
                <h2 className="mt-2 text-xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>Knocked out</h2>
                <p className="mt-1 mb-5 text-sm text-(--text-dim)">Football is cruel. There's always next season.</p>
                <button onClick={start} className="btn-primary focus-ring w-full py-3">New Tournament</button>
              </motion.div>
            )}

            {stage === "champion" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 16 }}
                className="glass-strong mx-auto max-w-md rounded-3xl p-8"
              >
                <motion.div
                  initial={{ y: 70, scale: 0.3, opacity: 0 }}
                  animate={{ y: [70, -14, 0], scale: 1, opacity: 1, rotate: [0, -6, 6, 0] }}
                  transition={{ duration: 1.1, times: [0, 0.7, 1], ease: "easeOut" }}
                  className="text-6xl"
                  style={{ filter: "drop-shadow(0 10px 26px var(--glow-pitch))" }}
                  aria-hidden
                >
                  🏆
                </motion.div>
                <h2 className="text-gradient mt-2 text-2xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>
                  CHAMPIONS!
                </h2>
                <p className="mt-1 mb-5 text-sm text-(--text-dim)">
                  You've won the {seasonName()} — it's in your trophy cabinet forever.
                </p>
                <button onClick={start} className="btn-primary focus-ring w-full py-3">Defend the Title</button>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BracketView({ bracket, field, round }: { bracket: Bracket; field: Opponent[]; round: number }) {
  const display = (name: string) => (name === PLAYER ? "You" : name);
  const avatarFor = (name: string) =>
    name === PLAYER ? usePlayerStore.getState().avatar : field.find((o) => o.name === name)?.avatar ?? { emoji: "❓", color: "#666" };

  return (
    <div className="overflow-x-auto pb-2">
      <div className="mx-auto grid min-w-[640px] max-w-4xl grid-cols-3 gap-4">
        {ROUND_NAMES.map((rn, ri) => (
          <div key={rn}>
            <div className={`mb-3 text-center text-xs font-extrabold uppercase tracking-widest ${ri === round ? "text-(--color-pitch-400)" : "text-(--text-faint)"}`}>
              {rn}
            </div>
            <div className="flex h-full flex-col justify-around gap-3" style={{ minHeight: 280 }}>
              {(bracket[ri].length > 0 ? bracket[ri] : placeholderMatches(ri)).map((m, mi) => (
                <motion.div
                  key={`${ri}-${mi}`}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: mi * 0.06 }}
                  className={`glass relative rounded-2xl p-2.5 ${m.a === PLAYER || m.b === PLAYER ? "border-(--color-pitch-500)/50" : ""}`}
                >
                  {/* Bracket connector into the next round; lights up once decided */}
                  {ri < 2 && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-full top-1/2 h-0.5 w-4 -translate-y-1/2"
                      style={{ background: m.winner ? "var(--color-pitch-500)" : "var(--border-strong)" }}
                    />
                  )}
                  {[m.a, m.b].map((side, si) => (
                    <div
                      key={si}
                      className={`flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-semibold ${
                        m.winner === side
                          ? "bg-(--color-pitch-500)/12 text-(--color-pitch-300)"
                          : m.winner && m.winner !== side
                            ? "opacity-40 line-through"
                            : ""
                      } ${side === PLAYER ? "text-(--color-volt)" : ""}`}
                    >
                      {side ? (
                        <>
                          <Avatar avatar={avatarFor(side)} size={20} />
                          <span className="truncate">{display(side)}</span>
                          {m.winner === side && <span className="ml-auto" aria-label="Winner">✓</span>}
                        </>
                      ) : (
                        <span className="text-(--text-faint)">TBD</span>
                      )}
                    </div>
                  ))}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function placeholderMatches(roundIndex: number): Match[] {
  const count = [4, 2, 1][roundIndex];
  return Array.from({ length: count }, () => ({ a: "", b: "" }));
}
