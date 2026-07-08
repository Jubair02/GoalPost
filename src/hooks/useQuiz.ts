import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnswerRecord, Difficulty, Question } from "../types";
import { DIFFICULTY_MAP, scoreAnswer } from "../lib/quizEngine";
import { sfx } from "../lib/sound";
import { haptics } from "../lib/haptics";

export type QuizPhase = "question" | "reveal" | "done";

export interface QuizState {
  phase: QuizPhase;
  index: number;
  question: Question | null;
  total: number;
  selected: number | null;
  timeLeftMs: number;
  totalTimeMs: number;
  score: number;
  correctCount: number;
  streak: number;
  bestStreak: number;
  answers: AnswerRecord[];
  lastPoints: number;
  answer: (option: number) => void;
  next: () => void;
}

/**
 * Shared quiz state machine: per-question countdown, scoring with time and
 * streak bonuses, reveal phase with explanation, and an answer log.
 */
export function useQuiz(questions: Question[], difficulty: Difficulty): QuizState {
  const totalTimeMs = DIFFICULTY_MAP[difficulty].time * 1000;
  const [phase, setPhase] = useState<QuizPhase>("question");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState(totalTimeMs);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [lastPoints, setLastPoints] = useState(0);
  const questionStartRef = useRef(Date.now());
  const tickedRef = useRef(false);

  const question = questions[index] ?? null;

  // Countdown loop.
  useEffect(() => {
    if (phase !== "question" || !question) return;
    questionStartRef.current = Date.now();
    setTimeLeftMs(totalTimeMs);
    tickedRef.current = false;
    const interval = setInterval(() => {
      const left = totalTimeMs - (Date.now() - questionStartRef.current);
      setTimeLeftMs(Math.max(0, left));
      if (left <= 5000 && !tickedRef.current) {
        tickedRef.current = true;
      }
      if (left <= 5200 && left > 0 && Math.floor(left / 1000) !== Math.floor((left + 120) / 1000)) {
        sfx.tick();
      }
      if (left <= 0) {
        clearInterval(interval);
        timeOut();
      }
    }, 120);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index, question?.id]);

  const record = useCallback(
    (option: number | null) => {
      if (!question) return;
      const timeMs = Math.min(totalTimeMs, Date.now() - questionStartRef.current);
      const correct = option !== null && option === question.answer;
      const points = correct
        ? scoreAnswer({ difficulty, timeLeftMs: totalTimeMs - timeMs, totalTimeMs, streak: streak + 1 })
        : 0;

      setSelected(option);
      setPhase("reveal");
      setLastPoints(points);
      setAnswers((a) => [
        ...a,
        { questionId: question.id, category: question.category, correct, timeMs, pointsEarned: points },
      ]);

      if (correct) {
        sfx.correct();
        haptics.correct();
        setScore((s) => s + points);
        setCorrectCount((c) => c + 1);
        setStreak((st) => {
          const ns = st + 1;
          setBestStreak((b) => Math.max(b, ns));
          return ns;
        });
      } else {
        sfx.wrong();
        haptics.wrong();
        setStreak(0);
      }
    },
    [question, difficulty, streak, totalTimeMs]
  );

  const timeOut = useCallback(() => record(null), [record]);

  const answer = useCallback(
    (option: number) => {
      if (phase !== "question") return;
      record(option);
    },
    [phase, record]
  );

  const next = useCallback(() => {
    if (phase !== "reveal") return;
    if (index + 1 >= questions.length) {
      setPhase("done");
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setPhase("question");
    }
  }, [phase, index, questions.length]);

  return useMemo(
    () => ({
      phase,
      index,
      question,
      total: questions.length,
      selected,
      timeLeftMs,
      totalTimeMs,
      score,
      correctCount,
      streak,
      bestStreak,
      answers,
      lastPoints,
      answer,
      next,
    }),
    [phase, index, question, questions.length, selected, timeLeftMs, totalTimeMs, score, correctCount, streak, bestStreak, answers, lastPoints, answer, next]
  );
}
