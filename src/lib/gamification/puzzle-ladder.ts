export const PUZZLE_RATING_MIN = 300;
export const PUZZLE_RATING_MAX = 1800;
export const INITIAL_PUZZLE_RATING = 400;
export const RATING_WIN_STEP = 10;
export const RATING_LOSS_STEP = 15;

export type PuzzleOutcome = "solved_first_attempt" | "solved" | "failed";

export function nextPuzzleRating(current: number, outcome: PuzzleOutcome): number {
  let next = current;
  if (outcome === "solved_first_attempt") next += RATING_WIN_STEP;
  if (outcome === "failed") next -= RATING_LOSS_STEP;
  if (next < PUZZLE_RATING_MIN) return PUZZLE_RATING_MIN;
  if (next > PUZZLE_RATING_MAX) return PUZZLE_RATING_MAX;
  return next;
}

/** The difficulty band the ladder feeds the Puzzle Zone: rating ± width, clamped. */
export function puzzleBandFor(
  rating: number,
  width = 100,
): { low: number; high: number } {
  const low = Math.max(PUZZLE_RATING_MIN, rating - width);
  const high = Math.min(PUZZLE_RATING_MAX, rating + width);
  return { low, high };
}

/** Award events a puzzle attempt triggers: +10 per solve, +5 bonus per consecutive solve. */
export function puzzleEventsFor(
  refId: string,
  solved: boolean,
  nextStreak: number,
): { kind: "puzzle_solved" | "puzzle_streak_bonus"; refId: string }[] {
  if (!solved) return [];
  return [
    { kind: "puzzle_solved", refId },
    ...(nextStreak >= 2 ? [{ kind: "puzzle_streak_bonus" as const, refId }] : []),
  ];
}