import { useEffect, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Layout } from "./components/Layout";
import { SplashScreen } from "./components/SplashScreen";
import { Onboarding } from "./components/Onboarding";
import { usePlayerStore } from "./store/playerStore";
import { HomePage } from "./pages/HomePage";
import { QuickPlayPage } from "./pages/QuickPlayPage";
import { CareerPage } from "./pages/CareerPage";
import { DailyPage } from "./pages/DailyPage";
import { BattlePage } from "./pages/BattlePage";
import { TournamentPage } from "./pages/TournamentPage";
import { StatsPage } from "./pages/StatsPage";
import { ProfilePage } from "./pages/ProfilePage";

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const name = usePlayerStore((s) => s.name);
  const [hydrated, setHydrated] = useState(usePlayerStore.persist?.hasHydrated?.() ?? true);

  useEffect(() => {
    const unsub = usePlayerStore.persist?.onFinishHydration?.(() => setHydrated(true));
    if (usePlayerStore.persist?.hasHydrated?.()) setHydrated(true);
    return () => unsub?.();
  }, []);

  return (
    <HashRouter>
      <AnimatePresence>{!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}</AnimatePresence>
      {splashDone && hydrated && !name && <Onboarding />}
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
