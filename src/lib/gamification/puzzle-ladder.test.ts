import { describe, expect, it } from "vitest";
import {
  INITIAL_PUZZLE_RATING,
  nextPuzzleRating,
  puzzleBandFor,
  puzzleEventsFor,
  PUZZLE_RATING_MAX,
  PUZZLE_RATING_MIN,
} from "./puzzle-ladder";

describe("initial rating", () => {
  it("starts inside the 300-500 band", () => {
    expect(INITIAL_PUZZLE_RATING).toBeGreaterThanOrEqual(300);
    expect(INITIAL_PUZZLE_RATING).toBeLessThanOrEqual(500);
  });
});

describe("nextPuzzleRating", () => {
  it("drifts up on a correct first-attempt solve", () => {
    expect(nextPuzzleRating(400, "solved_first_attempt")).toBe(410);
  });

  it("drifts down on a failure", () => {
    expect(nextPuzzleRating(400, "failed")).toBe(385);
  });

  it("does not drift on a hint-assisted solve", () => {
    expect(nextPuzzleRating(400, "solved")).toBe(400);
  });

  it("clamps at the top of the band", () => {
    expect(nextPuzzleRating(PUZZLE_RATING_MAX - 1, "solved_first_attempt")).toBe(
      PUZZLE_RATING_MAX,
    );
    expect(nextPuzzleRating(PUZZLE_RATING_MAX, "solved_first_attempt")).toBe(
      PUZZLE_RATING_MAX,
    );
  });

  it("clamps at the bottom of the band", () => {
    expect(nextPuzzleRating(PUZZLE_RATING_MIN + 1, "failed")).toBe(PUZZLE_RATING_MIN);
    expect(nextPuzzleRating(PUZZLE_RATING_MIN, "failed")).toBe(PUZZLE_RATING_MIN);
  });

  it("never leaves the sane band over repeated outcomes", () => {
    let rating = nextPuzzleRating(INITIAL_PUZZLE_RATING, "solved_first_attempt");
    for (let i = 0; i < 200; i++) {
      rating = nextPuzzleRating(rating, i % 2 === 0 ? "solved_first_attempt" : "failed");
      expect(rating).toBeGreaterThanOrEqual(PUZZLE_RATING_MIN);
      expect(rating).toBeLessThanOrEqual(PUZZLE_RATING_MAX);
    }
  });
});

describe("puzzleBandFor", () => {
  it("centers the band on the rating at width 100", () => {
    expect(puzzleBandFor(400)).toEqual({ low: 300, high: 500 });
  });

  it("clamps the upper edge at the maximum rating", () => {
    expect(puzzleBandFor(PUZZLE_RATING_MAX - 50)).toEqual({
      low: PUZZLE_RATING_MAX - 150,
      high: PUZZLE_RATING_MAX,
    });
  });

  it("clamps the lower edge at the minimum rating", () => {
    expect(puzzleBandFor(PUZZLE_RATING_MIN + 50)).toEqual({
      low: PUZZLE_RATING_MIN,
      high: PUZZLE_RATING_MIN + 150,
    });
  });
});

describe("puzzleEventsFor", () => {
  it("pays no award for a failed attempt", () => {
    expect(puzzleEventsFor("pz1", false, 0)).toEqual([]);
  });

  it("pays the solve award without a bonus on the first streak solve", () => {
    expect(puzzleEventsFor("pz1", true, 1)).toEqual([
      { kind: "puzzle_solved", refId: "pz1" },
    ]);
  });

  it("adds the streak bonus from the second consecutive solve", () => {
    expect(puzzleEventsFor("pz1", true, 2)).toEqual([
      { kind: "puzzle_solved", refId: "pz1" },
      { kind: "puzzle_streak_bonus", refId: "pz1" },
    ]);
  });

  it("re-pays solve awards across different puzzles", () => {
    const events = [
      ...puzzleEventsFor("pz1", true, 2),
      ...puzzleEventsFor("pz2", true, 3),
    ];
    expect(events).toHaveLength(4);
  });
});