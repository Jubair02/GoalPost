/** Faint football-pitch markings drawn behind the whole app for theme. */
export function PitchOverlay() {
  return (
    <svg
      className="pitch-overlay"
      viewBox="0 0 100 150"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      strokeWidth={0.3}
      aria-hidden
    >
      {/* touchlines */}
      <rect x="4" y="4" width="92" height="142" rx="1" />
      {/* halfway line + centre circle + spot */}
      <line x1="4" y1="75" x2="96" y2="75" />
      <circle cx="50" cy="75" r="13" />
      <circle cx="50" cy="75" r="0.9" fill="currentColor" stroke="none" />
      {/* top penalty area + arc */}
      <rect x="26" y="4" width="48" height="20" />
      <rect x="38" y="4" width="24" height="8" />
      <path d="M38 24 A 12 12 0 0 0 62 24" />
      {/* bottom penalty area + arc */}
      <rect x="26" y="126" width="48" height="20" />
      <rect x="38" y="138" width="24" height="8" />
      <path d="M38 126 A 12 12 0 0 1 62 126" />
    </svg>
  );
}
