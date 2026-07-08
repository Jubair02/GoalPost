import { useMemo } from "react";
import { motion } from "framer-motion";
import { usePlayerStore, useLevel, categoryAccuracy } from "../store/playerStore";
import { CATEGORIES } from "../data/categories";
import { ACHIEVEMENTS } from "../data/achievements";
import { OPPONENTS } from "../data/opponents";
import { PageHeader } from "../components/PageHeader";
import { CountUp } from "../components/CountUp";

export function StatsPage() {
  const p = usePlayerStore();
  const level = useLevel();

  const accuracy = p.totalAnswered > 0 ? Math.round((p.totalCorrect / p.totalAnswered) * 100) : 0;
  const avgTime = p.totalAnswered > 0 ? (p.totalTimeMs / p.totalAnswered / 1000).toFixed(1) : "—";
  const versusGames = p.wins + p.losses + p.draws;
  const winRate = versusGames > 0 ? Math.round((p.wins / versusGames) * 100) : 0;

  // Simulated global rank: XP measured against the AI ladder.
  const globalRank = useMemo(() => {
    const ladder = OPPONENTS.map((o) => Math.round(o.skill * 30000));
    return ladder.filter((s) => s > p.xp).length + 1;
  }, [p.xp]);

  const playedCategories = CATEGORIES
    .map((c) => ({ meta: c, perf: p.categoryPerformance[c.id], acc: categoryAccuracy(p.categoryPerformance, c.id) }))
    .filter((c) => c.perf && c.perf.played > 0)
    .sort((a, b) => (b.acc ?? 0) - (a.acc ?? 0));

  return (
    <div>
      <PageHeader icon="📊" title="Statistics" subtitle="Your complete football-brain dossier." />

      {/* Headline stats */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Headline statistics">
        <Stat label="Games Played" value={<CountUp to={p.gamesPlayed} />} icon="🎮" />
        <Stat label="Win Rate" value={<span>{winRate}%</span>} icon="🏅" sub={`${p.wins}W · ${p.losses}L · ${p.draws}D`} />
        <Stat label="Accuracy" value={<span>{accuracy}%</span>} icon="🎯" sub={`${p.totalCorrect}/${p.totalAnswered}`} />
        <Stat label="Avg Response" value={<span>{avgTime}s</span>} icon="⏱️" />
        <Stat label="Global Rank" value={<span>#{globalRank}</span>} icon="🌍" sub="XP ladder" />
        <Stat label="Best Score" value={<CountUp to={p.bestScore} />} icon="⭐" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category performance */}
        <section className="glass rounded-3xl p-5 sm:p-6" aria-label="Category performance">
          <h2 className="mb-4 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>📚 Category Performance</h2>
          {playedCategories.length === 0 ? (
            <p className="text-sm text-(--text-dim)">Play some quizzes to see your category breakdown.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {playedCategories.map(({ meta, perf, acc }, i) => (
                <li key={meta.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-semibold">
                      <span className="mr-1.5" aria-hidden>{meta.icon}</span>
                      {meta.name}
                    </span>
                    <span className="font-mono text-xs text-(--text-dim)">
                      {acc}% · {perf!.correct}/{perf!.played}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-(--surface-strong)">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${acc}%` }}
                      transition={{ delay: i * 0.05, duration: 0.7, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        background:
                          (acc ?? 0) >= 75
                            ? "linear-gradient(90deg, var(--color-pitch-500), var(--color-volt))"
                            : (acc ?? 0) >= 50
                              ? "linear-gradient(90deg, var(--color-gold), #ff8a3d)"
                              : "linear-gradient(90deg, var(--color-danger), #ff8a3d)",
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-6">
          {/* Records */}
          <section className="glass rounded-3xl p-5 sm:p-6" aria-label="Personal bests">
            <h2 className="mb-4 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>🏔️ Personal Bests</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Record label="Longest streak" value={`${p.bestStreak} 🔥`} />
              <Record label="Perfect games" value={`${p.perfectGames} 💯`} />
              <Record label="Login streak" value={`${p.loginStreak} days`} />
              <Record label="Daily best" value={p.dailyChallengeBest.toLocaleString()} />
              <Record label="Tournaments won" value={`${p.tournamentsWon} 🏆`} />
              <Record label="Level" value={`${level.level} · ${level.title}`} />
            </div>
          </section>

          {/* Achievements summary */}
          <section className="glass rounded-3xl p-5 sm:p-6" aria-label="Achievements">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>🏅 Achievements</h2>
              <span className="chip">{p.achievements.length}/{ACHIEVEMENTS.length}</span>
            </div>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
              {ACHIEVEMENTS.map((a) => {
                const unlocked = p.achievements.includes(a.id);
                return (
                  <div
                    key={a.id}
                    title={`${a.name} — ${a.description}`}
                    aria-label={`${a.name}: ${unlocked ? "unlocked" : "locked"}`}
                    className={`flex aspect-square items-center justify-center rounded-2xl border text-xl ${
                      unlocked ? "border-(--color-gold)/50 bg-(--color-gold)/10" : "border-(--border) bg-(--surface) opacity-35 grayscale"
                    }`}
                  >
                    {a.icon}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Match history */}
      <section className="glass mt-6 rounded-3xl p-5 sm:p-6" aria-label="Match history">
        <h2 className="mb-4 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>📜 Match History</h2>
        {p.matchHistory.length === 0 ? (
          <p className="text-sm text-(--text-dim)">No matches yet — hit Quick Play to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-(--text-faint)">
                  <th className="pb-2 pr-3 font-semibold">Mode</th>
                  <th className="pb-2 pr-3 font-semibold">Result</th>
                  <th className="pb-2 pr-3 font-semibold">Score</th>
                  <th className="pb-2 pr-3 font-semibold">Accuracy</th>
                  <th className="pb-2 pr-3 font-semibold">Difficulty</th>
                  <th className="pb-2 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {p.matchHistory.slice(0, 20).map((m) => (
                  <tr key={m.id} className="border-t border-(--border)">
                    <td className="py-2.5 pr-3 font-semibold capitalize">{modeIcon(m.mode)} {m.mode}</td>
                    <td className="py-2.5 pr-3">
                      {m.result === "solo" ? (
                        <span className="text-(--text-dim)">—</span>
                      ) : (
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                            m.result === "win"
                              ? "bg-(--color-pitch-500)/20 text-(--color-pitch-300)"
                              : m.result === "loss"
                                ? "bg-(--color-danger)/15 text-(--color-danger)"
                                : "bg-(--surface-strong) text-(--text-dim)"
                          }`}
                        >
                          {m.result.toUpperCase()}
                          {m.opponentName ? ` vs ${m.opponentName}` : ""}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 font-mono">{m.score.toLocaleString()}</td>
                    <td className="py-2.5 pr-3 font-mono">{m.total > 0 ? Math.round((m.correct / m.total) * 100) : 0}%</td>
                    <td className="py-2.5 pr-3 capitalize">{m.difficulty}</td>
                    <td className="py-2.5 text-(--text-dim)">{new Date(m.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, icon, sub }: { label: string; value: React.ReactNode; icon: string; sub?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4">
      <div className="text-lg" aria-hidden>{icon}</div>
      <div className="mt-1 font-mono text-xl font-bold">{value}</div>
      <div className="text-xs font-medium text-(--text-faint)">{label}</div>
      {sub && <div className="mt-0.5 font-mono text-[10px] text-(--text-faint)">{sub}</div>}
    </motion.div>
  );
}

function Record({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-(--border) bg-(--surface) p-3">
      <div className="text-xs text-(--text-faint)">{label}</div>
      <div className="mt-0.5 font-bold">{value}</div>
    </div>
  );
}

function modeIcon(mode: string): string {
  return { quick: "⚡", career: "📈", daily: "📅", battle: "⚔️", tournament: "🏆" }[mode] ?? "🎮";
}
