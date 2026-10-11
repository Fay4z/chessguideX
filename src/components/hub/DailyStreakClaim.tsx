"use client";

import { useState, useTransition } from "react";
import { claimDailyBonus } from "@/app/dashboard/actions";

export function DailyStreakClaim({
  count,
  claimedToday,
}: {
  count: number;
  claimedToday: boolean;
}) {
  const [claimed, setClaimed] = useState(claimedToday);
  const [dailyCount, setDailyCount] = useState(count);
  const [points, setPoints] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function claim() {
    setError(null);
    startTransition(async () => {
      const res = await claimDailyBonus();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDailyCount(res.dailyCount);
      setClaimed(true);
      if (res.points > 0) setPoints(res.points);
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Daily streak
      </div>
      <div className="mt-2 text-3xl font-bold">{dailyCount}</div>
      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {dailyCount === 0 ? "Not started yet" : "days in a row"}
      </div>

      {points !== null && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          +{points} XP claimed
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={claim}
        disabled={claimed || isPending}
        className="mt-4 w-full rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
      >
        {isPending
          ? "Claiming…"
          : claimed
            ? "Claimed today"
            : "Claim +20 XP"}
      </button>
    </div>
  );
}