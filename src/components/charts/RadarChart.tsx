import { motion } from "framer-motion";

export interface RadarDatum {
  label: string;
  icon: string;
  value: number; // 0..100
}

/**
 * Single-series radar of category accuracy. One hue (brand green) encodes a
 * single magnitude series, so no legend is needed — the title names it. Axis
 * labels are emoji category icons in muted ink (identity never by colour alone).
 */
export function RadarChart({ data, size = 300 }: { data: RadarDatum[]; size?: number }) {
  const n = data.length;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 34;
  const rings = [0.25, 0.5, 0.75, 1];

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, frac: number) => ({
    x: cx + r * frac * Math.cos(angle(i)),
    y: cy + r * frac * Math.sin(angle(i)),
  });
  const polygon = (frac: number) =>
    data.map((_, i) => { const p = point(i, frac); return `${p.x},${p.y}`; }).join(" ");
  const dataPolygon = data.map((d, i) => { const p = point(i, Math.max(0.02, d.value / 100)); return `${p.x},${p.y}`; }).join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto block h-auto w-full max-w-[320px]"
      role="img"
      aria-label={`Accuracy by category: ${data.map((d) => `${d.label} ${d.value}%`).join(", ")}`}
    >
      {/* grid rings */}
      {rings.map((frac) => (
        <polygon key={frac} points={polygon(frac)} fill="none" stroke="var(--border)" strokeWidth={1} />
      ))}
      {/* spokes */}
      {data.map((_, i) => {
        const p = point(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth={1} />;
      })}
      {/* data area */}
      <motion.polygon
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        points={dataPolygon}
        fill="color-mix(in srgb, var(--color-pitch-400) 22%, transparent)"
        stroke="var(--color-pitch-400)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* vertices */}
      {data.map((d, i) => {
        const p = point(i, Math.max(0.02, d.value / 100));
        return <circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--color-pitch-400)" stroke="var(--bg)" strokeWidth={1.5} />;
      })}
      {/* axis labels (emoji icons) */}
      {data.map((d, i) => {
        const p = point(i, 1.16);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize={16} aria-hidden>
            {d.icon}
          </text>
        );
      })}
    </svg>
  );
}
