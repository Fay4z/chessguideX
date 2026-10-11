"use client";

import { useRef, useState } from "react";
import { submitPuzzleAttempt } from "@/app/puzzles/actions";
import { PuzzleBoard } from "@/components/puzzles/PuzzleBoard";

export interface LessonPuzzleView {
  id: string;
  fen: string;
  solutionMoves: string[];
}

export function LessonPuzzleSet({ puzzles }: { puzzles: LessonPuzzleView[] }) {
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<{
    solved: boolean;
    points: number;
  } | null>(null);
  const [done, setDone] = useState(false);
  const submittingRef = useRef(false);

  if (puzzles.length === 0) return null;
  const current = puzzles[index];
  const isLast = index === puzzles.length - 1;

  function handleOutcome(outcome: {
    solved: boolean;
    attemptsUsed: number;
    timeMs: number;
  }) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    submitPuzzleAttempt(
      current.id,
      outcome.solved,
      outcome.attemptsUsed,
      outcome.timeMs,
    ).then((res) =>
      setResult({
        solved: res.solved,
        points: res.reward?.points ?? 0,
      }),
    );
  }

  function next() {
    submittingRef.current = false;
    setResult(null);
    if (isLast) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <section className="mt-12 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Practice what you learned</h2>
        <span className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium uppercase tracking-wide dark:border-zinc-700">
          {done ? "Done" : `Puzzle ${index + 1} of ${puzzles.length}`}
        </span>
      </div>

      {done ? (
        <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
          Nice work — you practised every puzzle for this lesson. These solves
          count toward your puzzle streak and points too.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Same as the Puzzle Zone: drag the move, one hint after a miss, the
            full solution plays out if you miss twice.
          </p>
          <div className="mt-5 max-w-[480px]">
            <PuzzleBoard
              key={current.id}
              fen={current.fen}
              solutionMoves={current.solutionMoves}
              onOutcome={handleOutcome}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="flex-1 text-sm font-medium">
              {result ? (
                result.solved ? (
                  <span className="text-emerald-700 dark:text-emerald-400">
                    Solved!{result.points > 0 && ` +${result.points} XP`}
                  </span>
                ) : (
                  <span className="text-red-700 dark:text-red-400">
                    Not this time — keep going.
                  </span>
                )
              ) : (
                <span className="text-zinc-500">
                  Drag a piece for your first attempt.
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={next}
              disabled={!result}
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {isLast ? "Finish" : "Next puzzle"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}