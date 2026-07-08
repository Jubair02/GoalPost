import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createBackend } from "../services/backend";

type Theme = "dark" | "light";

interface SettingsStore {
  theme: Theme;
  soundOn: boolean;
  toggleTheme: () => void;
  toggleSound: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: "dark",
      soundOn: true,
      toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
      toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
    }),
    { name: "goalpost-settings", storage: createJSONStorage(() => createBackend()) }
  )
);
