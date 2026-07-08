import { useEffect } from "react";
import { motion } from "framer-motion";
import { IMG } from "../lib/assets";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2100);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.06 }}
      transition={{ duration: 0.45 }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#060d0a" }}
      role="status"
      aria-label="Loading GoalPost"
    >
      {/* Faint legends backdrop */}
      <img src={IMG.legends} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(900px 520px at 50% 32%, rgba(12,36,23,0.55), rgba(6,13,10,0.94) 72%)" }}
      />
      <motion.div
        initial={{ y: -220, scale: 0.6, opacity: 0 }}
        animate={{ y: [null, 0, -46, 0, -16, 0], scale: 1, opacity: 1 }}
        transition={{ duration: 1.3, times: [0, 0.4, 0.6, 0.78, 0.9, 1], ease: "easeOut" }}
        className="mb-6 text-7xl"
        aria-hidden
      >
        ⚽
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Goal<span className="text-gradient">Post</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="mt-2 text-sm font-medium tracking-widest text-white/50 uppercase"
      >
        Football Quiz Arena
      </motion.p>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.8, duration: 1.1, ease: "easeInOut" }}
        className="mt-8 h-1 w-44 origin-left rounded-full"
        style={{ background: "linear-gradient(90deg, #00de5f, #c8ff2e)" }}
        aria-hidden
      />
    </motion.div>
  );
}
