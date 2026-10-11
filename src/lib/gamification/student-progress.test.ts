import { describe, expect, it } from "vitest";
import { REWARD_TABLE } from "./awards";
import { summarizeProgress } from "./student-progress";

describe("summarizeProgress", () => {
  it("starts an empty student at zero points and Pawn", () => {
    const snap = summarizeProgress({
      lessonsPassed: 0,
      quizzesPassed: 0,
      distinctPuzzlesSolved: 0,
    });
    expect(snap.points).toBe(0);
    expect(snap.level).toBe("Pawn");
    expect(snap.lessonsDone).toBe(0);
    expect(snap.quizzesPassed).toBe(0);
    expect(snap.puzzlesSolved).toBe(0);
  });

  it("sums lesson, quiz, and puzzle points", () => {
    const snap = summarizeProgress({
      lessonsPassed: 2,
      quizzesPassed: 1,
      distinctPuzzlesSolved: 3,
    });
    expect(snap.points).toBe(
      2 * REWARD_TABLE.lesson_complete +
        1 * REWARD_TABLE.quiz_pass +
        3 * REWARD_TABLE.puzzle_solved,
    );
  });

  it("maps points to the right level tier", () => {
    expect(
      summarizeProgress({ lessonsPassed: 5, quizzesPassed: 0, distinctPuzzlesSolved: 5 })
        .level,
    ).toBe("Knight");
    expect(
      summarizeProgress({ lessonsPassed: 12, quizzesPassed: 0, distinctPuzzlesSolved: 0 })
        .level,
    ).toBe("Bishop");
  });

  it("reflects streak and completed courses when provided", () => {
    const snap = summarizeProgress({
      lessonsPassed: 0,
      quizzesPassed: 0,
      distinctPuzzlesSolved: 0,
      currentDailyStreak: 4,
      coursesCompleted: 2,
    });
    expect(snap.streak).toBe(4);
    expect(snap.testsPassed).toBe(2);
  });

  it("defaults streak and tests to zero when data is not recorded yet", () => {
    const snap = summarizeProgress({
      lessonsPassed: 1,
      quizzesPassed: 0,
      distinctPuzzlesSolved: 0,
    });
    expect(snap.streak).toBe(0);
    expect(snap.testsPassed).toBe(0);
  });
});