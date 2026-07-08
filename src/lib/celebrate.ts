import confetti from "canvas-confetti";

const BRAND_COLORS = ["#00de5f", "#c8ff2e", "#2ee6ff", "#ffc93d", "#ffffff"];

export function burstConfetti() {
  confetti({
    particleCount: 90,
    spread: 75,
    origin: { y: 0.7 },
    colors: BRAND_COLORS,
    disableForReducedMotion: true,
  });
}

export function trophyCelebration() {
  const end = Date.now() + 1600;
  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.75 },
      colors: BRAND_COLORS,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.75 },
      colors: BRAND_COLORS,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

export function goldRain() {
  confetti({
    particleCount: 160,
    spread: 120,
    startVelocity: 42,
    scalar: 1.1,
    origin: { y: 0.35 },
    colors: ["#ffc93d", "#ffe08a", "#fff3c4", "#c8ff2e"],
    disableForReducedMotion: true,
  });
}
