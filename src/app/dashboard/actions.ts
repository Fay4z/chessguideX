"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser, ensureProfile } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { awardAndPersist } from "@/lib/gamification/record";

export type ClaimDailyBonusResult =
  | { ok: true; points: number; dailyCount: number }
  | { ok: false; error: string };

export async function claimDailyBonus(): Promise<ClaimDailyBonusResult> {
  const authUser = await getAuthUser();
  if (!authUser) return { ok: false, error: "Sign in to claim your bonus." };
  const profile = await ensureProfile(authUser);
  if (profile.role !== "STUDENT") {
    return { ok: false, error: "Only students can claim daily bonuses." };
  }

  const today = new Date().toISOString().slice(0, 10);

  const result = await awardAndPersist(profile.id, [
    { kind: "daily_login", refId: today },
  ]);

  const streak = await prisma.streak.findUnique({
    where: { userId: profile.id },
  });

  revalidatePath("/dashboard");

  return {
    ok: true,
    points: result.points,
    dailyCount: streak?.dailyCount ?? 0,
  };
}