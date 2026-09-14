"use client";

import { useActionState } from "react";
import {
  enrollInCourse,
  type EnrollState,
} from "@/lib/content/actions";

export function EnrollForm({ courseId }: { courseId: string }) {
  const [state, formAction, isPending] = useActionState<EnrollState, FormData>(
    enrollInCourse,
    { ok: false },
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="courseId" value={courseId} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
      >
        {isPending ? "Enrolling…" : "Enroll in this course"}
      </button>
      {state.message && (
        <p
          className={`mt-2 text-sm ${
            state.ok
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}