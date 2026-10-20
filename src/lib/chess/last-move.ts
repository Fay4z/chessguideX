import { Chess, type Color, type PieceSymbol, type Square } from "chess.js";

const FILES = "abcdefgh";
const RANKS = "12345678";

const SQUARES: Square[] = FILES.split("").flatMap((file) =>
  RANKS.split("").map((rank) => `${file}${rank}` as Square),
);

const PIECE_ORDER: PieceSymbol[] = ["p", "n", "b", "r", "q", "k"];

function distance(a: Square, b: Square): number {
  const file = Math.abs(FILES.indexOf(a[0]) - FILES.indexOf(b[0]));
  const rank = Math.abs(RANKS.indexOf(a[1]) - RANKS.indexOf(b[1]));
  return file + rank;
}

function buildPredecessor(
  fen: string,
  from: Square,
  to: Square,
  turn: Color,
): string {
  const game = new Chess(fen);
  const piece = game.get(to);
  if (!piece) throw new Error("no piece to move");
  game.remove(to);
  game.put(piece, from);
  const parts = game.fen().split(" ");
  parts[1] = turn;
  parts[3] = "-";
  return parts.join(" ");
}

/**
 * Infers the opponent's last move into a puzzle FEN by rewinding one quiet
 * move: remove a piece from its current square, replay it from an empty
 * square, and keep the reconstruction only if it produces the same position.
 * Returns UCI (e.g. "f8g8") or null when no single move fits.
 *
 * Lichess puzzle CSVs only publish the solver's line, so this is how the
 * board learns which two squares to highlight.
 */
export function inferLastMove(fen: string): string | null {
  let current: Chess;
  try {
    current = new Chess(fen);
  } catch {
    return null;
  }

  const solver = current.turn();
  const opponent: Color = solver === "w" ? "b" : "w";
  const targetBoard = JSON.stringify(current.board());
  const empty = SQUARES.filter((square) => !current.get(square));

  for (const type of PIECE_ORDER) {
    const pieces = SQUARES.filter((square) => {
      const piece = current.get(square);
      return piece?.color === opponent && piece.type === type;
    });

    for (const to of pieces) {
      const origins = [...empty].sort(
        (a, b) => distance(a, to) - distance(b, to),
      );

      for (const from of origins) {
        if (type === "p" && (from[1] === "1" || from[1] === "8")) continue;

        let pre: string;
        try {
          pre = buildPredecessor(fen, from, to, opponent);
        } catch {
          continue;
        }

        let game: Chess;
        try {
          game = new Chess(pre);
        } catch {
          continue;
        }

        try {
          game.move({ from, to });
        } catch {
          continue;
        }

        if (
          game.turn() === solver &&
          JSON.stringify(game.board()) === targetBoard
        ) {
          return from + to;
        }
      }
    }
  }

  return null;
}
