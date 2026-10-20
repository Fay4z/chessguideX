import { notFound } from "next/navigation";
import { PrototypeSwitcher } from "@/components/prototype-switcher";
import { PROTOTYPE_PUZZLES } from "./puzzles";
import { PuzzlePrototype, type PrototypeVariant } from "./puzzle-prototype";

export const metadata = { title: "Puzzle prototype — ChessGuideX" };

const VARIANTS: { key: PrototypeVariant; label: string }[] = [
  { key: "A", label: "Right rail" },
  { key: "B", label: "Under the board" },
  { key: "C", label: "Tabs under the board" },
];

export default async function PuzzlePrototypePage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { variant } = await searchParams;
  const current = VARIANTS.some((entry) => entry.key === variant)
    ? (variant as PrototypeVariant)
    : "A";

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 pb-28">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600">
        Prototype · throwaway
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Puzzle Zone</h1>
      <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        The popup is locked to the centred modal. This round compares where
        “Your result” and “How it works” should live. Mock puzzles with
        simulated XP, streak and rating — nothing is saved.
      </p>
      <PuzzlePrototype variant={current} puzzles={PROTOTYPE_PUZZLES} />
      <PrototypeSwitcher variants={VARIANTS} current={current} />
    </div>
  );
}