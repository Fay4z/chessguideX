"use client";

import { useActionState } from "react";
import { forgotPassword, type AuthFormState } from "@/lib/auth/actions";

const initialState: AuthFormState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPassword,
    initialState,
  );

  if (state.success) {
    return (
      <div className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
        {state.success}
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </label>
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}