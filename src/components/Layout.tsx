import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useSettingsStore } from "../store/settingsStore";
import { usePlayerStore, useLevel } from "../store/playerStore";
import { useToastStore } from "../store/toastStore";
import { Avatar } from "./Avatar";
import { ProgressRing } from "./ProgressRing";
import { ToastHost } from "./ToastHost";
import { BuildCredit } from "./BuildCredit";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/play", label: "Quick Play", icon: "⚡" },
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
  const push = useToastStore((s) => s.push);
  const level = useLevel();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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
      <ToastHost />
      <BuildCredit />

      {/* Top bar */}
      <header
        className="sticky top-0 z-40 border-b border-(--border)"
        style={{ background: "var(--nav-bg)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <NavLink to="/" className="focus-ring flex items-center gap-2" aria-label="GoalPost home">
            <motion.span whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }} className="text-2xl" aria-hidden>
              ⚽
            </motion.span>
            <span className="text-lg font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
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
            <span className="chip !border-(--color-gold)/30 font-mono text-(--color-gold)" title="Coins">
              🪙 {coins.toLocaleString()}
            </span>
            <button
              onClick={toggleSound}
              className="btn-ghost focus-ring h-9 w-9 !rounded-full text-sm"
              aria-label={soundOn ? "Mute sound" : "Unmute sound"}
              title={soundOn ? "Mute" : "Unmute"}
            >
              {soundOn ? "🔊" : "🔇"}
            </button>
            <button
              onClick={toggleTheme}
              className="btn-ghost focus-ring h-9 w-9 !rounded-full text-sm"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title="Toggle theme"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <NavLink to="/profile" className="focus-ring flex items-center gap-2 rounded-full" aria-label="Your profile">
              <ProgressRing progress={level.progress} size={46} stroke={3}>
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

      {/* Page content with route transitions */}
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
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
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
