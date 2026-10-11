import Link from "next/link";
import { getAuthUser, ensureProfile } from "@/lib/auth";
import { getPathState, getLessonGates } from "@/lib/gamification/gates";
import { nextLessonIndex } from "@/lib/gamification/gating";

export const metadata = { title: "Your learning path — ChessGuideX" };

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const LEVEL_BADGE: Record<string, string> = {
  BEGINNER:
    "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400",
  INTERMEDIATE:
    "border-sky-300 text-sky-700 dark:border-sky-700 dark:text-sky-400",
  ADVANCED:
    "border-violet-300 text-violet-700 dark:border-violet-700 dark:text-violet-400",
};

export default async function CoursesPage() {
  const authUser = await getAuthUser();
  const profile = authUser ? await ensureProfile(authUser) : null;
  const userId = profile?.id ?? null;

  const path = await getPathState(userId);
  const current = path.find((c) => c.unlocked && !c.completed);

  let nextLesson: { slug: string; title: string } | undefined;
  if (current) {
    const gates = await getLessonGates(userId, current.id);
    const next = nextLessonIndex(
      gates.map((g) => g.unlocked),
      gates.map((g) => g.passed),
    );
    if (next >= 0) {
      nextLesson = { slug: gates[next].slug, title: gates[next].title };
    }
  }

  const nextCourse = path.find((c) => c.unlocked && !c.completed);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Your learning path</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        From your first move to your first certificate — one step at a time.
      </p>

      {nextCourse && (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
                {nextCourse.completed ? "Next" : "Continue learning"}
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">
                {nextLesson
                  ? `${nextLesson.title}`
                  : `${nextCourse.title} — all lessons done`}
              </h2>
            </div>
            {nextLesson ? (
              <Link
                href={`/courses/${nextCourse.slug}/lessons/${nextLesson.slug}`}
                className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {nextCourse.completed ? "Start" : "Continue learning"} →
          </Link>
            ) : (
              <span className="rounded-full border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-500 dark:border-zinc-700">
                Awaiting your course test
              </span>
            )}
          </div>
        </div>
      )}

      <ol className="mt-10 space-y-6">
        {path.map((course) => {
          const isCurrent = current?.id === course.id;
          return (
            <li key={course.id} className="relative">
              <Link
                href={`/courses/${course.slug}`}
                className={`flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center dark:bg-zinc-900 ${
                  isCurrent
                    ? "border-zinc-900 ring-1 ring-zinc-900 dark:border-zinc-100 dark:ring-zinc-100"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                } ${course.unlocked ? "" : "opacity-70"}`}
              >
                <div className="flex flex-1 flex-col">
                  <div className="flex items-center gap-2">
                    <span
                      className={`self-start rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${LEVEL_BADGE[course.level] ?? LEVEL_BADGE.BEGINNER}`}
                    >
                      {LEVEL_LABEL[course.level] ?? course.level}
                    </span>
                    {course.completed ? (
                      <span className="rounded-full border border-emerald-300 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-600 dark:border-emerald-700 dark:text-emerald-400">
                        Completed
                      </span>
                    ) : (
                      isCurrent && (
                        <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white dark:bg-zinc-100 dark:text-zinc-900">
                          Current
                        </span>
                      )
                    )}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight">
                    {course.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {course.description}
                  </p>
                  <p className="mt-3 text-xs text-zinc-500">
                    {course.lessonCount} lesson
                    {course.lessonCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="shrink-0">
                  {course.completed ? (
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      Done
                    </span>
                  ) : !course.unlocked ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500">
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="4" y="11" width="16" height="10" rx="2" />
                        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                      </svg>
                      Locked
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Open
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}