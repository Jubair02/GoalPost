import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { usePlayerStore, useLevel } from "../store/playerStore";
import { todayKey } from "../lib/daily";
import { IMG } from "../lib/assets";
import { ProgressRing } from "../components/ProgressRing";
import { Avatar } from "../components/Avatar";
import { MediaBg } from "../components/MediaBg";

const MODES = [
  {
    to: "/play",
    icon: "⚡",
    title: "Quick Play",
    blurb: "10–20 random questions. Pick your difficulty and go.",
    accent: "#00de5f",
    cta: "Kick off",
    image: IMG.messi,
    focal: "center 15%",
  },
  {
    to: "/battle",
    icon: "⚔️",
    title: "Multiplayer Battle",
    blurb: "Real-time 1v1 against rivals from around the world.",
    accent: "#ff4d5e",
    cta: "Find opponent",
    image: IMG.clash,
    focal: "center 20%",
  },
  {
    to: "/daily",
    icon: "📅",
    title: "Daily Challenge",
    blurb: "One shot per day. Scores stack into a monthly season leaderboard.",
    accent: "#2ee6ff",
    cta: "Play today's quiz",
    image: IMG.wcAction,
    focal: "center 30%",
  },
  {
    to: "/tournament",
    icon: "🏆",
    title: "Tournament",
    blurb: "Knockout bracket. Three rounds. One champion.",
    accent: "#ffc93d",
    cta: "Enter the cup",
    image: IMG.madrid,
    focal: "center 28%",
  },
  {
    to: "/career",
    icon: "📈",
    title: "Career Mode",
    blurb: "Master 24 categories, level up, unlock everything.",
    accent: "#6c7bff",
    cta: "Continue career",
    image: IMG.legends,
    focal: "center 22%",
  },
  {
    to: "/stats",
    icon: "📊",
    title: "Statistics",
    blurb: "Your accuracy, rankings, records and match history.",
    accent: "#e05fff",
    cta: "View dashboard",
    image: IMG.maldini,
    focal: "center 20%",
  },
];

export function HomePage() {
  const name = usePlayerStore((s) => s.name);
  const avatar = usePlayerStore((s) => s.avatar);
  const wins = usePlayerStore((s) => s.wins);
  const gamesPlayed = usePlayerStore((s) => s.gamesPlayed);
  const loginStreak = usePlayerStore((s) => s.loginStreak);
  const lastDaily = usePlayerStore((s) => s.lastDailyChallengeDate);
  const level = useLevel();
  const dailyDone = lastDaily === todayKey();

  return (
    <div>
      {/* Hero */}
      <section className="relative mb-8 overflow-hidden rounded-3xl border border-(--border-strong) p-6 shadow-[var(--card-shadow)] sm:p-10">
        <MediaBg src={IMG.madrid} focal="center 22%" scrim="left" />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--glow-pitch), transparent 70%)" }}
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <ProgressRing progress={level.progress} size={96} stroke={5} color="var(--user-accent)" label="Level progress">
            <Avatar avatar={avatar} size={76} />
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-semibold text-(--color-pitch-300)">
              {greeting()}, {name || "Rookie"}
            </motion.p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
              Ready for <span className="text-gradient">match day</span>?
            </h1>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="chip !border-white/20 !bg-white/10 !text-white">Lv {level.level} · {level.title}</span>
              <span className="chip !border-white/20 !bg-white/10 !text-white">🎮 {gamesPlayed} played</span>
              <span className="chip !border-white/20 !bg-white/10 !text-white">🏅 {wins} wins</span>
              {loginStreak > 1 && <span className="chip !border-orange-400/50 !bg-orange-500/15 text-orange-200">🔥 {loginStreak}-day streak</span>}
            </div>
          </div>
          {!dailyDone && (
            <Link to="/daily" className="btn-primary focus-ring shrink-0 px-6 py-3 text-sm">
              📅 Daily Challenge awaits
            </Link>
          )}
        </div>
        {/* XP bar */}
        <div className="relative mt-6">
          <div className="flex justify-between text-xs font-semibold text-white/60">
            <span>Level {level.level}</span>
            <span className="font-mono">{level.xpIntoLevel.toLocaleString()} / {level.xpForLevel.toLocaleString()} XP</span>
            <span>Level {level.level + 1}</span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-black/30">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${level.progress * 100}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, var(--color-pitch-500), var(--color-volt))" }}
            />
          </div>
        </div>
      </section>

      {/* Mode grid */}
      <section aria-label="Game modes" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((mode, i) => (
          <motion.div
            key={mode.to}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, type: "spring", stiffness: 200, damping: 22 }}
          >
            <Link
              to={mode.to}
              className="focus-ring group relative flex h-full min-h-[210px] flex-col justify-end overflow-hidden rounded-3xl border border-(--border-strong) p-6 shadow-[var(--card-shadow)] transition-transform duration-200 hover:-translate-y-1.5"
            >
              <MediaBg src={mode.image} focal={mode.focal} scrim="bottom" />
              {/* accent glow tinted to the mode colour, brightens on hover */}
              <div
                aria-hidden
                className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full opacity-25 blur-3xl transition-opacity duration-300 group-hover:opacity-70"
                style={{ background: `radial-gradient(circle, ${mode.accent}88, transparent 70%)` }}
              />
              <div className="relative">
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-black/30 text-2xl backdrop-blur transition-transform duration-300 group-hover:scale-110" aria-hidden>
                  {mode.icon}
                </div>
                <h2 className="mb-1 text-lg font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                  {mode.title}
                </h2>
                <p className="mb-3 text-sm leading-relaxed text-white/70">{mode.blurb}</p>
                <span className="text-sm font-bold transition-colors" style={{ color: mode.accent }}>
                  {mode.cta} →
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </section>
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
