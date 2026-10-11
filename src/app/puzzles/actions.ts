"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser, ensureProfile } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { AwardRecordResult } from "@/lib/gamification/record";
import { awardAndPersist } from "@/lib/gamification/record";
import {
  nextPuzzleRating,
  puzzleEventsFor,
  type PuzzleOutcome,
} from "@/lib/gamification/puzzle-ladder";
import { nextPuzzleStreak } from "@/lib/gamification/streaks";
import {
  pickNextPuzzle,
  type PuzzlePickResult,
} from "@/lib/puzzles/pick";

export interface PuzzleSubmitResult {
  ok: boolean;
  solved: boolean;
  attemptsUsed: number;
  reward: AwardRecordResult | null;
  puzzleStreak: number;
  rating: number;
}

function outcomeFor(solved: boolean, attemptsUsed: number): PuzzleOutcome {
  if (solved && attemptsUsed === 1) return "solved_first_attempt";
  if (solved) return "solved";
  return "failed";
}

export async function submitPuzzleAttempt(
  puzzleId: string,
  solved: boolean,
  attemptsUsed: number,
  timeMs: number | null,
): Promise<PuzzleSubmitResult> {
  const authUser = await getAuthUser();
  if (!authUser) return { ok: false, solved, attemptsUsed, reward: null, puzzleStreak: 0, rating: 400 };
  const profile = await ensureProfile(authUser);
  if (profile.role !== "STUDENT") {
    return { ok: false, solved, attemptsUsed, reward: null, puzzleStreak: 0, rating: 400 };
  }

  const puzzle = await prisma.puzzle.findUnique({ where: { id: puzzleId } });
  if (!puzzle) {
    return { ok: false, solved, attemptsUsed, reward: null, puzzleStreak: 0, rating: 400 };
  }

  const clamped = attemptsUsed >= 2 ? 2 : 1;
  const current = await prisma.streak.findUnique({ where: { userId: profile.id } });
  const currentRating = current?.puzzleRating ?? 400;
  const nextStreak = nextPuzzleStreak(current?.puzzleCount ?? 0, solved);
  const nextRating = nextPuzzleRating(currentRating, outcomeFor(solved, clamped));

  const events = puzzleEventsFor(puzzle.id, solved, nextStreak);
  const reward = events.length > 0 ? await awardAndPersist(profile.id, events) : null;

  await prisma.streak.upsert({
    where: { userId: profile.id },
    update: {
      puzzleCount: nextStreak,
      puzzleRating: nextRating,
      lastPuzzleAt: new Date(),
    },
    create: {
      userId: profile.id,
      puzzleCount: nextStreak,
      puzzleRating: nextRating,
      lastPuzzleAt: new Date(),
    },
  });

  await prisma.puzzleAttempt.create({
    data: {
      userId: profile.id,
      puzzleId: puzzle.id,
      solved,
      attemptsUsed: clamped,
      timeMs,
    },
  });

  revalidatePath("/puzzles");

  return {
    ok: true,
    solved,
    attemptsUsed: clamped,
    reward,
    puzzleStreak: nextStreak,
    rating: nextRating,
  };
}

export async function fetchNextPuzzle(
  avoidIds: string[],
): Promise<PuzzlePickResult | { ok: false; error: string }> {
  const authUser = await getAuthUser();
  if (!authUser) return { ok: false, error: "Sign in to keep solving." };
  const profile = await ensureProfile(authUser);
  if (profile.role !== "STUDENT") {
    return { ok: false, error: "Only students can practice puzzles." };
  }
  return pickNextPuzzle(profile.id, avoidIds);
}