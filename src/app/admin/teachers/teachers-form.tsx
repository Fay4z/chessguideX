"use client";

import { useActionState } from "react";
import { createTeacher, type StaffFormState } from "@/lib/staff/actions";

export function TeachersForm() {
  const [state, formAction] = useActionState<StaffFormState, FormData>(
    createTeacher,
    {},
  );

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-3">
      <label className="block">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Name</span>
        <input
          name="name"
          placeholder="e.g. Ms. Okafor"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </label>
      <label className="block">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Email</span>
        <input
          name="email"
          type="email"
          placeholder="teacher@school.edu"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </label>
      <label className="block">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Password
        </span>
        <input
          name="password"
          type="password"
          placeholder="At least 8 characters"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </label>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300 sm:col-span-3">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 sm:col-span-3">
          {state.success}
        </p>
      )}

      <div className="sm:col-span-3">
        <button
          type="submit"
          className="rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
        >
          Create teacher
        </button>
      </div>
    </form>
  );
}