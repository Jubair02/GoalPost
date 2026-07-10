export type Difficulty = "easy" | "medium" | "hard" | "expert";

export type CategoryId =
  | "world-cup"
  | "champions-league"
  | "premier-league"
  | "la-liga"
  | "serie-a"
  | "bundesliga"
  | "ligue-1"
  | "copa-america"
  | "uefa-euro"
  | "club-history"
  | "legendary-players"
  | "ballon-dor"
  | "records"
  | "managers"
  | "stadiums"
  | "transfers"
  | "national-teams"
  | "womens-football"
  | "rules"
  | "guess-player"
  | "guess-club"
  | "guess-stadium"
  | "trivia"
  | "iconic-moments";

export interface Question {
  id: string;
  category: CategoryId;
  difficulty: Difficulty;
  question: string;
  options: [string, string, string, string];
  answer: number;
  explanation: string;
}

export interface CategoryMeta {
  id: CategoryId;
  name: string;
  icon: string;
  blurb: string;
  /** Career level required to unlock */
  unlockLevel: number;
  gradient: string;
  /** Optional background photo (public/assets URL) shown on the category tile. */
  image?: string;
  /** object-position for the tile image. */
  focal?: string;
}

export type GameMode = "quick" | "career" | "daily" | "battle" | "tournament";

export interface AnswerRecord {
  questionId: string;
  category: CategoryId;
  correct: boolean;
  timeMs: number;
  pointsEarned: number;
}

export interface QuizResult {
  mode: GameMode;
  score: number;
  correct: number;
  total: number;
  bestStreak: number;
  answers: AnswerRecord[];
  difficulty: Difficulty;
  xpEarned: number;
  coinsEarned: number;
  date: string;
  opponentName?: string;
  opponentScore?: number;
  won?: boolean;
}

export interface MatchRecord {
  id: string;
  mode: GameMode;
  date: string;
  score: number;
  correct: number;
  total: number;
  difficulty: Difficulty;
  result: "win" | "loss" | "draw" | "solo";
  opponentName?: string;
  opponentScore?: number;
  xpEarned: number;
}

export interface CategoryPerformance {
  played: number;
  correct: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Badge medallion image (public/assets URL). */
  badge: string;
  tier: "bronze" | "silver" | "gold" | "legend";
  xpReward: number;
}

export interface PlayerAvatar {
  emoji: string;
  color: string;
  /** Optional portrait image (public/assets URL). Takes precedence over emoji. */
  image?: string;
}

export interface PlayerState {
  name: string;
  avatar: PlayerAvatar;
  xp: number;
  coins: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  totalCorrect: number;
  totalAnswered: number;
  totalTimeMs: number;
  bestStreak: number;
  currentWinStreak: number;
  bestScore: number;
  perfectGames: number;
  expertWins: number;
  trophies: string[];
  achievements: string[];
  categoryPerformance: Partial<Record<CategoryId, CategoryPerformance>>;
  matchHistory: MatchRecord[];
  lastLoginDate: string | null;
  loginStreak: number;
  lastDailyChallengeDate: string | null;
  /** Score from the most recent daily challenge (today's, when lastDailyChallengeDate is today). */
  dailyChallengeScore: number;
  /** All-time best daily challenge score, across every day played. */
  dailyChallengeBest: number;
  /** Month (YYYY-MM) the running season total belongs to; null before first play. */
  leaderboardMonth: string | null;
  /** Cumulative score across ALL modes this month (local stat only, not the leaderboard). */
  monthlyScore: number;
  /** Month (YYYY-MM) the daily-season total belongs to; null before first daily. */
  seasonDailyMonth: string | null;
  /** Cumulative DAILY-challenge score for the season — the value published to the leaderboard. */
  seasonDailyScore: number;
  tournamentsWon: number;
  battlesPlayed: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  /** Stable identity (Firestore uid) — used for movement tracking and keys. */
  id?: string;
  name: string;
  avatar: PlayerAvatar;
  score: number;
  isPlayer?: boolean;
  country?: string;
}

export interface Opponent {
  name: string;
  avatar: PlayerAvatar;
  country: string;
  /** 0..1 — probability of answering correctly */
  skill: number;
  /** average answer time in ms */
  speed: number;
}

export interface LevelInfo {
  level: number;
  title: string;
  currentXp: number;
  xpIntoLevel: number;
  xpForLevel: number;
  progress: number;
}
