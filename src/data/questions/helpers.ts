import type { CategoryId, Difficulty, Question } from "../../types";

let counter = 0;

/** Compact question factory — auto-assigns stable sequential ids. */
export function q(
  category: CategoryId,
  difficulty: Difficulty,
  question: string,
  options: [string, string, string, string],
  answer: number,
  explanation: string
): Question {
  counter += 1;
  return { id: `q${counter}`, category, difficulty, question, options, answer, explanation };
}
