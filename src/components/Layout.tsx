import { Suspense, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useSettingsStore } from "../store/settingsStore";
import { usePlayerStore, useLevel } from "../store/playerStore";
import { useToastStore } from "../store/toastStore";
import { submitSeasonScore } from "../services/leaderboard";
import { monthKey } from "../lib/daily";
import { prefetchRoute } from "../routes";
import { Avatar } from "./Avatar";
import { ProgressRing } from "./ProgressRing";
import { CountUp } from "./CountUp";
import { ToastHost } from "./ToastHost";
import { BuildCredit } from "./BuildCredit";
import { PitchOverlay } from "./PitchOverlay";
import { PageFallback } from "./PageFallback";
import { RouteErrorBoundary } from "./RouteErrorBoundary";

const NAV_ITEMS: { to: string; label: string; shortLabel?: string; icon: string }[] = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/play", label: "Quick Play", shortLabel: "Play", icon: "⚡" },
  { to: "/career", label: "Career", icon: "📈" },
  { to: "/daily", label: "Daily", icon: "📅" },
  { to: "/battle", label: "Battle", icon: "⚔️" },
  { to: "/tournament", label: "Cup", icon: "🏆" },
  { to: "/stats", label: "Stats", icon: "📊" },
];

export function Layout() {
  const theme = useSettingsStore((s) => s.theme);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);
  const soundOn = useSettingsStore((s) => s.soundOn);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const name = usePlayerStore((s) => s.name);
  const avatar = usePlayerStore((s) => s.avatar);
  const coins = usePlayerStore((s) => s.coins);
  const registerLogin = usePlayerStore((s) => s.registerLogin);
  const monthlyScore = usePlayerStore((s) => s.monthlyScore);
  const leaderboardMonth = usePlayerStore((s) => s.leaderboardMonth);
  const push = useToastStore((s) => s.push);
  const level = useLevel();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    // Keep the mobile browser chrome (address bar / status bar / notch) in sync
    // with the app theme — it's driven by the theme-color meta, not CSS.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f2f6f3" : "#060d0a");
  }, [theme]);

  // Personalize the app accent to the player's chosen avatar colour.
  useEffect(() => {
    document.documentElement.style.setProperty("--user-accent", avatar.color || "var(--color-pitch-400)");
  }, [avatar.color]);

  // When the browser is idle, warm the Daily route and the Firebase SDK chunks
  // (download + cache only — no auth) so the live leaderboard opens instantly.
  useEffect(() => {
    const warm = () => {
      prefetchRoute("/daily");
      import("firebase/app");
      import("firebase/auth");
      import("firebase/firestore");
    };
    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const id = w.requestIdleCallback ? w.requestIdleCallback(warm, { timeout: 3000 }) : window.setTimeout(warm, 1800);
    return () => {
      if (w.cancelIdleCallback) w.cancelIdleCallback(id as number);
      else clearTimeout(id as number);
    };
  }, []);

  // Publish this player's cumulative season total to the global leaderboard
  // whenever it changes (after any quiz, any mode). No-op when Firebase is off,
  // and skipped for a stale total left over from a previous month.
  useEffect(() => {
    if (monthlyScore > 0 && leaderboardMonth === monthKey()) {
      void submitSeasonScore(monthlyScore, name, avatar);
    }
  }, [monthlyScore, leaderboardMonth, name, avatar]);

  // Daily login reward, once per day on first load.
  useEffect(() => {
    const reward = registerLogin();
    if (reward) {
      setTimeout(
        () =>
          push({
            icon: "🎁",
            title: `Day ${reward.streak} login streak!`,
            message: `+${reward.coins} coins, +${reward.xp} XP daily reward`,
            accent: "#ffc93d",
          }),
        1200
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-dvh pb-24 md:pb-8">
      <div className="app-backdrop" aria-hidden />
      <PitchOverlay />
      <ToastHost />
      <BuildCredit />

      {/* Top bar */}
      <header
        className="sticky top-0 z-40 border-b border-(--border)"
        style={{ background: "var(--nav-bg)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4">
          <NavLink to="/" className="focus-ring flex items-center gap-2" aria-label="GoalPost home">
            <motion.span whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }} className="text-xl sm:text-2xl" aria-hidden>
              ⚽
            </motion.span>
            <span className="text-base font-extrabold tracking-tight sm:text-lg" style={{ fontFamily: "var(--font-display)" }}>
              Goal<span className="text-gradient">Post</span>
            </span>
          </NavLink>

          {/* Desktop nav */}
          <nav className="ml-4 hidden gap-1 md:flex" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onMouseEnter={() => prefetchRoute(item.to)}
                onFocus={() => prefetchRoute(item.to)}
                className={({ isActive }) =>
                  `focus-ring rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${
                    isActive ? "bg-(--surface-strong) text-(--color-pitch-300)" : "text-(--text-dim) hover:text-(--text)"
                  }`
                }
              >
                <span className="mr-1" aria-hidden>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="chip led !border-(--color-gold)/30 text-(--color-gold)" title="Coins">
              🪙 <CountUp to={coins} />
            </span>
            <button
              onClick={toggleSound}
              className="btn-ghost focus-ring h-10 w-10 !rounded-full text-sm sm:h-9 sm:w-9"
              aria-label={soundOn ? "Mute sound" : "Unmute sound"}
              title={soundOn ? "Mute" : "Unmute"}
            >
              {soundOn ? "🔊" : "🔇"}
            </button>
            <button
              onClick={toggleTheme}
              className="btn-ghost focus-ring h-10 w-10 !rounded-full text-sm sm:h-9 sm:w-9"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title="Toggle theme"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <NavLink to="/profile" className="focus-ring flex items-center gap-2 rounded-full" aria-label="Your profile">
              <ProgressRing progress={level.progress} size={46} stroke={3} color="var(--user-accent)">
                <Avatar avatar={avatar} size={36} />
              </ProgressRing>
              <span className="hidden text-left lg:block">
                <span className="block max-w-28 truncate text-sm font-bold leading-tight">{name || "Rookie"}</span>
                <span className="block text-xs text-(--text-faint)">Lv {level.level}</span>
              </span>
            </NavLink>
          </div>
        </div>
      </header>

      {/* Page content. A stable Suspense boundary shows the fallback while a
          lazy page chunk loads; the per-route CSS fade replaces the old
          AnimatePresence "wait" transition, which could stall and leave the
          next page unmounted (blank) when navigation interrupted its exit. */}
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        <Suspense fallback={<PageFallback />}>
          <div key={location.pathname} className="route-fade">
            <RouteErrorBoundary>
              <Outlet />
            </RouteErrorBoundary>
          </div>
        </Suspense>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-(--border) md:hidden"
        style={{ background: "var(--nav-bg)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
        aria-label="Mobile navigation"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {NAV_ITEMS.slice(0, 6).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `focus-ring flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] font-semibold ${
                  isActive ? "text-(--color-pitch-300)" : "text-(--text-faint)"
                }`
              }
            >
              <span className="text-lg" aria-hidden>{item.icon}</span>
              <span className="whitespace-nowrap">{item.shortLabel ?? item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
