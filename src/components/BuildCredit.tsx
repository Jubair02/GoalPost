/** Fixed "Build by" credit pinned to the bottom-right corner across the app. */
export function BuildCredit() {
  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-30 hidden md:block">
      <span className="glass pointer-events-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-(--text-dim) shadow-[var(--card-shadow)]">
        Build by{" "}
        <a
          href="https://jhossain.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring font-semibold text-(--color-pitch-400) transition-colors hover:text-(--color-volt)"
        >
          Jubair Hossain
        </a>
      </span>
    </div>
  );
}
