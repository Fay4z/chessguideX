/**
 * Prototype session logic — pure, no DOM. The board shell calls into this.
 *
 * Question being prototyped: after a legal move, the piece should stay where
 * the student put it (right or wrong), and the outcome should be surfaced as
 * a small popup with a single next action.
 */
import { Chess } from "chess.js";
import type { PrototypePuzzle } from "./puzzles";

export type SessionStatus = "playing" | "correct" | "wrong";

export interface PuzzleSession {
  index: number;
  fen: string;
  status: SessionStatus;
  attempts: number;
  lastMove: string | null;
  lastMoveUci: string | null;
  moves: string[];
}

export function startSession(
  index: number,
  puzzles: PrototypePuzzle[],
): PuzzleSession {
  const safeIndex = ((index % puzzles.length) + puzzles.length) % puzzles.length;
  return {
    index: safeIndex,
    fen: puzzles[safeIndex].fen,
    status: "playing",
    attempts: 0,
    lastMove: null,
    lastMoveUci: null,
    moves: [],
  };
}

/**
 * Apply the student's drop. Illegal moves are rejected (the board snaps back);
 * every legal move updates the FEN, so even a wrong answer stays visible.
 */
export function attemptMove(
  session: PuzzleSession,
  puzzle: PrototypePuzzle,
  from: string,
  to: string,
): { session: PuzzleSession; accepted: boolean } {
  if (session.status !== "playing") {
    return { session, accepted: false };
  }

  const game = new Chess(session.fen);
  const made = (() => {
    try {
      return game.move({ from, to, promotion: "q" });
    } catch {
      return null;
    }
  })();
  if (!made) return { session, accepted: false };

  const uci = made.from + made.to + (made.promotion ?? "");
  const correct = uci === puzzle.solution;

  return {
    accepted: true,
    session: {
      ...session,
      fen: game.fen(),
      status: correct ? "correct" : "wrong",
      attempts: correct ? session.attempts : session.attempts + 1,
      lastMove: made.san,
      lastMoveUci: uci,
      moves: [...session.moves, made.san],
    },
  };
}

export function retryPuzzle(
  session: PuzzleSession,
  puzzle: PrototypePuzzle,
): PuzzleSession {
  return {
    ...session,
    fen: puzzle.fen,
    status: "playing",
    lastMove: null,
    lastMoveUci: null,
    moves: [],
  };
}

export function advancePuzzle(
  session: PuzzleSession,
  puzzles: PrototypePuzzle[],
): PuzzleSession {
  return startSession(session.index + 1, puzzles);
}