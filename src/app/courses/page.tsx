import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata = { title: "Courses — ChessGuideX" };

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
  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      level: true,
      description: true,
      _count: { select: { lessons: true } },
    },
  });

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Five minutes a day, three levels, from your first move to your first
        certificate.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.slug}`}
            className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <span
              className={`self-start rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${LEVEL_BADGE[course.level] ?? LEVEL_BADGE.BEGINNER}`}
            >
              {LEVEL_LABEL[course.level] ?? course.level}
            </span>
            <h2 className="mt-4 text-lg font-semibold tracking-tight group-hover:underline">
              {course.title}
            </h2>
            <p className="mt-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
              {course.description}
            </p>
            <p className="mt-4 text-xs text-zinc-500">
              {course._count.lessons} lesson
              {course._count.lessons === 1 ? "" : "s"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}