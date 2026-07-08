import { useState } from "react";
import { motion } from "framer-motion";
import { usePlayerStore } from "../store/playerStore";
import { AVATAR_COLORS, AVATAR_IMAGES } from "../data/opponents";
import { Avatar } from "./Avatar";
import { sfx } from "../lib/sound";

export function Onboarding() {
  const setName = usePlayerStore((s) => s.setName);
  const setAvatar = usePlayerStore((s) => s.setAvatar);
  const [draft, setDraft] = useState("");
  const [image, setImage] = useState(AVATAR_IMAGES[0].src);
  const [color, setColor] = useState(AVATAR_COLORS[0]);

  const submit = () => {
    const name = draft.trim();
    if (!name) return;
    setAvatar({ emoji: "⚽", color, image });
    setName(name);
    sfx.win();
  };

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center overflow-y-auto p-4"
      style={{ background: "color-mix(in srgb, var(--bg) 88%, transparent)", backdropFilter: "blur(10px)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
        className="glass-strong w-full max-w-md rounded-3xl p-6 sm:p-8"
      >
        <div className="mb-1 text-center text-4xl" aria-hidden>👋</div>
        <h1 id="onboarding-title" className="mb-1 text-center text-2xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>
          Welcome to the arena
        </h1>
        <p className="mb-6 text-center text-sm text-(--text-dim)">
          Pick your player identity to start your career.
        </p>

        <div className="mb-5 flex justify-center">
          <Avatar avatar={{ emoji: "⚽", color, image }} size={84} />
        </div>

        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-(--text-faint)" htmlFor="player-name">
          Player name
        </label>
        <input
          id="player-name"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          maxLength={20}
          placeholder="e.g. GoldenBoot99"
          autoFocus
          className="focus-ring mb-5 w-full rounded-2xl border border-(--border-strong) bg-(--surface) p-3.5 font-semibold outline-none placeholder:text-(--text-faint)"
        />

        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-(--text-faint)">Choose your legend</div>
        <div className="mb-4 flex justify-center gap-2.5" role="radiogroup" aria-label="Avatar portrait">
          {AVATAR_IMAGES.map((a) => (
            <button
              key={a.src}
              role="radio"
              aria-checked={image === a.src}
              aria-label={a.label}
              title={a.label}
              onClick={() => { setImage(a.src); sfx.click(); }}
              className={`focus-ring h-14 w-14 overflow-hidden rounded-full border-2 transition ${
                image === a.src ? "scale-110 border-(--color-pitch-400) shadow-[0_0_16px_-2px_var(--glow-pitch)]" : "border-(--border-strong) opacity-70 hover:opacity-100"
              }`}
            >
              <img src={a.src} alt="" aria-hidden className="h-full w-full object-cover" style={{ objectPosition: "center 18%" }} />
            </button>
          ))}
        </div>

        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-(--text-faint)">Colour</div>
        <div className="mb-6 flex gap-2" role="radiogroup" aria-label="Avatar colour">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={color === c}
              aria-label={`Colour ${c}`}
              onClick={() => { setColor(c); sfx.click(); }}
              className={`focus-ring h-8 w-8 rounded-full border-2 transition ${color === c ? "scale-115 border-white" : "border-transparent"}`}
              style={{ background: c }}
            />
          ))}
        </div>

        <button onClick={submit} disabled={!draft.trim()} className="btn-primary focus-ring w-full py-3.5">
          Enter the Arena ⚽
        </button>
      </motion.div>
    </div>
  );
}
