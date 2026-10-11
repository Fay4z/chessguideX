import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthUser, ensureProfile } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCourseGate, getLessonGates } from "@/lib/gamification/gates";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await prisma.course.findUnique({ where: { slug } });
  return {
    title: course ? `${course.title} — ChessGuideX` : "Courses — ChessGuideX",
  };
}

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await prisma.course.findUnique({
    where: { slug, published: true },
    include: {
      lessons: {
        where: { published: true },
        orderBy: { order: "asc" },
        include: { quiz: { select: { id: true } } },
      },
    },
  });
  if (!course) notFound();

  const authUser = await getAuthUser();
  const profile = authUser ? await ensureProfile(authUser) : null;

  const [courseGate, lessonGates] = await Promise.all([
    getCourseGate(profile?.id ?? null, course.id),
    getLessonGates(profile?.id ?? null, course.id),
  ]);
  const unlockedById = new Map(lessonGates.map((g) => [g.id, g.unlocked]));

  const completedIds = new Set(
    profile
      ? (
          await prisma.lessonProgress.findMany({
            where: {
              userId: profile.id,
              lessonId: { in: course.lessons.map((l) => l.id) },
              completedAt: { not: null },
            },
            select: { lessonId: true },
          })
        ).map((p) => p.lessonId)
      : [],
  );
  const completedLessons = completedIds.size;

  const totalLessons = course.lessons.length;
  const progress = totalLessons === 0 ? 0 : completedLessons / totalLessons;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Link
        href="/courses"
        className="text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← All courses
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium uppercase tracking-wide dark:border-zinc-700">
            {LEVEL_LABEL[course.level] ?? course.level}
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            {course.title}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            {course.description}
          </p>
        </div>
        <div>
          {courseGate.unlocked ? (
            <span className="inline-block rounded-full border border-emerald-300 px-6 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-700 dark:text-emerald-400">
              Open
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-500 dark:border-zinc-700">
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
          )}
        </div>
      </header>

      {courseGate.unlocked ? (
        <>
          <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
                <span>
                  Completed {completedLessons} of {totalLessons} lessons
                </span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-50"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </div>

          <ol className="mt-8 space-y-3">
            {course.lessons.map((lesson, i) => {
              const done = completedIds.has(lesson.id);
              const unlocked = unlockedById.get(lesson.id) ?? false;
              const inner = (
                <>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      done
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span className="flex-1">
                    <span className="font-medium">{lesson.title}</span>
                    <span className="block text-xs text-zinc-500">
                      {lesson.quiz ? "Includes quiz" : "No quiz"}
                    </span>
                  </span>
                  {done ? (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Completed
                    </span>
                  ) : (
                    !unlocked && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                        <svg
                          className="h-3.5 w-3.5"
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
                    )
                  )}
                </>
              );
              return (
                <li key={lesson.id}>
                  {unlocked ? (
                    <Link
                      href={`/courses/${course.slug}/lessons/${lesson.slug}`}
                      className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 opacity-70 dark:border-zinc-800 dark:bg-zinc-900">
                      {inner}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      ) : (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <svg
            className="mx-auto h-8 w-8 text-zinc-400"
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
          <h2 className="mt-3 text-lg font-semibold">This course is locked</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            {courseGate.previousTitle ? (
              <>
                Complete{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {courseGate.previousTitle}
                </span>{" "}
                before starting this course.
              </>
            ) : (
              "Work through the courses in order to unlock each next step."
            )}
          </p>
        </div>
      )}
    </div>
  );
}