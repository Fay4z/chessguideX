"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type { BoardBlock } from "@/lib/content";

export function BoardDemo({ fen, moves }: Omit<BoardBlock, "type">) {
  const total = moves?.length ?? 0;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const positionKey = `${fen}|${moves?.join(" ") ?? ""}`;
  const [prevKey, setPrevKey] = useState(positionKey);
  if (positionKey !== prevKey) {
    setPrevKey(positionKey);
    setIndex(0);
    setPlaying(false);
  }

  const position = useMemo(() => {
    const game = new Chess(fen);
    for (let i = 0; i < index && moves; i++) {
      game.move(moves[i]);
    }
    return game.fen();
  }, [fen, moves, index]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => {
        if (i + 1 >= total) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 900);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, total]);

  const lastMove =
    index > 0 && moves ? moves[index - 1] : null;
  const firstOfPair =
    index % 2 === 1 ? index : index - 1 >= 0 ? index - 1 : null;
  const pairLabel =
    moves && firstOfPair !== null && firstOfPair < moves.length
      ? `${Math.floor(firstOfPair / 2) + 1}. ${moves[firstOfPair]}${moves[firstOfPair + 1] ? ` ${moves[firstOfPair + 1]}` : ""}`
      : null;

  return (
    <div className="my-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="w-full max-w-[340px] sm:w-[340px]">
          <Chessboard
            options={{
              position,
              allowDragging: false,
              showNotation: true,
              boardOrientation: "white",
              animationDurationInMs: 200,
            }}
          />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {lastMove ? (
              <>
                Last move: <span className="font-mono">{lastMove}</span>
              </>
            ) : (
              "Starting position"
            )}
          </p>
          {pairLabel && (
            <p className="mt-1 font-mono text-sm text-zinc-700 dark:text-zinc-300">
              {pairLabel}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setIndex(0);
              }}
              className="rounded-full border border-zinc-300 px-3 py-1.5 font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setIndex((i) => Math.max(0, i - 1));
              }}
              disabled={index === 0}
              className="rounded-full border border-zinc-300 px-3 py-1.5 font-medium transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              disabled={index >= total}
              className="rounded-full bg-zinc-900 px-3 py-1.5 font-medium text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
            >
              {playing ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setIndex((i) => Math.min(total, i + 1));
              }}
              disabled={index >= total}
              className="rounded-full border border-zinc-300 px-3 py-1.5 font-medium transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Next
            </button>
            {total > 0 && (
              <span className="ml-1 text-xs text-zinc-500">
                Move {Math.min(index, total)}/{total}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}