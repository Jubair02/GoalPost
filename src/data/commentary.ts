/** Punditry-style one-liners shown on the reveal, for personality. */
const CORRECT = [
  "Back of the net! 🥅",
  "What a finish!",
  "Clinical. Ice in the veins.",
  "Top bins! Unstoppable.",
  "The crowd is on their feet!",
  "Textbook. The gaffer loves it.",
  "Absolute worldie of an answer.",
  "Calm as you like.",
];

const WRONG = [
  "Off the woodwork! So close.",
  "Skied it over the bar.",
  "The keeper reads it well.",
  "Ruled out — check the replay.",
  "Straight at the wall.",
  "A rare misstep from the maestro.",
  "Flag's up… not this time.",
  "Back to the training ground.",
];

const TIMEOUT = [
  "Too slow — the whistle's gone!",
  "Time's up, referee blows for full time.",
  "Caught dwelling on the ball.",
];

/** Deterministic pick so the same question shows a stable line. */
export function commentary(kind: "correct" | "wrong" | "timeout", seed: number): string {
  const pool = kind === "correct" ? CORRECT : kind === "timeout" ? TIMEOUT : WRONG;
  return pool[Math.abs(seed) % pool.length];
}
