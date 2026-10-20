import { describe, expect, it } from "vitest";
import { summarizeProgress } from "./student-progress";

describe("summarizeProgress", () => {
  it("starts an empty student at zero points and Pawn", () => {
    const snap = summarizeProgress({
      points: 0,
      lessonsDone: 0,
      quizzesPassed: 0,
      puzzlesSolved: 0,
    });
    expect(snap.points).toBe(0);
    expect(snap.level).toBe("Pawn");
    expect(snap.lessonsDone).toBe(0);
    expect(snap.quizzesPassed).toBe(0);
    expect(snap.puzzlesSolved).toBe(0);
  });

  it("uses the ledger total exactly, including daily and streak awards", () => {
    const snap = summarizeProgress({
      points: 45,
      lessonsDone: 0,
      quizzesPassed: 0,
      puzzlesSolved: 2,
    });
    expect(snap.points).toBe(45);
  });

  it("maps the ledger total to the right level tier", () => {
    expect(
      summarizeProgress({
        points: 300,
        lessonsDone: 5,
        quizzesPassed: 0,
        puzzlesSolved: 5,
      }).level,
    ).toBe("Knight");
    expect(
      summarizeProgress({
        points: 600,
        lessonsDone: 12,
        quizzesPassed: 0,
        puzzlesSolved: 0,
      }).level,
    ).toBe("Bishop");
    expect(
      summarizeProgress({
        points: 1000,
        lessonsDone: 12,
        quizzesPassed: 0,
        puzzlesSolved: 0,
      }).level,
    ).toBe("Rook");
  });

  it("reflects streak and completed courses when provided", () => {
    const snap = summarizeProgress({
      points: 0,
      lessonsDone: 0,
      quizzesPassed: 0,
      puzzlesSolved: 0,
      currentDailyStreak: 4,
      coursesCompleted: 2,
    });
    expect(snap.streak).toBe(4);
    expect(snap.testsPassed).toBe(2);
  });

  it("defaults streak and tests to zero when data is not recorded yet", () => {
    const snap = summarizeProgress({
      points: 20,
      lessonsDone: 1,
      quizzesPassed: 0,
      puzzlesSolved: 0,
    });
    expect(snap.streak).toBe(0);
    expect(snap.testsPassed).toBe(0);
  });
});