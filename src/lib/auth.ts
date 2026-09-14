import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

/**
 * Return the current Supabase auth user, or null if unauthenticated.
 * Uses the per-request cookie session (server-side only).
 */
export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Ensure a matching row exists in the `User` table for the given
 * Supabase auth user.  Creates one on first login/signup, or updates
 * the profile fields if they change in Supabase.
 *
 * Returns the full Prisma User record.
 */
export async function ensureProfile(sbUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const email = sbUser.email ?? "";
  const name = (sbUser.user_metadata?.name ?? sbUser.user_metadata?.full_name ?? null) as string | null;
  const avatarUrl = (sbUser.user_metadata?.avatar_url ?? null) as string | null;

  return prisma.user.upsert({
    where: { supabaseUserId: sbUser.id },
    update: { email, name, avatarUrl },
    create: {
      supabaseUserId: sbUser.id,
      email,
      name,
      avatarUrl,
      role: "STUDENT",
    },
  });
}