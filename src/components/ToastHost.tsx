import { AnimatePresence, motion } from "framer-motion";
import { useToastStore } from "../store/toastStore";

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            onClick={() => dismiss(t.id)}
            className="glass-strong pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl p-3 text-left"
            style={t.accent ? { borderColor: `${t.accent}66`, boxShadow: `0 8px 32px -8px ${t.accent}50` } : undefined}
          >
            {t.image ? (
              <img
                src={t.image}
                alt=""
                aria-hidden
                className="h-9 w-9 shrink-0 rounded-full object-cover"
                style={{ objectPosition: "center 18%", border: `2px solid ${t.accent ?? "var(--border-strong)"}` }}
              />
            ) : (
              <span className="text-2xl" aria-hidden>
                {t.icon}
              </span>
            )}
            <span className="min-w-0">
              <span className="block text-sm font-bold" style={{ fontFamily: "var(--font-display)" }}>
                {t.title}
              </span>
              <span className="block truncate text-xs text-(--text-dim)">{t.message}</span>
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
