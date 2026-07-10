import { lazy, useEffect, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Layout } from "./components/Layout";
import { SplashScreen } from "./components/SplashScreen";
import { LoginPage } from "./components/LoginPage";
import { usePlayerStore } from "./store/playerStore";
import { startPlayerSync } from "./services/playerSync";
import { routeLoaders } from "./routes";

// Route-based code splitting: each page ships as its own chunk, so the first
// load only downloads the shell + the landing route, not all 8 pages.
const HomePage = lazy(routeLoaders["/"]);
const QuickPlayPage = lazy(routeLoaders["/play"]);
const CareerPage = lazy(routeLoaders["/career"]);
const DailyPage = lazy(routeLoaders["/daily"]);
const BattlePage = lazy(routeLoaders["/battle"]);
const TournamentPage = lazy(routeLoaders["/tournament"]);
const StatsPage = lazy(routeLoaders["/stats"]);
const ProfilePage = lazy(routeLoaders["/profile"]);

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const name = usePlayerStore((s) => s.name);
  const [hydrated, setHydrated] = useState(usePlayerStore.persist?.hasHydrated?.() ?? true);

  useEffect(() => {
    const unsub = usePlayerStore.persist?.onFinishHydration?.(() => setHydrated(true));
    if (usePlayerStore.persist?.hasHydrated?.()) setHydrated(true);
    return () => unsub?.();
  }, []);

  // Bind the local profile to the signed-in user's cloud document, so progress
  // is tied to their identity and syncs across devices (no-op when offline).
  useEffect(() => startPlayerSync(), []);

  return (
    <HashRouter>
      <AnimatePresence>{!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}</AnimatePresence>
      {splashDone && hydrated && !name && <LoginPage />}
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="play" element={<QuickPlayPage />} />
          <Route path="career" element={<CareerPage />} />
          <Route path="daily" element={<DailyPage />} />
          <Route path="battle" element={<BattlePage />} />
          <Route path="tournament" element={<TournamentPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
