import { motion } from "framer-motion";
import type { Difficulty } from "../types";
import { DIFFICULTIES } from "../lib/quizEngine";
import { sfx } from "../lib/sound";

export function DifficultyPicker({ value, onChange }: { value: Difficulty; onChange: (d: Difficulty) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="Difficulty">
      {DIFFICULTIES.map((d) => {
        const active = d.id === value;
        return (
          <motion.button
            key={d.id}
            role="radio"
            aria-checked={active}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              sfx.click();
              onChange(d.id);
            }}
            className={`focus-ring rounded-2xl border p-4 text-left transition-colors ${
              active
                ? "border-(--color-pitch-400) bg-(--color-pitch-500)/12 shadow-[0_0_24px_-6px_var(--glow-pitch)]"
                : "border-(--border-strong) bg-(--surface) hover:border-(--color-pitch-600)"
            }`}
          >
            <div className="mb-1 text-xl" aria-hidden>{d.icon}</div>
            <div className="font-bold" style={{ fontFamily: "var(--font-display)" }}>{d.name}</div>
            <div className="text-xs text-(--text-dim)">{d.blurb}</div>
            <div className="mt-2 font-mono text-[11px] text-(--text-faint)">
              {d.base} pts · {d.time}s
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
