import type { PlayerAvatar } from "../types";

export function Avatar({ avatar, size = 44 }: { avatar: PlayerAvatar; size?: number }) {
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full border"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        background: `radial-gradient(circle at 30% 30%, ${avatar.color}55, ${avatar.color}18)`,
        borderColor: `${avatar.color}80`,
        boxShadow: `0 0 ${size / 3}px ${avatar.color}40`,
      }}
    >
      {avatar.emoji}
    </div>
  );
}
