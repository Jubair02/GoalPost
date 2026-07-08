import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CategoryId, MatchRecord, PlayerAvatar, PlayerState, QuizResult } from "../types";
import { ACHIEVEMENTS } from "../data/achievements";
import { levelFromXp } from "../data/levels";
import { todayKey, monthKey } from "../lib/daily";
import { createBackend } from "../services/backend";

export interface ResultOutcome {
  newAchievements: string[];
  leveledUpTo: number | null;
  xpEarned: number;
  coinsEarned: number;
}

export interface LoginReward {
  streak: number;
  coins: number;
  xp: number;
}

interface PlayerStore extends PlayerState {
  setName: (name: string) => void;
  setAvatar: (avatar: PlayerAvatar) => void;
  /** Called once on app start; returns a reward when this is the first login of the day. */
  registerLogin: () => LoginReward | null;
  applyResult: (result: QuizResult) => ResultOutcome;
  markDailyDone: (score: number) => void;
  addTrophy: (name: string) => void;
  recordTournamentWin: (trophyName: string) => void;
  addCoins: (amount: number) => void;
  resetProgress: () => void;
}

const initialState: PlayerState = {
  name: "",
  avatar: { emoji: "⚽", color: "#00de5f" },
  xp: 0,
  coins: 100,
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  totalTimeMs: 0,
  bestStreak: 0,
  currentWinStreak: 0,
  bestScore: 0,
  perfectGames: 0,
  expertWins: 0,
  trophies: [],
  achievements: [],
  categoryPerformance: {},
  matchHistory: [],
  lastLoginDate: null,
  loginStreak: 0,
  lastDailyChallengeDate: null,
  dailyChallengeScore: 0,
  dailyChallengeBest: 0,
  leaderboardMonth: null,
  monthlyScore: 0,
  tournamentsWon: 0,
  battlesPlayed: 0,
  createdAt: new Date().toISOString(),
};

function isYesterday(dateKey: string, today: string): boolean {
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  return dateKey === todayKey(y);
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setName: (name) => set({ name: name.trim().slice(0, 20) }),
      setAvatar: (avatar) => set({ avatar }),
      addCoins: (amount) => set((s) => ({ coins: Math.max(0, s.coins + amount) })),
      addTrophy: (name) => set((s) => ({ trophies: [...s.trophies, name] })),
      recordTournamentWin: (trophyName) =>
        set((s) => ({ tournamentsWon: s.tournamentsWon + 1, trophies: [...s.trophies, trophyName] })),

      registerLogin: () => {
        const s = get();
        const today = todayKey();
        if (s.lastLoginDate === today) return null;
        const streak = s.lastLoginDate && isYesterday(s.lastLoginDate, today) ? s.loginStreak + 1 : 1;
        const reward: LoginReward = {
          streak,
          coins: Math.min(25 + (streak - 1) * 10, 100),
          xp: Math.min(50 + (streak - 1) * 25, 250),
        };
        set({
          lastLoginDate: today,
          loginStreak: streak,
          coins: s.coins + reward.coins,
          xp: s.xp + reward.xp,
        });
        return reward;
      },

      // Season-total accumulation happens in applyResult (all modes count); this
      // only records daily-specific state.
      markDailyDone: (score) =>
        set((s) => ({
          lastDailyChallengeDate: todayKey(),
          dailyChallengeScore: score,
          dailyChallengeBest: Math.max(s.dailyChallengeBest, score),
        })),

      applyResult: (result) => {
        const s = get();
        const levelBefore = levelFromXp(s.xp).level;

        const categoryPerformance = { ...s.categoryPerformance };
        for (const a of result.answers) {
          const cp = categoryPerformance[a.category] ?? { played: 0, correct: 0 };
          categoryPerformance[a.category] = {
            played: cp.played + 1,
            correct: cp.correct + (a.correct ? 1 : 0),
          };
        }

        const isVersus = result.mode === "battle" || result.mode === "tournament";
        const won = result.won === true;
        const draw = isVersus && result.opponentScore === result.score;
        const lost = isVersus && !won && !draw;
        const perfect = result.correct === result.total && result.total > 0;

        // Every quiz — any mode — contributes to the cumulative season total that
        // ranks players on the global leaderboard. Resets when the month rolls over.
        const month = monthKey();
        const carriedSeason = s.leaderboardMonth === month ? s.monthlyScore : 0;

        const record: MatchRecord = {
          id: `m${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
          mode: result.mode,
          date: result.date,
          score: result.score,
          correct: result.correct,
          total: result.total,
          difficulty: result.difficulty,
          result: isVersus ? (won ? "win" : draw ? "draw" : "loss") : "solo",
          opponentName: result.opponentName,
          opponentScore: result.opponentScore,
          xpEarned: result.xpEarned,
        };

        const next: Partial<PlayerState> = {
          xp: s.xp + result.xpEarned,
          coins: s.coins + result.coinsEarned,
          gamesPlayed: s.gamesPlayed + 1,
          wins: s.wins + (won ? 1 : 0),
          losses: s.losses + (lost ? 1 : 0),
          draws: s.draws + (draw ? 1 : 0),
          totalCorrect: s.totalCorrect + result.correct,
          totalAnswered: s.totalAnswered + result.total,
          totalTimeMs: s.totalTimeMs + result.answers.reduce((t, a) => t + a.timeMs, 0),
          bestStreak: Math.max(s.bestStreak, result.bestStreak),
          currentWinStreak: isVersus ? (won ? s.currentWinStreak + 1 : 0) : s.currentWinStreak,
          bestScore: Math.max(s.bestScore, result.score),
          perfectGames: s.perfectGames + (perfect ? 1 : 0),
          expertWins: s.expertWins + (won && result.difficulty === "expert" ? 1 : 0),
          battlesPlayed: s.battlesPlayed + (result.mode === "battle" ? 1 : 0),
          leaderboardMonth: month,
          monthlyScore: carriedSeason + result.score,
          categoryPerformance,
          matchHistory: [record, ...s.matchHistory].slice(0, 60),
        };

        set(next);

        // Achievement pass runs on the updated state; rewards apply immediately.
        const updated = get();
        const newAchievements = ACHIEVEMENTS.filter(
          (a) => !updated.achievements.includes(a.id) && a.check(updated)
        );
        if (newAchievements.length > 0) {
          set((cur) => ({
            achievements: [...cur.achievements, ...newAchievements.map((a) => a.id)],
            xp: cur.xp + newAchievements.reduce((t, a) => t + a.xpReward, 0),
          }));
        }

        const levelAfter = levelFromXp(get().xp).level;
        return {
          newAchievements: newAchievements.map((a) => a.id),
          leveledUpTo: levelAfter > levelBefore ? levelAfter : null,
          xpEarned: result.xpEarned,
          coinsEarned: result.coinsEarned,
        };
      },

      resetProgress: () => set({ ...initialState, createdAt: new Date().toISOString() }),
    }),
    {
      name: "goalpost-player",
      storage: createJSONStorage(() => createBackend()),
    }
  )
);

export function useLevel() {
  const xp = usePlayerStore((s) => s.xp);
  return levelFromXp(xp);
}

export function categoryAccuracy(
  perf: Partial<Record<CategoryId, { played: number; correct: number }>>,
  id: CategoryId
): number | null {
  const cp = perf[id];
  if (!cp || cp.played === 0) return null;
  return Math.round((cp.correct / cp.played) * 100);
}
