import { useSettingsStore } from "../store/settingsStore";

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, durationMs: number, type: OscillatorType = "sine", gainPeak = 0.12, delayMs = 0) {
  if (!useSettingsStore.getState().soundOn) return;
  const ac = audio();
  if (!ac) return;
  const start = ac.currentTime + delayMs / 1000;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + durationMs / 1000 + 0.05);
}

export const sfx = {
  correct() {
    tone(660, 140, "sine");
    tone(880, 220, "sine", 0.12, 90);
  },
  wrong() {
    tone(220, 260, "sawtooth", 0.08);
    tone(160, 300, "sawtooth", 0.07, 80);
  },
  tick() {
    tone(1200, 45, "square", 0.03);
  },
  click() {
    tone(520, 60, "triangle", 0.06);
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 240, "triangle", 0.12, i * 130));
  },
  lose() {
    [392, 330, 262].forEach((f, i) => tone(f, 300, "sine", 0.09, i * 160));
  },
  levelUp() {
    [440, 554, 659, 880, 1109].forEach((f, i) => tone(f, 200, "triangle", 0.11, i * 90));
  },
  /** Filtered noise swell — a stadium crowd roar for big wins. */
  roar() {
    if (!useSettingsStore.getState().soundOn) return;
    const ac = audio();
    if (!ac) return;
    const dur = 1.6;
    const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 700;
    filter.Q.value = 0.7;
    const gain = ac.createGain();
    const t0 = ac.currentTime;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.08, t0 + 0.9);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start(t0);
    src.stop(t0 + dur);
  },
};
