import { prisma } from "@/lib/db";
import {
  applyAward,
  awardKey,
  type AwardEvent,
  type AwardKind,
} from "./awards";
import { earnedBadgeIds, type BadgeStats } from "./badges";
import { levelFor } from "./level";
import { nextDailyStreak } from "./streaks";

export interface AwardRecordResult {
  points: number;
  level: string;
  newBadges: string[];
}

async function statsFor(userId: string): Promise<BadgeStats> {
  const [progress, attempts, streak] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId, passed: true },
      select: { lesson: { select: { quizId: true } } },
    }),
    prisma.puzzleAttempt.findMany({
      where: { userId, solved: true },
      select: { puzzleId: true },
    }),
    prisma.streak.findUnique({ where: { userId } }),
  ]);
  return {
    lessonsCompleted: progress.length,
    quizzesPassed: progress.filter((p) => p.lesson.quizId).length,
    puzzlesSolved: new Set(attempts.map((a) => a.puzzleId)).size,
    dailyStreak: streak?.dailyCount ?? 0,
    coursesCompleted: 0,
  };
}

/**
 * Persists engine awards through the points ledger with structural idempotency
 * (unique userId+reason+refId), extends the daily streak on any recorded
 * activity, and issues newly-earned badges. Every rule decision comes from the
 * pure engine modules; this adapter only reads state and writes results.
 */
export async function awardAndPersist(
  userId: string,
  events: AwardEvent[],
): Promise<AwardRecordResult> {
  const [ledgerRows, streak] = await Promise.all([
    prisma.pointsLedger.findMany({
      where: { userId },
      select: { reason: true, refId: true, points: true },
    }),
    prisma.streak.findUnique({ where: { userId } }),
  ]);

  const state = {
    awardedKeys: new Set(
      ledgerRows.map((r) =>
        awardKey({ kind: r.reason as AwardKind, refId: r.refId }),
      ),
    ),
  };

  let points = 0;
  for (const event of events) {
    const result = applyAward(state, event);
    if (!result.awarded) continue;
    try {
      await prisma.pointsLedger.create({
        data: {
          userId,
          reason: event.kind,
          refId: event.refId,
          points: result.points,
        },
      });
    } catch (e) {
      if ((e as { code?: string }).code === "P2002") continue;
      throw e;
    }
    state.awardedKeys.add(result.key);
    points += result.points;
  }

  const today = new Date().toISOString().slice(0, 10);
  const lastDay = streak?.lastDailyAt
    ? streak.lastDailyAt.toISOString().slice(0, 10)
    : null;
  const dailyCount = nextDailyStreak(
    streak?.dailyCount ?? 0,
    lastDay,
    today,
  );
  await prisma.streak.upsert({
    where: { userId },
    update: { dailyCount, lastDailyAt: new Date() },
    create: { userId, dailyCount, lastDailyAt: new Date() },
  });

  const totalPoints =
    ledgerRows.reduce((sum, r) => sum + r.points, 0) + points;

  const stats: BadgeStats = {
    ...(await statsFor(userId)),
    dailyStreak: dailyCount,
  };
  const earned = earnedBadgeIds(stats);
  const owned = new Set(
    (
      await prisma.badgeAward.findMany({
        where: { userId },
        select: { badgeId: true },
      })
    ).map((b) => b.badgeId),
  );
  const newBadges: string[] = [];
  for (const badgeId of earned) {
    if (owned.has(badgeId)) continue;
    try {
      await prisma.badgeAward.create({ data: { userId, badgeId } });
      newBadges.push(badgeId);
    } catch (e) {
      if ((e as { code?: string }).code === "P2002") continue;
      throw e;
    }
  }

  return { points, level: levelFor(totalPoints), newBadges };
}