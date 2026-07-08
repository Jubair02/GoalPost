import { useEffect, useRef, useState } from "react";

export function CountUp({ to, durationMs = 900 }: { to: number; durationMs?: number }) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let raf: number;
    const step = (t: number) => {
      startRef.current ??= t;
      const p = Math.min(1, (t - startRef.current) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, durationMs]);

  return <>{value.toLocaleString()}</>;
}
