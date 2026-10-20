"use client";

import { useRef, useState } from "react";
import { fetchNextPuzzle, submitPuzzleAttempt } from "@/app/puzzles/actions";
import { PuzzleBoard } from "@/components/puzzles/PuzzleBoard";
import type { PuzzlePickResult } from "@/lib/puzzles/pick";

interface Result {
  ok: boolean;
  solved: boolean;
  reward: { points: number; level: string; newBadges: string[] } | null;
  puzzleStreak: number;
  rating: number;
}

export function PuzzleZone({ initial }: { initial: PuzzlePickResult }) {
  const [puzzle, setPuzzle] = useState(initial);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [rating, setRating] = useState(initial.rating);
  const [streak, setStreak] = useState(initial.puzzleStreak);
  const [round, setRound] = useState(0);
  const [loadingNext, setLoadingNext] = useState(false);
  const submittingRef = useRef(false);

  function handleOutcome(outcome: {
    solved: boolean;
    attemptsUsed: number;
    timeMs: number;
  }) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    submitPuzzleAttempt(
      puzzle.puzzle.id,
      outcome.solved,
      outcome.attemptsUsed,
      outcome.timeMs,
    )
      .then((res) => {
        setResult(res);
        if (res.ok) {
          setRating(res.rating);
          setStreak(res.puzzleStreak);
        }
      })
      .catch(() => {
        submittingRef.current = false;
      });
  }

  function handleRetry() {
    submittingRef.current = false;
    setResult(null);
    setRound((current) => current + 1);
  }

  function handleNewPuzzle() {
    if (loadingNext) return;
    const ids = [...seenIds, puzzle.puzzle.id];
    setSeenIds(ids);
    setLoadingNext(true);
    fetchNextPuzzle(ids).then((res) => {
      setLoadingNext(false);
      if (res && "puzzle" in res) {
        submittingRef.current = false;
        setPuzzle(res);
        setRating(res.rating);
        setStreak(res.puzzleStreak);
        setResult(null);
        setRound(0);
      }
    });
  }

  const points = result?.reward?.points ?? 0;

  return (
    <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,480px)_1fr]">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="rounded-full border border-zinc-300 px-3 py-1 font-medium dark:border-zinc-700">
            Rating {rating}
          </span>
          <span className="rounded-full border border-zinc-300 px-3 py-1 font-medium dark:border-zinc-700">
            Streak {streak}
          </span>
        </div>
        <PuzzleBoard
          key={`${puzzle.puzzle.id}-${round}`}
          fen={puzzle.puzzle.fen}
          lastMove={puzzle.puzzle.lastMove}
          solutionMoves={puzzle.puzzle.solutionMoves}
          disabled={loadingNext}
          onOutcome={handleOutcome}
          onNext={handleNewPuzzle}
          onRetry={handleRetry}
        />
        <div className="mt-4 flex justify-end">
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
                  ? `You solved it${points > 0 ? ` and earned +${points} XP` : ""}.`
                  : "The puzzle reset your streak. On to the next one!"}
              </p>
              <p className="mt-2">
                Puzzle streak:{" "}
                <span className="font-semibold">{result.puzzleStreak}</span> ·
                Rating <span className="font-semibold">{result.rating}</span>
              </p>
              {result.reward && result.reward.newBadges.length > 0 && (
                <p className="mt-2 font-medium text-amber-700 dark:text-amber-400">
                  New badge: {result.reward.newBadges.join(", ")}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Drag or click a piece for your first attempt.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">How it works</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
            <li>Click or drag the best move. A wrong move ends the attempt.</li>
            <li>Solved: +10 rating and +10 XP.</li>
            <li>A wrong move costs 15 rating and resets the streak.</li>
            <li>Every consecutive solve pays +5 bonus XP.</li>
            <li>Puzzles never gate your course progress.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}