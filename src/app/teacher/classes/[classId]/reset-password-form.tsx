"use client";

import { useActionState, useState } from "react";
import { resetStudentPassword, type StaffFormState } from "@/lib/staff/actions";

export function ResetPasswordForm({
  classId,
  userId,
}: {
  classId: string;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<StaffFormState, FormData>(
    resetStudentPassword.bind(null, classId, userId),
    {},
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Reset password
      </button>
      {open && (
        <form action={formAction} className="mt-2 flex items-center gap-2">
          <input
            name="password"
            type="password"
            placeholder="New password (8+ chars)"
            className="w-44 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
          />
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
          >
            Save
          </button>
        </form>
      )}
      {state.error && (
        <p className="mt-1 text-xs text-red-700 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
          {state.success}
        </p>
      )}
    </div>
  );
}