import { useState } from "react";
import { motion } from "framer-motion";
import { usePlayerStore } from "../store/playerStore";
import { AVATAR_COLORS, AVATAR_EMOJIS } from "../data/opponents";
import { Avatar } from "./Avatar";
import { sfx } from "../lib/sound";

export function Onboarding() {
  const setName = usePlayerStore((s) => s.setName);
  const setAvatar = usePlayerStore((s) => s.setAvatar);
  const [draft, setDraft] = useState("");
  const [emoji, setEmoji] = useState(AVATAR_EMOJIS[0]);
  const [color, setColor] = useState(AVATAR_COLORS[0]);

  const submit = () => {
    const name = draft.trim();
    if (!name) return;
    setAvatar({ emoji, color });
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
          <Avatar avatar={{ emoji, color }} size={84} />
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

        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-(--text-faint)">Badge</div>
        <div className="mb-4 grid grid-cols-8 gap-1.5" role="radiogroup" aria-label="Avatar emoji">
          {AVATAR_EMOJIS.map((e) => (
            <button
              key={e}
              role="radio"
              aria-checked={emoji === e}
              onClick={() => { setEmoji(e); sfx.click(); }}
              className={`focus-ring flex h-9 items-center justify-center rounded-xl border text-lg transition ${
                emoji === e ? "border-(--color-pitch-400) bg-(--color-pitch-500)/15 scale-110" : "border-(--border) bg-(--surface)"
              }`}
            >
              {e}
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
