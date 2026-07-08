/** Lightweight placeholder shown while a lazily-loaded page chunk streams in. */
export function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading">
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-(--border-strong) border-t-(--color-pitch-400)"
        aria-hidden
      />
    </div>
  );
}
