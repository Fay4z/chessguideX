"use client";

/**
 * Prototype — puzzle interaction + information placement.
 * Locked: centred result modal, click-to-select hints, last-move highlight.
 * Question: where should "Your result" and "How it works" live?
 * Throwaway: mock puzzles, in-memory state, no database.
 */
import { useMemo, useState, type ReactNode } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import type { PrototypePuzzle } from "./puzzles";
import {
  advancePuzzle,
  attemptMove,
  retryPuzzle,
  startSession,
  type PuzzleSession,
} from "./session";

export type PrototypeVariant = "A" | "B" | "C";

type HintKind = "move" | "capture";
type Hints = Record<string, HintKind>;

interface DropArgs {
  sourceSquare: string;
  targetSquare: string | null;
}

interface ClickArgs {
  piece: { pieceType: string } | null;
  square: string;
}

interface BoardCardProps {
  session: PuzzleSession;
  puzzle: PrototypePuzzle;
  total: number;
  selected: string | null;
  hints: Hints;
  lastMoveSquares: string[];
  rating: number;
  streak: number;
  onDrop: (args: DropArgs) => boolean;
  onSquareClick: (args: ClickArgs) => void;
  onRetry: () => void;
  onNext: () => void;
}

const CARD =
  "rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900";

const ACTION_BUTTON =
  "mt-3 w-full rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300";

