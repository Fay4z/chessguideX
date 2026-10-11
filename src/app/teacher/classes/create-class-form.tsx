"use client";

import { useActionState } from "react";
import { createClass, type StaffFormState } from "@/lib/staff/actions";

export function CreateClassForm() {
  const [state, formAction] = useActionState<StaffFormState, FormData>(
    createClass,
    {},
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-4">
      <label className="block flex-1 sm:max-w-xs">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Class name
        </span>
        <input
          name="name"
          placeholder="e.g. Year 4 — Amber"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </label>
      <button
        type="submit"
        className="rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
      >
        Create class
      </button>
      {state.error && (
        <p className="w-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="w-full rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          {state.success}
        </p>
      )}
    </form>
  );
}