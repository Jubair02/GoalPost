import { useSettingsStore } from "../store/settingsStore";

/**
 * Lightweight haptic feedback for mobile. Piggybacks on the sound toggle so
 * users who mute the app also silence vibration. No-ops where unsupported.
 */
function buzz(pattern: number | number[]) {
  if (!useSettingsStore.getState().soundOn) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

export const haptics = {
  tap: () => buzz(8),
  correct: () => buzz([0, 18, 40, 22]),
  wrong: () => buzz(90),
  win: () => buzz([0, 30, 50, 30, 50, 60]),
  levelUp: () => buzz([0, 25, 40, 25, 40, 25, 60]),
};
