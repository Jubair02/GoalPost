import { motion } from "framer-motion";

export type FormResult = "win" | "draw" | "loss";

const STYLE: Record<FormResult, { bg: string; fg: string; letter: string; label: string }> = {
  win: { bg: "var(--color-pitch-500)", fg: "#04170c", letter: "W", label: "Win" },
  draw: { bg: "var(--text-faint)", fg: "#04170c", letter: "D", label: "Draw" },
  loss: { bg: "var(--color-danger)", fg: "#ffffff", letter: "L", label: "Loss" },
};

/**
 * Classic football form guide — most recent first. Status colours are always
 * paired with the W/D/L letter, so meaning never rests on colour alone.
 */
export function FormGuide({ results }: { results: FormResult[] }) {
  if (results.length === 0) {
    return <p className="text-sm text-(--text-dim)">No head-to-head results yet — win a battle to build your form.</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5" role="list" aria-label="Recent form, most recent first">
      {results.map((res, i) => {
        const s = STYLE[res];
        return (
          <motion.span
            key={i}
            role="listitem"
            aria-label={s.label}
            initial={{ scale: 0, y: 6 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.4), type: "spring", stiffness: 320, damping: 18 }}
            className="led flex h-7 w-7 items-center justify-center rounded-md text-xs"
            style={{ background: s.bg, color: s.fg }}
            title={s.label}
          >
            {s.letter}
          </motion.span>
        );
      })}
    </div>
  );
}
