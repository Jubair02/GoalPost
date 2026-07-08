import { motion } from "framer-motion";

export function PageHeader({ icon, title, subtitle, right }: { icon: string; title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 text-2xl font-extrabold tracking-tight sm:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span aria-hidden>{icon}</span>
          {title}
        </motion.h1>
        {subtitle && <p className="mt-1 text-sm text-(--text-dim)">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
