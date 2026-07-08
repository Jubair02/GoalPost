import type { PlayerAvatar } from "../types";

export function Avatar({ avatar, size = 44 }: { avatar: PlayerAvatar; size?: number }) {
  const frame = {
    width: size,
    height: size,
    borderColor: `${avatar.color}80`,
    boxShadow: `0 0 ${size / 3}px ${avatar.color}40`,
  };

  // Image avatar (legend portrait) — framed by the accent-colour ring/glow.
  if (avatar.image) {
    return (
      <div
        aria-hidden
        className="relative shrink-0 overflow-hidden rounded-full border"
        style={{ ...frame, background: `${avatar.color}22` }}
      >
        <img
          src={avatar.image}
          alt=""
          aria-hidden
          draggable={false}
          className="h-full w-full object-cover"
          style={{ objectPosition: "center 18%" }}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full border"
      style={{
        ...frame,
        fontSize: size * 0.5,
        background: `radial-gradient(circle at 30% 30%, ${avatar.color}55, ${avatar.color}18)`,
      }}
    >
      {avatar.emoji}
    </div>
  );
}
