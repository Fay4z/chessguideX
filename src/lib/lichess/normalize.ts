import { Chess, type Square } from "chess.js";

export interface NormalizedLichessPuzzle {
  fen: string;
  solutionMoves: string[];
  lastMove: string;
}

type Promotion = "q" | "r" | "b" | "n";

function toMove(uci: string) {
  return {
    from: uci.slice(0, 2) as Square,
    to: uci.slice(2, 4) as Square,
    ...(uci.length > 4 ? { promotion: uci[4] as Promotion } : {}),
  };
}

/**
 * Lichess CSVs store the position before the opponent's move: `Moves[0]` is
 * that move, and the solver's line starts at `Moves[1]`. This applies the
 * opponent move so the board starts at the position the solver should see,
 * and peels the solution down to the solver's own moves.
 */
export function normalizeLichessPuzzle(
  fen: string,
  moves: string[],
): NormalizedLichessPuzzle | null {
  if (moves.length < 2) return null;

  let game: Chess;
  try {
    game = new Chess(fen);
  } catch {
    return null;
  }

  try {
    const made = game.move(toMove(moves[0]));
    if (!made) return null;
  } catch {
    return null;
  }

  return {
    fen: game.fen(),
    solutionMoves: moves.slice(1),
    lastMove: moves[0],
  };
}