export function PuzzlePrototype({
  variant,
  puzzles,
}: {
  variant: PrototypeVariant;
  puzzles: PrototypePuzzle[];
}) {
  const [session, setSession] = useState<PuzzleSession>(() =>
    startSession(0, puzzles),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [rating, setRating] = useState(420);
  const [streak, setStreak] = useState(3);
  const [lastResult, setLastResult] = useState<{
    solved: boolean;
    points: number;
  } | null>(null);

  const puzzle = puzzles[session.index];
  const side = puzzle.fen.split(" ")[1] === "w" ? "w" : "b";

  const hints = useMemo<Hints>(() => {
    if (!selected || session.status !== "playing") return {};
    const game = new Chess(session.fen);
    const targets: Hints = {};
    for (const move of game.moves({
      square: selected as Square,
      verbose: true,
    })) {
      targets[move.to] = move.captured ? "capture" : "move";
    }
    return targets;
  }, [selected, session.fen, session.status]);

  const highlightUci = session.lastMoveUci ?? puzzle.lastMove;
  const lastMoveSquares = [highlightUci.slice(0, 2), highlightUci.slice(2, 4)];

  function applyMove(from: string, to: string) {
    const result = attemptMove(session, puzzle, from, to);
    if (!result.accepted) return false;
    setSession(result.session);
    setSelected(null);

    if (result.session.status === "correct") {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setRating((current) => current + 10);
      setLastResult({
        solved: true,
        points: 10 + (nextStreak >= 2 ? 5 : 0),
      });
    } else if (result.session.status === "wrong") {
      setStreak(0);
      setRating((current) => current - 15);
      setLastResult({ solved: false, points: 0 });
    }

    return true;
  }

  function handleDrop({ sourceSquare, targetSquare }: DropArgs) {
    if (!targetSquare) {
      setSelected(null);
      return false;
    }
    return applyMove(sourceSquare, targetSquare);
  }

  function handleSquareClick({ piece, square }: ClickArgs) {
    if (session.status !== "playing") return;

    const friendly = piece?.pieceType.startsWith(side) ?? false;
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

    if (!applyMove(selected, square)) setSelected(null);
  }

  function handleRetry() {
    setSelected(null);
    setLastResult(null);
    setSession((current) => retryPuzzle(current, puzzle));
  }

  function handleNext() {
    setSelected(null);
    setLastResult(null);
    setSession((current) => advancePuzzle(current, puzzles));
  }

  const resultBody = (
    <ResultBody
      session={session}
      selected={selected}
      total={puzzles.length}
      rating={rating}
      streak={streak}
      lastResult={lastResult}
    />
  );
  const howBody = <HowItWorksBody />;

  const board = (
    <BoardCard
      session={session}
      puzzle={puzzle}
      total={puzzles.length}
      selected={selected}
      hints={hints}
      lastMoveSquares={lastMoveSquares}
      rating={rating}
      streak={streak}
      onDrop={handleDrop}
      onSquareClick={handleSquareClick}
      onRetry={handleRetry}
      onNext={handleNext}
    />
  );

  const statePanel = (
    <StatePanel
      session={session}
      puzzle={puzzle}
      total={puzzles.length}
      selected={selected}
      lastMoveSquares={lastMoveSquares}
      rating={rating}
      streak={streak}
      lastResult={lastResult}
    />
  );

  if (variant === "B") {
    return (
      <div className="mx-auto mt-6 max-w-xl space-y-4">
        {board}
        <div className="grid gap-4 sm:grid-cols-2">
          <SectionCard title="Your result">{resultBody}</SectionCard>
          <SectionCard title="How it works">{howBody}</SectionCard>
        </div>
        {statePanel}
      </div>
    );
  }

  if (variant === "C") {
    return (
      <TabbedLayout
        board={board}
        result={resultBody}
        how={howBody}
        state={statePanel}
      />
    );
  }

  return (
    <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,480px)_1fr]">
      {board}
      <div className="space-y-4">
        <SectionCard title="Your result">{resultBody}</SectionCard>
        <SectionCard title="How it works">{howBody}</SectionCard>
        {statePanel}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={`${CARD} p-5`}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function ResultBody({
  session,
  selected,
  total,
  rating,
  streak,
  lastResult,
}: {
  session: PuzzleSession;
  selected: string | null;
  total: number;
  rating: number;
  streak: number;
  lastResult: { solved: boolean; points: number } | null;
}) {
  const message = lastResult
    ? lastResult.solved
      ? `You solved it and earned +${lastResult.points} XP.`
      : "The puzzle reset your streak. On to the next one!"
    : selected
      ? `Piece on ${selected} selected. Pick a green square.`
      : "Drag or click a piece for your first attempt.";

  return (
    <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
      <p>{message}</p>
      {lastResult && (
        <p className="mt-1">
          Puzzle streak:{" "}
          <span className="font-semibold">{streak}</span> · Rating{" "}
          <span className="font-semibold">{rating}</span>
        </p>
      )}
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <Stat label="Attempts" value={String(session.attempts)} />
        <Stat label="Last move" value={session.lastMove ?? "—"} />
        <Stat label="Puzzle" value={`${session.index + 1}/${total}`} />
      </div>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
        Mock scoring — nothing is saved.
      </p>
    </div>
  );
}

function ScoreBadge({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
      {label}{" "}
      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
        {value}
      </span>
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-0.5 font-semibold">{value}</div>
    </div>
  );
}

function HowItWorksBody() {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
      <li>Click a piece: green dots are moves, green rings are captures.</li>
      <li>The opponent&apos;s last move is highlighted in light green.</li>
      <li>Every legal move stays on the board — right or wrong.</li>
      <li>Correct opens “Next puzzle”; wrong opens “Try again”.</li>
      <li>Only an illegal move snaps back.</li>
    </ul>
  );
}

function TabbedLayout({
  board,
  result,
  how,
  state,
}: {
  board: ReactNode;
  result: ReactNode;
  how: ReactNode;
  state: ReactNode;
}) {
  const [tab, setTab] = useState<"result" | "how">("result");

  const tabClass = (active: boolean) =>
    `flex-1 px-4 py-3 text-sm font-medium transition ${
      active
        ? "border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
    }`;

  return (
    <div className="mx-auto mt-6 max-w-xl space-y-4">
      {board}
      <section className={`${CARD} overflow-hidden`}>
        <div
          role="tablist"
          aria-label="Puzzle details"
          className="flex border-b border-zinc-200 dark:border-zinc-800"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "result"}
            onClick={() => setTab("result")}
            className={tabClass(tab === "result")}
          >
            Your result
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "how"}
            onClick={() => setTab("how")}
            className={tabClass(tab === "how")}
          >
            How it works
          </button>
        </div>
        <div className="p-5">{tab === "result" ? result : how}</div>
      </section>
      {state}
    </div>
  );
}

