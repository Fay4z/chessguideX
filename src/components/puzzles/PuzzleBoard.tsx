"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";

export interface PuzzleOutcome {
  solved: boolean;
  attemptsUsed: number;
  timeMs: number;
}

type Hints = Record<string, "move" | "capture">;

interface DropArgs {
  sourceSquare: string;
  targetSquare: string | null;
}

interface ClickArgs {
  piece: { pieceType: string } | null;
  square: string;
}

/**
 * The shared solve surface: drag or click the move on a real board. Every
 * legal move stays on the board; a wrong move ends the attempt just like a
 * correct one. The centred modal owns what happens next. Parents own the
 * scoring and which puzzle follows; this only reports the outcome. Remount
 * with a new `key` to load another puzzle.
 */
export function PuzzleBoard({
  fen,
  lastMove = null,
  solutionMoves,
  disabled = false,
  onOutcome,
  onNext,
  onRetry,
}: {
  fen: string;
  lastMove?: string | null;
  solutionMoves: string[];
  disabled?: boolean;
  onOutcome: (outcome: PuzzleOutcome) => void;
  onNext: () => void;
  onRetry: () => void;
}) {
  const [position, setPosition] = useState(fen);
  const [status, setStatus] = useState<"playing" | "finished">("playing");
  const [solved, setSolved] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const gameRef = useRef(new Chess(fen));
  const startRef = useRef(0);
  const finishedRef = useRef(false);

  const myColor = fen.split(" ")[1] === "w" ? "w" : "b";
  const expected = solutionMoves[0];

  const lastMoveSquares = useMemo(() => {
    if (!lastMove || lastMove.length < 4) return [];
    return [lastMove.slice(0, 2), lastMove.slice(2, 4)];
  }, [lastMove]);

  const hints = useMemo<Hints>(() => {
    if (!selected || status !== "playing") return {};
    const game = new Chess(position);
    const out: Hints = {};
    try {
      for (const move of game.moves({
        square: selected as Square,
        verbose: true,
      })) {
        out[move.to] = move.captured ? "capture" : "move";
      }
    } catch {
      return {};
    }
    return out;
  }, [position, selected, status]);

  useEffect(() => {
    startRef.current = Date.now();
  }, []);

  function finish(isSolved: boolean) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setSolved(isSolved);
    setStatus("finished");
    setSelected(null);
    onOutcome({
      solved: isSolved,
      attemptsUsed: 1,
      timeMs: Date.now() - startRef.current,
    });
  }

  function tryMove(from: string, to: string): boolean {
    if (disabled || finishedRef.current) return false;
    let made;
    try {
      made = gameRef.current.move({ from, to, promotion: "q" });
    } catch {
      return false;
    }
    if (!made) return false;

    const uci = made.from + made.to + (made.promotion ?? "");
    setPosition(gameRef.current.fen());
    setSelected(null);
    finish(uci === expected);
    return true;
  }

  function handleDrop({ sourceSquare, targetSquare }: DropArgs): boolean {
    if (!targetSquare) return false;
    return tryMove(sourceSquare, targetSquare);
  }

  function handleSquareClick({ piece, square }: ClickArgs) {
    if (disabled || status !== "playing") return;

    const friendly = piece?.pieceType.startsWith(myColor) ?? false;
    if (!selected) {
      if (friendly) setSelected(square);
      return;
    }
    if (square === selected) {
      setSelected(null);
      return;
    }
    if (friendly) {
      setSelected(square);
      return;
    }

    if (!tryMove(selected, square)) setSelected(null);
  }

  return (
    <div>
      <div className="relative">
        <Chessboard
          options={{
            position,
            allowDragging: !disabled && status !== "finished",
            canDragPiece: ({ piece }) => piece.pieceType.startsWith(myColor),
            onPieceDrop: handleDrop,
            onSquareClick: handleSquareClick,
            boardOrientation: myColor === "w" ? "white" : "black",
            showNotation: true,
            animationDurationInMs: 180,
            squareRenderer: ({ square, children }) => {
              const hint = hints[square];
              const isLastMove = lastMoveSquares.includes(square);
              const isSelected = selected === square;
              return (
                <div className="relative flex h-full w-full items-center justify-center">
                  {isLastMove && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-emerald-400/35 dark:bg-emerald-400/25"
                    />
                  )}
                  {isSelected && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-emerald-500/30"
                    />
                  )}
                  <div className="relative flex h-full w-full items-center justify-center">
                    {children}
                  </div>
                  {hint === "move" && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 flex items-center justify-center"
                    >
                      <span className="h-[34%] w-[34%] rounded-full bg-emerald-500/60 dark:bg-emerald-400/65" />
                    </span>
                  )}
                  {hint === "capture" && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-[7%] rounded-full border-[5px] border-emerald-500/60 dark:border-emerald-400/70"
                    />
                  )}
                </div>
              );
            },
          }}
        />

        {status === "finished" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-zinc-950/45 p-6 backdrop-blur-[2px]">
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-xs rounded-2xl border border-zinc-200 bg-white p-5 text-center shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
            >
              <p className="text-sm font-semibold">
                {solved ? "Your answer is correct." : "Your answer is wrong."}
              </p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {solved
                  ? "The move stays on the board. Ready for the next one?"
                  : "The move stays on the board. Try again to reset the position."}
              </p>
              <button
                type="button"
                onClick={solved ? onNext : onRetry}
                className="mt-3 w-full rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
              >
                {solved ? "Next puzzle" : "Try again"}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Click a piece for green move dots and capture rings. Every legal move
        stays on the board — right or wrong.
      </p>
    </div>
  );
}
