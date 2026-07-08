import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { sfx } from "../lib/sound";

/** Full-screen 3‑2‑1‑GO countdown used to sync battle kick-offs. */
export function CountdownOverlay({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(3);

  useEffect(() => {
    if (step === 0) {
      const t = setTimeout(onDone, 650);
      return () => clearTimeout(t);
    }
    sfx.tick();
    const t = setTimeout(() => setStep((s) => s - 1), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "color-mix(in srgb, var(--bg) 82%, transparent)", backdropFilter: "blur(8px)" }}
      role="status"
      aria-label={step > 0 ? `Starting in ${step}` : "Go"}
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={step}
          initial={{ scale: 2.2, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`text-8xl font-extrabold ${step === 0 ? "text-gradient" : ""}`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {step === 0 ? "GO!" : step}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