function BoardCard({
  session,
  puzzle,
  total,
  selected,
  hints,
  lastMoveSquares,
  rating,
  streak,
  onDrop,
  onSquareClick,
  onRetry,
  onNext,
}: BoardCardProps) {
  const side = puzzle.fen.split(" ")[1] === "w" ? "w" : "b";
  const correct = session.status === "correct";
  const finished = session.status !== "playing";

  return (
    <div className={`${CARD} p-6`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            Puzzle {session.index + 1} of {total}
          </p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight">
            {puzzle.title}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {side === "w" ? "White" : "Black"} to move
            {session.lastMove
              ? ` · last move ${session.lastMove}`
              : " · click a piece to see its moves"}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          <ScoreBadge label="Rating" value={rating} />
          <ScoreBadge label="Streak" value={streak} />
          <span className="rounded-full border border-amber-300 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-amber-700 dark:border-amber-700 dark:text-amber-400">
            Mock
          </span>
        </div>
      </div>

      <div className="relative">
        <Chessboard
          options={{
            position: session.fen,
            boardOrientation: side === "w" ? "white" : "black",
            allowDragging: session.status === "playing",
            canDragPiece: ({ piece }) => piece.pieceType.startsWith(side),
            onPieceDrop: onDrop,
            onSquareClick,
            animationDurationInMs: 180,
            showNotation: true,
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

        {finished && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-zinc-950/45 p-6 backdrop-blur-[2px]">
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-xs rounded-2xl border border-zinc-200 bg-white p-5 text-center shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
            >
              <p className="text-sm font-semibold">
                {correct ? "Your answer is correct." : "Your answer is wrong."}
              </p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {correct
                  ? "The move stays on the board. Ready for the next one?"
                  : "The move stays on the board. Try again to reset the position."}
              </p>
              <button
                type="button"
                onClick={correct ? onNext : onRetry}
                className={ACTION_BUTTON}
              >
                {correct ? "Next puzzle" : "Try again"}
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

function StatePanel({
  session,
  puzzle,
  total,
  selected,
  lastMoveSquares,
  rating,
  streak,
  lastResult,
}: {
  session: PuzzleSession;
  puzzle: PrototypePuzzle;
  total: number;
  selected: string | null;
  lastMoveSquares: string[];
  rating: number;
  streak: number;
  lastResult: { solved: boolean; points: number } | null;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-amber-400/70 bg-amber-50/60 p-4 dark:bg-amber-950/10">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
        Prototype state
      </h2>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
        <dt className="text-zinc-500">status</dt>
        <dd>{session.status}</dd>
        <dt className="text-zinc-500">puzzle</dt>
        <dd>
          {session.index + 1}/{total} · {puzzle.id}
        </dd>
        <dt className="text-zinc-500">selected</dt>
        <dd>{selected ?? "—"}</dd>
        <dt className="text-zinc-500">highlight</dt>
        <dd>{lastMoveSquares.join(" → ")}</dd>
        <dt className="text-zinc-500">wrong attempts</dt>
        <dd>{session.attempts}</dd>
        <dt className="text-zinc-500">last move</dt>
        <dd>{session.lastMove ?? "—"}</dd>
        <dt className="text-zinc-500">rating</dt>
        <dd>{rating}</dd>
        <dt className="text-zinc-500">streak</dt>
        <dd>{streak}</dd>
        <dt className="text-zinc-500">last award</dt>
        <dd>
          {lastResult
            ? lastResult.solved
              ? `+${lastResult.points} XP`
              : "0 XP · streak reset"
            : "—"}
        </dd>
        <dt className="text-zinc-500">answer</dt>
        <dd>{puzzle.solution}</dd>
        <dt className="text-zinc-500">fen</dt>
        <dd className="break-all">{session.fen}</dd>
      </dl>
    </section>
  );
}