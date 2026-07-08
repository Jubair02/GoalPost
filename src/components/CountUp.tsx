import { useEffect, useRef, useState } from "react";

/**
 * Animates to `to`, easing from the previously displayed value — so it counts
 * up smoothly when a value changes (e.g. coins earned), and from 0 on mount.
 */
export function CountUp({ to, durationMs = 900 }: { to: number; durationMs?: number }) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    if (from === to) return;
    let start: number | null = null;
    const step = (t: number) => {
      start ??= t;
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [to, durationMs]);

  return <>{value.toLocaleString()}</>;
}
