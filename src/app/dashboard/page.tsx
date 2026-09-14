import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser, ensureProfile } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata = { title: "Dashboard — ChessGuideX" };

export default async function DashboardPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect("/login");
  const profile = await ensureProfile(authUser);

  const [enrolledCourses, certificates, completedLessons] = await Promise.all([
    prisma.enrollment.count({ where: { userId: profile.id } }),
    prisma.certificate.count({ where: { userId: profile.id } }),
    prisma.lessonProgress.count({
      where: { userId: profile.id, completedAt: { not: null } },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back{profile.name ? `, ${profile.name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {profile.email}
          </p>
        </div>
        <span className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium uppercase tracking-wide dark:border-zinc-700">
          {profile.role.toLowerCase()}
        </span>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Courses enrolled" value={enrolledCourses} />
        <StatCard label="Lessons completed" value={completedLessons} />
        <StatCard label="Certificates earned" value={certificates} />
      </div>

      <section className="mt-10 rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold">Start your first course</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          Courses are being prepared — Beginner, Intermediate and Advanced
          lessons with interactive boards, quizzes and puzzles.
        </p>
        <Link
          href="/courses"
          className="mt-6 inline-block rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
        >
          Browse courses
        </Link>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-3xl font-bold">{value}</div>
      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {label}
      </div>
    </div>
  );
}