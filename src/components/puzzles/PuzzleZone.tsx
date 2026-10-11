"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { fetchNextPuzzle, submitPuzzleAttempt } from "@/app/puzzles/actions";
import type { PuzzlePickResult } from "@/lib/puzzles/pick";

type Status = "playing" | "hint" | "finished";

interface Result {
  ok: boolean;
  solved: boolean;
  reward: { points: number; level: string; newBadges: string[] } | null;
  puzzleStreak: number;
  rating: number;
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

export function PuzzleZone({ initial }: { initial: PuzzlePickResult }) {
  const [puzzle, setPuzzle] = useState(initial);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("playing");
  const [fen, setFen] = useState(puzzle.puzzle.fen);
  const [hintShown, setHintShown] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [loadingNext, setLoadingNext] = useState(false);

  const gameRef = useRef(new Chess(puzzle.puzzle.fen));
  const startRef = useRef(0);
  const replayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittingRef = useRef(false);

  const myColor = puzzle.puzzle.fen.split(" ")[1] === "w" ? "w" : "b";
  const expectedFirst = puzzle.puzzle.solutionMoves[0];
  const hintSan = useMemo(
    () => (expectedFirst ? sanFor(puzzle.puzzle.fen, expectedFirst) : ""),
    [puzzle.puzzle.fen, expectedFirst],
  );

  useEffect(() => {
    startRef.current = Date.now();
    return () => {
      if (replayRef.current) clearInterval(replayRef.current);
    };
  }, [puzzle.puzzle.id]);

  function rewindAfterMiss() {
    gameRef.current = new Chess(puzzle.puzzle.fen);
    setFen(puzzle.puzzle.fen);
  }

  function stopReplay() {
    if (replayRef.current) {
      clearInterval(replayRef.current);
      replayRef.current = null;
    }
  }

  function playReplay() {
    stopReplay();
    const game = new Chess(puzzle.puzzle.fen);
    gameRef.current = game;
    let i = 0;
    const moves = puzzle.puzzle.solutionMoves;
    replayRef.current = setInterval(() => {
      if (i >= moves.length) {
        stopReplay();
        return;
      }
      try {
        game.move({
          from: moves[i].slice(0, 2),
          to: moves[i].slice(2, 4),
          promotion: moves[i].length > 4 ? moves[i][4] : undefined,
        });
      } catch {
        stopReplay();
        return;
      }
      setFen(game.fen());
      i++;
      if (i >= moves.length) stopReplay();
    }, 900);
  }

  function finish(solved: boolean, attemptsUsed: number) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    stopReplay();
    setStatus("finished");
    const elapsed = Date.now() - startRef.current;
    submitPuzzleAttempt(puzzle.puzzle.id, solved, attemptsUsed, elapsed).then(
      (res) => {
        setResult(res);
        if (!solved && res.ok) playReplay();
      },
    );
  }

  function handleDrop({
    sourceSquare,
    targetSquare,
  }: {
    sourceSquare: string;
    targetSquare: string | null;
  }): boolean {
    if (status === "finished" || loadingNext) return false;
    if (!targetSquare) return false;
    const game = gameRef.current;
    let made;
    try {
      made = game.move({ from: sourceSquare, to: targetSquare });
    } catch {
      return false;
    }
    if (!made) return false;

    const uci = made.from + made.to + (made.promotion ?? "");
    if (uci === expectedFirst) {
      finish(true, hintShown ? 2 : 1);
      return true;
    }

    if (!hintShown) {
      setHintShown(true);
      setStatus("hint");
      rewindAfterMiss();
      return true;
    }

    finish(false, 2);
    return true;
  }

  function handleNewPuzzle() {
    stopReplay();
    submittingRef.current = false;
    if (loadingNext) return;
    const ids = [...seenIds, puzzle.puzzle.id];
    setSeenIds(ids);
    setLoadingNext(true);
    fetchNextPuzzle(ids).then((res) => {
      setLoadingNext(false);
      if (res && "puzzle" in res) {
        setPuzzle(res);
        gameRef.current = new Chess(res.puzzle.fen);
        setFen(res.puzzle.fen);
        setStatus("playing");
        setHintShown(false);
        setResult(null);
      }
    });
  }

  const solved = result?.solved ?? false;
  const points = result?.reward?.points ?? 0;

  return (
    <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,480px)_1fr]">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="rounded-full border border-zinc-300 px-3 py-1 font-medium dark:border-zinc-700">
            Rating {puzzle.rating}
          </span>
          <span className="rounded-full border border-zinc-300 px-3 py-1 font-medium dark:border-zinc-700">
            Streak {puzzle.puzzleStreak}
          </span>
        </div>
        <Chessboard
          options={{
            position: fen,
            allowDragging: status !== "finished",
            canDragPiece: ({ piece }) => piece.pieceType.startsWith(myColor),
            onPieceDrop: handleDrop,
            boardOrientation: myColor === "w" ? "white" : "black",
            showNotation: true,
            animationDurationInMs: 200,
          }}
        />
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="flex-1 text-sm text-zinc-600 dark:text-zinc-400">
            {status === "finished" ? (
              solved ? (
                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                  Solved! {points > 0 && `+${points} XP`}
                </span>
              ) : (
                <span className="font-medium text-red-700 dark:text-red-400">
                  Not quite — here&apos;s the full solution replaying now.
                </span>
              )
            ) : status === "hint" ? (
              <span>
                That&apos;s not it. Hint: play{" "}
                <span className="font-mono">{hintSan}</span>
              </span>
            ) : (
              <span>
                Find the best move for{" "}
                {myColor === "w" ? "White" : "Black"}.
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={handleNewPuzzle}
            disabled={loadingNext}
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {loadingNext ? "Loading…" : "Next puzzle"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Your result</h2>
          {result ? (
            <div className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
              <p>
                {result.solved
                  ? `You solved it${result.reward && result.reward.points > 0 ? ` and earned +${result.reward.points} XP` : ""}.`
                  : "The puzzle reset your streak. On to the next one!"}
              </p>
              <p className="mt-2">
                Puzzle streak:{" "}
                <span className="font-semibold">{result.puzzleStreak}</span> ·
                Rating{" "}
                <span className="font-semibold">{result.rating}</span>
              </p>
              {result.reward && result.reward.newBadges.length > 0 && (
                <p className="mt-2 font-medium text-amber-700 dark:text-amber-400">
                  New badge: {result.reward.newBadges.join(", ")}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              {status === "finished"
                ? "Thinking…"
                : "Drag a piece for your first attempt."}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">How it works</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
            <li>Solve on the first try to gain rating &amp; +10 XP.</li>
            <li>One hint after a miss — solving with a hint stays neutral.</li>
            <li>Miss twice and the full solution plays out.</li>
            <li>Every streak solve pays +5 bonus XP on top.</li>
            <li>Puzzles never gate your course progress.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}