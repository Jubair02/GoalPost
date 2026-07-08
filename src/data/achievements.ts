import type { AchievementDef, PlayerState } from "../types";

export const ACHIEVEMENTS: (AchievementDef & { check: (p: PlayerState) => boolean })[] = [
  { id: "first-kick", name: "First Kick", description: "Play your first quiz", icon: "⚽", tier: "bronze", xpReward: 50, check: (p) => p.gamesPlayed >= 1 },
  { id: "hat-trick", name: "Hat-Trick Hero", description: "Answer 3 questions correctly in a row", icon: "🎩", tier: "bronze", xpReward: 50, check: (p) => p.bestStreak >= 3 },
  { id: "regular", name: "Season Ticket Holder", description: "Play 10 quizzes", icon: "🎟️", tier: "bronze", xpReward: 100, check: (p) => p.gamesPlayed >= 10 },
  { id: "sharp-shooter", name: "Sharp Shooter", description: "Answer 50 questions correctly", icon: "🎯", tier: "bronze", xpReward: 100, check: (p) => p.totalCorrect >= 50 },
  { id: "early-doors", name: "Early Doors", description: "Log in 3 days in a row", icon: "🌅", tier: "bronze", xpReward: 75, check: (p) => p.loginStreak >= 3 },
  { id: "perfect-10", name: "Perfect 10", description: "Score 100% in a quiz", icon: "💯", tier: "silver", xpReward: 150, check: (p) => p.perfectGames >= 1 },
  { id: "on-fire", name: "On Fire", description: "Hit a 10-question answer streak", icon: "🔥", tier: "silver", xpReward: 150, check: (p) => p.bestStreak >= 10 },
  { id: "centurion", name: "Centurion", description: "Answer 100 questions correctly", icon: "💪", tier: "silver", xpReward: 200, check: (p) => p.totalCorrect >= 100 },
  { id: "derby-winner", name: "Derby Winner", description: "Win 5 multiplayer battles", icon: "🥊", tier: "silver", xpReward: 200, check: (p) => p.wins >= 5 },
  { id: "week-streak", name: "Consistency King", description: "Log in 7 days in a row", icon: "📅", tier: "silver", xpReward: 200, check: (p) => p.loginStreak >= 7 },
  { id: "big-game-player", name: "Big Game Player", description: "Win a battle on Expert difficulty", icon: "🌟", tier: "gold", xpReward: 300, check: (p) => p.expertWins >= 1 },
  { id: "treble", name: "Treble Winner", description: "Win 3 tournaments", icon: "🏆", tier: "gold", xpReward: 400, check: (p) => p.tournamentsWon >= 3 },
  { id: "wall", name: "The Wall", description: "Win 10 battles", icon: "🧱", tier: "gold", xpReward: 300, check: (p) => p.wins >= 10 },
  { id: "scholar", name: "Football Scholar", description: "Answer 500 questions correctly", icon: "🎓", tier: "gold", xpReward: 500, check: (p) => p.totalCorrect >= 500 },
  { id: "streak-machine", name: "Streak Machine", description: "Win 5 battles in a row", icon: "⚡", tier: "gold", xpReward: 350, check: (p) => p.currentWinStreak >= 5 },
  { id: "world-class", name: "World Class", description: "Reach level 15", icon: "🌍", tier: "gold", xpReward: 500, check: (p) => p.xp >= 14000 },
  { id: "invincible", name: "Invincible", description: "Score 3 perfect games", icon: "🛡️", tier: "legend", xpReward: 750, check: (p) => p.perfectGames >= 3 },
  { id: "ballon-dor-winner", name: "Ballon d'Or", description: "Win 25 battles", icon: "🥇", tier: "legend", xpReward: 1000, check: (p) => p.wins >= 25 },
  { id: "goat", name: "The GOAT", description: "Answer 1,000 questions correctly", icon: "🐐", tier: "legend", xpReward: 1500, check: (p) => p.totalCorrect >= 1000 },
  { id: "dynasty", name: "Dynasty", description: "Win 10 tournaments", icon: "👑", tier: "legend", xpReward: 1500, check: (p) => p.tournamentsWon >= 10 },
];

export const TIER_COLORS: Record<AchievementDef["tier"], string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffc93d",
  legend: "#c8ff2e",
};
