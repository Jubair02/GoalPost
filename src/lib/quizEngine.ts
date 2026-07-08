import { QUESTIONS } from "../data/questions";
import type { CategoryId, Difficulty, Question } from "../types";

export const DIFFICULTIES: { id: Difficulty; name: string; icon: string; blurb: string; base: number; time: number }[] = [
  { id: "easy", name: "Easy", icon: "🟢", blurb: "Warm-up drills", base: 100, time: 20 },
  { id: "medium", name: "Medium", icon: "🟡", blurb: "League standard", base: 150, time: 16 },
  { id: "hard", name: "Hard", icon: "🟠", blurb: "European nights", base: 200, time: 13 },
  { id: "expert", name: "Expert", icon: "🔴", blurb: "World Cup final", base: 300, time: 10 },
];

export const DIFFICULTY_MAP = Object.fromEntries(DIFFICULTIES.map((d) => [d.id, d])) as Record<
  Difficulty,
  (typeof DIFFICULTIES)[number]
>;

export interface SeededRandom {
  (): number;
}

export function mulberry32(seed: number): SeededRandom {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: T[], random: SeededRandom = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Difficulty tiers at or below the requested one, used to fill out question sets. */
const DIFFICULTY_ORDER: Difficulty[] = ["easy", "medium", "hard", "expert"];

export interface QuizOptions {
  count: number;
  difficulty: Difficulty;
  categories?: CategoryId[];
  random?: SeededRandom;
}

/**
 * Select questions preferring the exact difficulty, backfilling from adjacent
 * tiers when the pool is too small. Options are shuffled per-question.
 */
export function buildQuiz({ count, difficulty, categories, random = Math.random }: QuizOptions): Question[] {
  const inScope = QUESTIONS.filter((q) => !categories || categories.length === 0 || categories.includes(q.category));
  const target = DIFFICULTY_ORDER.indexOf(difficulty);

  const byDistance = [...inScope].sort(
    (a, b) =>
      Math.abs(DIFFICULTY_ORDER.indexOf(a.difficulty) - target) -
      Math.abs(DIFFICULTY_ORDER.indexOf(b.difficulty) - target)
  );

  const exact = shuffle(byDistance.filter((q) => q.difficulty === difficulty), random);
  const rest = shuffle(byDistance.filter((q) => q.difficulty !== difficulty), random).sort(
    (a, b) =>
      Math.abs(DIFFICULTY_ORDER.indexOf(a.difficulty) - target) -
      Math.abs(DIFFICULTY_ORDER.indexOf(b.difficulty) - target)
  );

  const picked = [...exact, ...rest].slice(0, count);
  return shuffle(picked, random).map((q) => shuffleOptions(q, random));
}

/** Shuffle a question's options, keeping `answer` pointing at the right one. */
export function shuffleOptions(question: Question, random: SeededRandom = Math.random): Question {
  const indices = shuffle([0, 1, 2, 3], random);
  const options = indices.map((i) => question.options[i]) as Question["options"];
  return { ...question, options, answer: indices.indexOf(question.answer) };
}

export interface ScoreInput {
  difficulty: Difficulty;
  timeLeftMs: number;
  totalTimeMs: number;
  streak: number;
}

/** Points = base + time bonus (up to +50%) + streak bonus (+10% per streak step, capped at +100%). */
export function scoreAnswer({ difficulty, timeLeftMs, totalTimeMs, streak }: ScoreInput): number {
  const base = DIFFICULTY_MAP[difficulty].base;
  const timeBonus = Math.round(base * 0.5 * Math.max(0, timeLeftMs / totalTimeMs));
  const streakMult = Math.min(1, Math.max(0, streak - 1) * 0.1);
  return Math.round((base + timeBonus) * (1 + streakMult));
}

export function xpFromScore(score: number, won?: boolean): number {
  return Math.round(score / 10) + (won ? 100 : 0);
}

export function coinsFromScore(score: number, won?: boolean): number {
  return Math.round(score / 40) + (won ? 25 : 0);
}

export function accuracyGrade(pct: number): { grade: string; label: string } {
  if (pct >= 100) return { grade: "S", label: "Flawless!" };
  if (pct >= 90) return { grade: "A+", label: "World class" };
  if (pct >= 80) return { grade: "A", label: "Star performer" };
  if (pct >= 70) return { grade: "B", label: "Solid outing" };
  if (pct >= 55) return { grade: "C", label: "Mid-table" };
  if (pct >= 40) return { grade: "D", label: "Relegation zone" };
  return { grade: "E", label: "Back to training" };
}
