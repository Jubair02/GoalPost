/**
 * Decorative background photo with a gradient scrim on top, so foreground text
 * stays legible in both themes. The <img> lazy-loads and is aria-hidden — these
 * are atmospheric, not content. `focal` sets object-position; `scrim` overrides
 * the overlay for different text placements.
 */
export function MediaBg({
  src,
  focal = "center",
  scrim = "bottom",
  className = "",
}: {
  src: string;
  focal?: string;
  /** Where the readable text sits, so the darkest part of the scrim goes there. */
  scrim?: "bottom" | "left" | "full" | "top";
  className?: string;
}) {
  const gradients: Record<string, string> = {
    bottom: "linear-gradient(180deg, rgba(4,10,7,0.15) 0%, rgba(4,10,7,0.55) 55%, rgba(4,10,7,0.92) 100%)",
    top: "linear-gradient(0deg, rgba(4,10,7,0.15) 0%, rgba(4,10,7,0.6) 60%, rgba(4,10,7,0.92) 100%)",
    left: "linear-gradient(90deg, rgba(4,10,7,0.93) 0%, rgba(4,10,7,0.7) 42%, rgba(4,10,7,0.28) 100%)",
    full: "linear-gradient(180deg, rgba(4,10,7,0.72), rgba(4,10,7,0.82))",
  };
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <img
        src={src}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
        style={{ objectPosition: focal }}
      />
      <div className="absolute inset-0" style={{ background: gradients[scrim] }} />
    </div>
  );
}
