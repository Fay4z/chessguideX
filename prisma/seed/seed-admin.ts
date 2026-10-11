/**
 * Provisions the first platform ADMIN from environment variables.
 *
 * Usage: npm run seed:admin
 * Env: ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD
 * (plus NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 *
 * Idempotent: re-running with the same email is a no-op. If the platform
 * row exists but the Supabase auth user was deleted, it is recreated.
 */

import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { createAdminClient } from "../../src/lib/supabase/admin";

loadEnv({ path: resolve(".env.local") });

function fail(message: string): never {
  console.error(`seed-admin: ${message}`);
  process.exit(1);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function findAuthUserByEmail(email: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) fail(`failed to list auth users: ${error.message}`);
  return data.users.find((u) => u.email?.toLowerCase() === email) ?? null;
}

async function main() {
  const name = process.env.ADMIN_NAME?.trim() || null;
  const email = normalizeEmail(process.env.ADMIN_EMAIL ?? "");
  const password = process.env.ADMIN_PASSWORD ?? "";

  if (!email) fail("ADMIN_EMAIL is required.");
  if (!password || password.length < 8) {
    fail("ADMIN_PASSWORD must be at least 8 characters long.");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    fail("SUPABASE_SERVICE_ROLE_KEY is required.");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    fail("NEXT_PUBLIC_SUPABASE_URL is required.");
  }

  const { prisma } = await import("../../src/lib/db");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.supabaseUserId) {
    const supabase = createAdminClient();
    const { data } = await supabase.auth.admin.getUserById(
      existing.supabaseUserId,
    );
    if (data?.user) {
      console.log(`Admin already exists (${email}); nothing to do.`);
      await prisma.$disconnect();
      return;
    }
    console.log(`Platform row exists but auth user missing; recreating auth user for ${email}.`);
  }

  const supabase = createAdminClient();
  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: name ? { name } : undefined,
  });

  let authUserId = created?.user?.id ?? null;
  if (error) {
    const alreadyRegistered = /already|exists/i.test(error.message);
    if (!alreadyRegistered) {
      fail(`failed to create auth user: ${error.message}`);
    }
    const existingAuth = await findAuthUserByEmail(email);
    if (existingAuth) {
      authUserId = existingAuth.id;
    } else {
      fail(`auth user for ${email} not found after conflict: ${error.message}`);
    }
  }
  if (!authUserId) fail(`no auth user id resolved for ${email}`);

  await prisma.user.upsert({
    where: { email },
    update: { supabaseUserId: authUserId, name, role: "ADMIN" },
    create: { email, name, role: "ADMIN", supabaseUserId: authUserId },
  });

  console.log(`Admin provisioned: ${email} (role ADMIN)`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("seed-admin failed:", e?.message ?? e);
  process.exit(1);
});