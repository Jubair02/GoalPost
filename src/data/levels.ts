import type { LevelInfo } from "../types";

/** XP required to go from level N to N+1 (index 0 = level 1 → 2). Grows steadily. */
export function xpForLevel(level: number): number {
  return Math.round(250 + (level - 1) * 175);
}

export const LEVEL_TITLES = [
  "Sunday Leaguer",
  "Academy Prospect",
  "Youth Star",
  "Reserve Player",
  "Squad Rotation",
  "First Team Regular",
  "Fan Favourite",
  "Key Player",
  "Captain Material",
  "Club Captain",
  "League Star",
  "International",
  "National Hero",
  "Continental Star",
  "World Class",
  "Galáctico",
  "Ballon d'Or Contender",
  "Generational Talent",
  "Living Legend",
  "GOAT",
] as const;

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpForLevel(level) && level < 99) {
    remaining -= xpForLevel(level);
    level += 1;
  }
  const need = xpForLevel(level);
  return {
    level,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
    currentXp: xp,
    xpIntoLevel: remaining,
    xpForLevel: need,
    progress: Math.min(1, remaining / need),
  };
}
