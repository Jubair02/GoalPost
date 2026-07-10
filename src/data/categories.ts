import type { CategoryMeta } from "../types";
import { IMG } from "../lib/assets";

export const CATEGORIES: CategoryMeta[] = [
  { id: "world-cup", name: "FIFA World Cup", icon: "🏆", blurb: "The greatest show on earth", unlockLevel: 1, gradient: "from-amber-400/25 to-yellow-600/10", image: IMG.wc2026, focal: "center 22%" },
  { id: "premier-league", name: "Premier League", icon: "🦁", blurb: "England's top flight", unlockLevel: 1, gradient: "from-purple-500/25 to-fuchsia-600/10", image: IMG.premierLeague, focal: "center" },
  { id: "champions-league", name: "Champions League", icon: "⭐", blurb: "Europe's elite nights", unlockLevel: 1, gradient: "from-indigo-500/25 to-blue-700/10", image: IMG.madrid, focal: "center 30%" },
  { id: "trivia", name: "Football Trivia", icon: "🧠", blurb: "Curiosities & general knowledge", unlockLevel: 1, gradient: "from-emerald-400/25 to-teal-600/10", image: IMG.footballTrivia, focal: "center" },
  { id: "rules", name: "Football Rules", icon: "📏", blurb: "Laws of the game", unlockLevel: 1, gradient: "from-slate-400/25 to-slate-600/10", image: IMG.footballRules, focal: "center 25%" },
  { id: "la-liga", name: "La Liga", icon: "🇪🇸", blurb: "Spanish flair & Clásicos", unlockLevel: 2, gradient: "from-red-500/25 to-orange-600/10", image: IMG.laliga, focal: "center 30%" },
  { id: "guess-club", name: "Guess the Club", icon: "🛡️", blurb: "Nicknames, badges & colours", unlockLevel: 2, gradient: "from-cyan-400/25 to-sky-600/10", image: IMG.guessClub, focal: "center" },
  { id: "serie-a", name: "Serie A", icon: "🇮🇹", blurb: "Catenaccio country", unlockLevel: 3, gradient: "from-green-500/25 to-emerald-700/10", image: IMG.serieA, focal: "center" },
  { id: "guess-player", name: "Guess the Player", icon: "🕵️", blurb: "Identify legends from clues", unlockLevel: 3, gradient: "from-violet-400/25 to-purple-700/10", image: IMG.guessPlayer, focal: "center" },
  { id: "bundesliga", name: "Bundesliga", icon: "🇩🇪", blurb: "Goals & yellow walls", unlockLevel: 4, gradient: "from-red-500/25 to-rose-700/10", image: IMG.bundesliga, focal: "center 40%" },
  { id: "legendary-players", name: "Legendary Players", icon: "👑", blurb: "The immortals of the game", unlockLevel: 4, gradient: "from-yellow-400/25 to-amber-700/10", image: IMG.legends, focal: "center 30%" },
  { id: "ligue-1", name: "Ligue 1", icon: "🇫🇷", blurb: "France's finest", unlockLevel: 5, gradient: "from-blue-500/25 to-indigo-700/10", image: IMG.mbappe, focal: "center 18%" },
  { id: "stadiums", name: "Stadiums", icon: "🏟️", blurb: "Cathedrals of football", unlockLevel: 5, gradient: "from-stone-400/25 to-stone-600/10" },
  { id: "uefa-euro", name: "UEFA Euro", icon: "🇪🇺", blurb: "The battle for Europe", unlockLevel: 6, gradient: "from-blue-400/25 to-cyan-700/10", image: IMG.uefaEuro, focal: "center" },
  { id: "guess-stadium", name: "Guess the Stadium", icon: "📍", blurb: "Name grounds from clues", unlockLevel: 6, gradient: "from-teal-400/25 to-green-700/10" },
  { id: "copa-america", name: "Copa América", icon: "🌎", blurb: "South American glory", unlockLevel: 7, gradient: "from-lime-400/25 to-green-700/10", image: IMG.copaAmerica, focal: "center" },
  { id: "national-teams", name: "National Teams", icon: "🌍", blurb: "Flags, anthems & rivalries", unlockLevel: 7, gradient: "from-sky-400/25 to-blue-700/10", image: IMG.nationalTeam, focal: "center" },
  { id: "ballon-dor", name: "Ballon d'Or", icon: "🥇", blurb: "The golden ball winners", unlockLevel: 8, gradient: "from-yellow-400/25 to-yellow-700/10", image: IMG.ballonDor, focal: "center" },
  { id: "club-history", name: "Club History", icon: "📜", blurb: "Origins, mottos & dynasties", unlockLevel: 8, gradient: "from-orange-400/25 to-amber-700/10", image: IMG.clash, focal: "center 20%" },
  { id: "transfers", name: "Transfers", icon: "💸", blurb: "Record fees & sagas", unlockLevel: 9, gradient: "from-emerald-400/25 to-lime-700/10", image: IMG.neymar, focal: "center 15%" },
  { id: "womens-football", name: "Women's Football", icon: "⚡", blurb: "Stars of the women's game", unlockLevel: 9, gradient: "from-pink-400/25 to-rose-700/10" },
  { id: "managers", name: "Managers & Coaches", icon: "📋", blurb: "The masterminds", unlockLevel: 10, gradient: "from-gray-400/25 to-zinc-700/10" },
  { id: "records", name: "Football Records", icon: "📈", blurb: "History's outer limits", unlockLevel: 11, gradient: "from-fuchsia-400/25 to-purple-800/10" },
  { id: "iconic-moments", name: "Iconic Moments", icon: "🎬", blurb: "Frozen-in-time drama", unlockLevel: 12, gradient: "from-rose-400/25 to-red-800/10", image: IMG.iconicMoment, focal: "center" },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
  CategoryMeta["id"],
  CategoryMeta
>;
