/**
 * Single-series sparkline of recent scores (oldest → newest). One hue, thin
 * 2px line over a soft area fill; a highlighted end dot marks the latest value.
 */
export function Sparkline({ values, width = 240, height = 56 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) {
    return <p className="text-sm text-(--text-dim)">Play a few games to see your score trend.</p>;
  }
  const pad = 6;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const x = (i: number) => pad + (i * (width - pad * 2)) / (values.length - 1);
  const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2);

  const line = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(values.length - 1).toFixed(1)},${height - pad} L${x(0).toFixed(1)},${height - pad} Z`;
  const lastX = x(values.length - 1);
  const lastY = y(values[values.length - 1]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-14 w-full" role="img" aria-label={`Recent score trend, latest ${values[values.length - 1].toLocaleString()}`}>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-pitch-400)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-pitch-400)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={line} fill="none" stroke="var(--color-pitch-400)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={3.5} fill="var(--color-volt)" stroke="var(--bg)" strokeWidth={1.5} />
    </svg>
  );
}
