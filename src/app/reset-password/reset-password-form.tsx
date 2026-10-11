"use client";

import { useState, type FormEvent } from "react";
import { useActionState } from "react";
import { updatePassword, type AuthFormState } from "@/lib/auth/actions";

const initialState: AuthFormState = {};

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState,
  );
  const [confirmError, setConfirmError] = useState<string | undefined>();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    if (formData.get("password") !== formData.get("confirm")) {
      event.preventDefault();
      setConfirmError("Passwords do not match.");
    }
  }

  return (
    <form action={formAction} onSubmit={onSubmit} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-medium">New password</span>
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Confirm new password</span>
        <input
          type="password"
          name="confirm"
          autoComplete="new-password"
          required
          minLength={8}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </label>
      {confirmError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {confirmError}
        </p>
      )}
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
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}