import { useCallback } from "react";
import type { ResultOutcome } from "../store/playerStore";
import { useToastStore } from "../store/toastStore";
import { ACHIEVEMENTS } from "../data/achievements";
import { levelFromXp } from "../data/levels";
import { usePlayerStore } from "../store/playerStore";
import { trophyCelebration } from "../lib/celebrate";
import { sfx } from "../lib/sound";

/** Turns a quiz outcome into staggered toasts for level-ups and achievements. */
export function useOutcomeToasts() {
  const push = useToastStore((s) => s.push);

  return useCallback(
    (outcome: ResultOutcome) => {
      let delay = 900;
      if (outcome.leveledUpTo) {
        const title = levelFromXp(usePlayerStore.getState().xp).title;
        setTimeout(() => {
          sfx.levelUp();
          trophyCelebration();
          push({
            icon: "🆙",
            title: `Level ${outcome.leveledUpTo}!`,
            message: `You're now: ${title}`,
            accent: "#00de5f",
          });
        }, delay);
        delay += 1300;
      }
      for (const id of outcome.newAchievements) {
        const a = ACHIEVEMENTS.find((x) => x.id === id);
        if (!a) continue;
        setTimeout(() => {
          push({
            icon: a.icon,
            title: `Achievement: ${a.name}`,
            message: `${a.description} · +${a.xpReward} XP`,
            accent: "#ffc93d",
          });
        }, delay);
        delay += 1300;
      }
    },
    [push]
  );
}
