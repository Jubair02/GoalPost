import { mulberry32, buildQuiz } from "./quizEngine";
import type { Question } from "../types";

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Season key — the leaderboard partitions and resets by calendar month. */
export function monthKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** e.g. "July 2026" from a YYYY-MM key. */
export function monthLabel(key = monthKey()): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
}

/** Whole days remaining until the season resets (start of next month). */
export function daysUntilNextMonth(now = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  return Math.max(1, Math.ceil((next.getTime() - now.getTime()) / 86_400_000));
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

