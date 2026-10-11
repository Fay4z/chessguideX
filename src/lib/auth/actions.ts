"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/auth";

export type AuthFormState = { error?: string; success?: string };

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

// ─── Login ──────────────────────────────────────────────────────────────────

export async function login(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: error.message };

  await ensureProfile(data.user);
  redirect("/dashboard");
}

// ─── Sign-up ────────────────────────────────────────────────────────────────

export async function signup(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl()}/auth/callback?next=/dashboard`,
      data: name ? { name } : undefined,
    },
  });

  if (error) return { error: error.message };

  // If session exists, email confirmation is disabled and user is signed in.
  if (data.session && data.user) {
    await ensureProfile(data.user);
    redirect("/dashboard");
  }

  return { success: "Check your email to confirm your account." };
}

// ─── Forgot password ───────────────────────────────────────────────────────

export async function forgotPassword(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Email is required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl()}/auth/callback?next=/reset-password`,
  });

  if (error) return { error: error.message };

  return {
    success:
      "If an account exists for that email, a password reset link is on its way.",
  };
}

// ─── Update password (requires a recovery session) ──────────────────────────

export async function updatePassword(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  await supabase.auth.signOut();
  redirect("/login?success=password_updated");
}

// ─── Logout ─────────────────────────────────────────────────────────────────

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}