import type { Question } from "../../types";
import { leagues1 } from "./leagues1";
import { leagues2 } from "./leagues2";
import { international } from "./international";
import { knowledge } from "./knowledge";
import { fun } from "./fun";

export const QUESTIONS: Question[] = [
  ...leagues1,
  ...leagues2,
  ...international,
  ...knowledge,
  ...fun,
];
