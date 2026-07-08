import type { Difficulty, Opponent, PlayerAvatar } from "../types";
import { BADGE } from "../lib/assets";

export const AVATAR_EMOJIS = ["⚽", "🦁", "🦅", "🐺", "🐂", "🦈", "🐉", "👑", "🔥", "⚡", "🌟", "🎯", "🦊", "🐆", "🛡️", "🚀"];
export const AVATAR_COLORS = ["#00de5f", "#c8ff2e", "#2ee6ff", "#6c7bff", "#ffc93d", "#ff4d5e", "#ff8a3d", "#e05fff"];

/** Portrait avatars players can choose — the same legends used for badges. */
export const AVATAR_IMAGES: { label: string; src: string }[] = [
  { label: "Messi", src: BADGE.messi },
  { label: "Ronaldo", src: BADGE.cr7 },
  { label: "Ronaldinho", src: BADGE.ronaldinho },
  { label: "Ronaldo Nazário", src: BADGE.ronaldo },
  { label: "Neymar", src: BADGE.neymar },
];

const NAMES: Array<[string, string]> = [
  ["TikiTakaTom", "🇪🇸"], ["GegenpressGuru", "🇩🇪"], ["SambaSkills10", "🇧🇷"], ["CatenaccioKing", "🇮🇹"],
  ["RoyMagicHands", "🇬🇧"], ["LaMasiaLegend", "🇪🇸"], ["KopEndKaiser", "🇬🇧"], ["OrangeTotal14", "🇳🇱"],
  ["GauchoGolazo", "🇦🇷"], ["ZlatanFan9", "🇸🇪"], ["PanenkaPro", "🇨🇿"], ["MadridistaMax", "🇪🇸"],
  ["YellowWallWill", "🇩🇪"], ["FergieTime93", "🇬🇧"], ["UltraViolet", "🇫🇷"], ["CafuFlanker", "🇧🇷"],
  ["NordicNutmeg", "🇳🇴"], ["PitchInvader", "🇺🇸"], ["TridentTactic", "🇵🇹"], ["VARmageddon", "🇬🇧"],
  ["SweeperKeeper1", "🇩🇪"], ["FalseNineFred", "🇫🇷"], ["TrequartistaT", "🇮🇹"], ["BicycleKickBo", "🇲🇽"],
  ["StoppageTimeSam", "🇮🇪"], ["OffsideOscar", "🇦🇷"], ["CurvaSudCarlo", "🇮🇹"], ["HalaMadridHugo", "🇪🇸"],
  ["PressResistPia", "🇸🇪"], ["WonderkidWes", "🇬🇧"], ["MagicalMagyar", "🇭🇺"], ["AfconAce", "🇳🇬"],
];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Deterministic roster of AI opponents. */
export const OPPONENTS: Opponent[] = NAMES.map(([name, country], i) => {
  const r = rng(i * 7919 + 17);
  const avatar: PlayerAvatar = {
    emoji: AVATAR_EMOJIS[Math.floor(r() * AVATAR_EMOJIS.length)],
    color: AVATAR_COLORS[Math.floor(r() * AVATAR_COLORS.length)],
  };
  return {
    name,
    country,
    avatar,
    skill: 0.42 + r() * 0.45,
    speed: 3200 + r() * 5200,
  };
});

/** Pick an opponent whose skill roughly matches the chosen difficulty. */
export function pickOpponent(difficulty: Difficulty, exclude: string[] = []): Opponent {
  const bands: Record<Difficulty, [number, number]> = {
    easy: [0.35, 0.55],
    medium: [0.5, 0.7],
    hard: [0.6, 0.82],
    expert: [0.72, 0.95],
  };
  const [lo, hi] = bands[difficulty];
  const pool = OPPONENTS.filter((o) => !exclude.includes(o.name));
  const banded = pool.filter((o) => o.skill >= lo && o.skill <= hi);
  const source = banded.length > 0 ? banded : pool;
  const chosen = source[Math.floor(Math.random() * source.length)];
  // Clamp skill into band so battles feel fair for the difficulty even from fallback pool.
  return { ...chosen, skill: Math.min(hi, Math.max(lo, chosen.skill)) };
}
