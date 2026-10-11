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