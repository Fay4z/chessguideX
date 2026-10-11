import { REWARD_TABLE } from "./awards";
import { levelFor } from "./level";

export interface StudentProgressInput {
  lessonsPassed: number;
  quizzesPassed: number;
  distinctPuzzlesSolved: number;
  currentDailyStreak?: number;
  coursesCompleted?: number;
}

export interface StudentProgressSnapshot {
  points: number;
  level: string;
  lessonsDone: number;
  quizzesPassed: number;
  puzzlesSolved: number;
  streak: number;
  testsPassed: number;
}

export function summarizeProgress(
  input: StudentProgressInput,
): StudentProgressSnapshot {
  const points =
    input.lessonsPassed * REWARD_TABLE.lesson_complete +
    input.quizzesPassed * REWARD_TABLE.quiz_pass +
    input.distinctPuzzlesSolved * REWARD_TABLE.puzzle_solved;

  return {
    points,
    level: levelFor(points),
    lessonsDone: input.lessonsPassed,
    quizzesPassed: input.quizzesPassed,
    puzzlesSolved: input.distinctPuzzlesSolved,
    streak: input.currentDailyStreak ?? 0,
    testsPassed: input.coursesCompleted ?? 0,
  };
}