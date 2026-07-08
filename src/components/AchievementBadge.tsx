import type { AchievementDef } from "../types";
import { TIER_COLORS } from "../data/achievements";

/**
 * Circular achievement medallion: a legend portrait framed by a tier-coloured
 * ring and glow. Locked badges are desaturated with a padlock overlay. This is
 * how player photos in /assets/badge read as professional achievement badges.
 */
export function AchievementBadge({
  src,
  tier,
  unlocked,
  size = 48,
  alt = "",
}: {
  src: string;
  tier: AchievementDef["tier"];
  unlocked: boolean;
  size?: number;
  alt?: string;
}) {
  const color = TIER_COLORS[tier];
  const ring = Math.max(2, Math.round(size * 0.06));

  return (
    <div
      className="relative shrink-0 rounded-full"
      role="img"
      aria-label={alt}
      style={{
        width: size,
        height: size,
        padding: ring,
        background: unlocked
          ? `conic-gradient(from 140deg, ${color}, ${color}77, ${color})`
          : "var(--surface-strong)",
        boxShadow: unlocked
          ? `0 0 ${Math.round(size * 0.32)}px ${color}55, inset 0 1px 2px rgba(255,255,255,0.45)`
          : "inset 0 0 0 1px var(--border)",
        opacity: unlocked ? 1 : 0.55,
      }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-full ring-1 ring-black/25">
        <img
          src={src}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          draggable={false}
          className={`h-full w-full object-cover ${unlocked ? "" : "grayscale"}`}
          style={{ objectPosition: "center 18%" }}
        />
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="text-white/85"
              style={{ width: size * 0.42, height: size * 0.42 }}
            >
              <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
              <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
