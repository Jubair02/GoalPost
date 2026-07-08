import { mulberry32, buildQuiz } from "./quizEngine";
import { OPPONENTS } from "../data/opponents";
import type { LeaderboardEntry, PlayerAvatar, Question } from "../types";

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dateSeed(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Same 10 questions for everyone on a given calendar day. */
export function buildDailyQuiz(key = todayKey()): Question[] {
  const random = mulberry32(dateSeed(key));
  const difficulty = (["medium", "medium", "hard"] as const)[Math.floor(random() * 3)];
  return buildQuiz({ count: 10, difficulty, categories: undefined, random });
}

export function msUntilNextDaily(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

/**
 * Deterministic simulated global leaderboard for the day. The same for every
 * visit within a day; the player's entry is merged in when they have a score.
 */
export function dailyLeaderboard(
  playerScore: number | null,
  playerName: string,
  playerAvatar: PlayerAvatar,
  key = todayKey()
): LeaderboardEntry[] {
  const random = mulberry32(dateSeed(key) ^ 0x9e3779b9);
  const entries = OPPONENTS.map((o) => ({
    name: o.name,
    avatar: o.avatar,
    country: o.country,
    score: Math.round(1100 + random() * 2100 * o.skill),
  }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  if (playerScore !== null) {
    entries.push({ name: playerName, avatar: playerAvatar, country: "⭐", score: playerScore });
  }

  return entries
    .sort((a, b) => b.score - a.score)
    .map((e, i) => ({ ...e, rank: i + 1, isPlayer: playerScore !== null && e.name === playerName }));
}
