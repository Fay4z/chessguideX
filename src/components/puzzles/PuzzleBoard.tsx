"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export interface PuzzleOutcome {
  solved: boolean;
  attemptsUsed: number;
  timeMs: number;
}

function sanFor(fen: string, uci: string): string {
  const game = new Chess(fen);
  const move = game.move({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci[4] : undefined,
  });
  return move?.san ?? uci;
}

/**
 * The shared solve surface: drag the move on a real board, one hint after a
 * miss, the full solution replayed after a second miss. Parents own what
 * happens next (points, streak, which puzzle follows); this only reports the
 * outcome. Remount with a new `key` to load another puzzle.
 */
export function PuzzleBoard({
  fen,
  solutionMoves,
  disabled = false,
  onOutcome,
}: {
  fen: string;
  solutionMoves: string[];
  disabled?: boolean;
  onOutcome: (outcome: PuzzleOutcome) => void;
}) {
  const [position, setPosition] = useState(fen);
  const [status, setStatus] = useState<"playing" | "hint" | "finished">(
    "playing",
  );
  const [solved, setSolved] = useState(false);
  const [hintShown, setHintShown] = useState(false);

  const gameRef = useRef(new Chess(fen));
  const startRef = useRef(0);
  const replayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = useRef(false);

  const myColor = fen.split(" ")[1] === "w" ? "w" : "b";
  const expected = solutionMoves[0];
  const hintSan = useMemo(
    () => (expected ? sanFor(fen, expected) : ""),
    [fen, expected],
  );

  useEffect(() => {
    startRef.current = Date.now();
    return () => {
      if (replayRef.current) clearInterval(replayRef.current);
    };
  }, []);

  function stopReplay() {
    if (replayRef.current) {
      clearInterval(replayRef.current);
      replayRef.current = null;
    }
  }

  function playReplay() {
    stopReplay();
    const game = new Chess(fen);
    gameRef.current = game;
    let i = 0;
    replayRef.current = setInterval(() => {
      if (i >= solutionMoves.length) {
        stopReplay();
        return;
      }
      try {
        game.move({
          from: solutionMoves[i].slice(0, 2),
          to: solutionMoves[i].slice(2, 4),
          promotion: solutionMoves[i].length > 4 ? solutionMoves[i][4] : undefined,
        });
      } catch {
        stopReplay();
        return;
      }
      setPosition(game.fen());
      i++;
      if (i >= solutionMoves.length) stopReplay();
    }, 900);
  }

  function finish(isSolved: boolean, attemptsUsed: number) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    stopReplay();
    setSolved(isSolved);
    setStatus("finished");
    const timeMs = Date.now() - startRef.current;
    if (!isSolved) playReplay();
    onOutcome({ solved: isSolved, attemptsUsed, timeMs });
  }

  function handleDrop({
    sourceSquare,
    targetSquare,
  }: {
    sourceSquare: string;
    targetSquare: string | null;
  }): boolean {
    if (disabled || finishedRef.current) return false;
    if (!targetSquare) return false;
    let made;
    try {
      made = gameRef.current.move({ from: sourceSquare, to: targetSquare });
    } catch {
      return false;
    }
    if (!made) return false;

    const move = made.from + made.to + (made.promotion ?? "");
    if (move === expected) {
      finish(true, hintShown ? 2 : 1);
      return true;
    }
    if (!hintShown) {
      setHintShown(true);
      setStatus("hint");
      gameRef.current = new Chess(fen);
      setPosition(fen);
      return true;
    }
    finish(false, 2);
    return true;
  }

  return (
    <div>
      <Chessboard
        options={{
          position,
          allowDragging: !disabled && status !== "finished",
          canDragPiece: ({ piece }) => piece.pieceType.startsWith(myColor),
          onPieceDrop: handleDrop,
          boardOrientation: myColor === "w" ? "white" : "black",
          showNotation: true,
          animationDurationInMs: 200,
        }}
      />
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        {status === "playing" ? (
          <span>Find the best move for {myColor === "w" ? "White" : "Black"}.</span>
        ) : status === "hint" ? (
          <span>
            That&apos;s not it. Hint: play{" "}
            <span className="font-mono">{hintSan}</span>
          </span>
        ) : solved ? (
          <span className="font-medium text-emerald-700 dark:text-emerald-400">
            Solved!
          </span>
        ) : (
          <span className="font-medium text-red-700 dark:text-red-400">
            Not quite — here&apos;s the full solution replaying now.
          </span>
        )}
      </p>
    </div>
  );
}