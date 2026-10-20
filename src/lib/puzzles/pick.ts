import { prisma } from "@/lib/db";
import {
  INITIAL_PUZZLE_RATING,
  puzzleBandFor,
} from "@/lib/gamification/puzzle-ladder";

export interface PuzzlePayload {
  id: string;
  fen: string;
  solutionMoves: string[];
  lastMove: string | null;
  rating: number | null;
}

export interface PuzzlePickResult {
  puzzle: PuzzlePayload;
  puzzleStreak: number;
  rating: number;
}

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

async function streakState(userId: string) {
  const streak = await prisma.streak.findUnique({ where: { userId } });
  return {
    rating: streak?.puzzleRating ?? INITIAL_PUZZLE_RATING,
    puzzleStreak: streak?.puzzleCount ?? 0,
  };
}

/**
 * Hands the Puzzle Zone its next puzzle: prefers unattempted, in-band puzzles,
 * then any in-band, then any published puzzle. The band itself comes from the
 * pure ladder seam. Never gates curriculum access.
 */
export async function pickNextPuzzle(
  userId: string,
  avoidIds: string[] = [],
): Promise<PuzzlePickResult> {
  const state = await streakState(userId);
  const { low, high } = puzzleBandFor(state.rating);

  const baseWhere = {
    published: true,
    rating: { gte: low, lte: high },
    id: { notIn: avoidIds },
  };

  const unattempted = await prisma.puzzle.findMany({
    where: {
      published: true,
      rating: { gte: low, lte: high },
      id: { notIn: avoidIds },
      attempts: { none: { userId } },
    },
    orderBy: { rating: "asc" },
    take: 30,
  });

  const row =
    shuffle(unattempted)[0] ??
    shuffle(
      await prisma.puzzle.findMany({
        where: baseWhere,
        orderBy: { rating: "asc" },
        take: 30,
      }),
    )[0] ??
    (await prisma.puzzle.findFirst({
      where: { published: true, id: { notIn: avoidIds } },
    }));
  if (!row) throw new Error("No published puzzles available.");

  return {
    puzzle: {
      id: row.id,
      fen: row.fen,
      solutionMoves: row.solutionMoves,
      lastMove: row.lastMove,
      rating: row.rating,
    },
    puzzleStreak: state.puzzleStreak,
    rating: state.rating,
  };
}