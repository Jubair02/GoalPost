import { useEffect, useRef, useState } from "react";
import type { Difficulty, Opponent } from "../types";
import { DIFFICULTY_MAP, scoreAnswer } from "../lib/quizEngine";

export interface OpponentSimState {
  score: number;
  answeredCurrent: boolean;
  correctCurrent: boolean | null;
  correctCount: number;
}

/**
 * Simulates a live opponent: on each question they "lock in" after a
 * skill-dependent delay and score with probability = skill. The battle round
 * only advances once both sides have answered, exactly like a synchronized
 * real-time match.
 */
export function useOpponentSim(
  opponent: Opponent,
  questionIndex: number,
  active: boolean,
  difficulty: Difficulty
): OpponentSimState {
  const [state, setState] = useState<OpponentSimState>({
    score: 0,
    answeredCurrent: false,
    correctCurrent: null,
    correctCount: 0,
  });
  const resolvedForIndex = useRef(-1);
  const totalTimeMs = DIFFICULTY_MAP[difficulty].time * 1000;

  useEffect(() => {
    if (!active || questionIndex < 0) return;

    setState((s) => ({ ...s, answeredCurrent: false, correctCurrent: null }));

    const jitter = 0.55 + Math.random() * 0.9;
    const delay = Math.min(totalTimeMs - 500, opponent.speed * jitter);

    const t = setTimeout(() => {
      if (resolvedForIndex.current >= questionIndex) return;
      resolvedForIndex.current = questionIndex;
      // Slower answers are slightly more likely to be right — mimics deliberation.
      const deliberationBoost = Math.min(0.08, (delay / totalTimeMs) * 0.1);
      const correct = Math.random() < opponent.skill + deliberationBoost;
      const points = correct
        ? scoreAnswer({ difficulty, timeLeftMs: totalTimeMs - delay, totalTimeMs, streak: 1 })
        : 0;
      setState((s) => ({
        score: s.score + points,
        answeredCurrent: true,
        correctCurrent: correct,
        correctCount: s.correctCount + (correct ? 1 : 0),
      }));
    }, delay);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIndex, active]);

  return state;
}
