import { levelFor } from "./level";

export interface StudentProgressInput {
  points: number;
  lessonsDone: number;
  quizzesPassed: number;
  puzzlesSolved: number;
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

/**
 * Builds the teacher-facing snapshot from the student's real points-ledger
 * total plus activity counts. Points are never re-derived from counts: the
 * ledger is the single pool shared with the student hub and leaderboard.
 */
export function summarizeProgress(
  input: StudentProgressInput,
): StudentProgressSnapshot {
  return {
    points: input.points,
    level: levelFor(input.points),
    lessonsDone: input.lessonsDone,
    quizzesPassed: input.quizzesPassed,
    puzzlesSolved: input.puzzlesSolved,
    streak: input.currentDailyStreak ?? 0,
    testsPassed: input.coursesCompleted ?? 0,
  };
}