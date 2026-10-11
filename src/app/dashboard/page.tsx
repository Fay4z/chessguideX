import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser, ensureProfile } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BADGE_IDS, BADGE_META } from "@/lib/gamification/badges";
import { levelInfo } from "@/lib/gamification/level";
import { rankByPoints } from "@/lib/gamification/leaderboard";
import type { AwardKind } from "@/lib/gamification/awards";
import { DailyStreakClaim } from "@/components/hub/DailyStreakClaim";

export const metadata = { title: "Dashboard — ChessGuideX" };

const ACTIVITY_LABELS: Record<AwardKind, string> = {
  lesson_complete: "Completed a lesson",
  quiz_pass: "Passed a quiz",
  course_test_pass: "Passed a course test",
  puzzle_solved: "Solved a puzzle",
  puzzle_streak_bonus: "Puzzle streak bonus",
  daily_login: "Daily bonus",
};

export default async function DashboardPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect("/login");
  const profile = await ensureProfile(authUser);

  if (profile.role === "ADMIN") redirect("/admin/teachers");
  if (profile.role === "TEACHER") {
    return <TeacherHome name={profile.name} />;
  }

  const [{ _sum }, streak, badgeAwards, activity, courses] = await Promise.all([
    prisma.pointsLedger.aggregate({
      where: { userId: profile.id },
      _sum: { points: true },
    }),
    prisma.streak.findUnique({ where: { userId: profile.id } }),
    prisma.badgeAward.findMany({
      where: { userId: profile.id },
      select: { badgeId: true },
    }),
    prisma.pointsLedger.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { reason: true, points: true, createdAt: true },
    }),
    prisma.course.findMany({
      where: { published: true },
      orderBy: [{ level: "asc" }, { order: "asc" }],
      select: {
        slug: true,
        title: true,
        lessons: {
          where: { published: true },
          orderBy: { order: "asc" },
          select: {
            slug: true,
            title: true,
            progress: {
              where: { userId: profile.id, completedAt: { not: null } },
              select: { id: true },
            },
          },
        },
      },
    }),
  ]);

  const xp = _sum.points ?? 0;
  const lvl = levelInfo(xp);
  const earned = new Set(badgeAwards.map((b) => b.badgeId));

  const today = new Date().toISOString().slice(0, 10);
  const claimedToday = Boolean(
    await prisma.pointsLedger.findUnique({
      where: {
        userId_reason_refId: {
          userId: profile.id,
          reason: "daily_login",
          refId: today,
        },
      },
      select: { id: true },
    }),
  );

  const memberships = await prisma.classMember.findMany({
    where: { userId: profile.id },
    orderBy: { joinedAt: "asc" },
    select: { class: { select: { id: true, name: true } } },
  });
  const klass = memberships[0]?.class ?? null;

  let leaderboard: {
    rank: number;
    userId: string;
    name: string;
    points: number;
  }[] | null = null;
  if (klass) {
    const classmates = await prisma.classMember.findMany({
      where: { classId: klass.id },
      select: { user: { select: { id: true, name: true } } },
    });
    const totals = await prisma.pointsLedger.groupBy({
      by: ["userId"],
      where: { userId: { in: classmates.map((m) => m.user.id) } },
      _sum: { points: true },
    });
    const byUser = new Map(totals.map((t) => [t.userId, t._sum.points ?? 0]));
    leaderboard = rankByPoints(
      classmates.map((m) => ({
        userId: m.user.id,
        name: m.user.name ?? "—",
        points: byUser.get(m.user.id) ?? 0,
      })),
    );
  }

  let nextLesson: { href: string; lessonTitle: string; courseTitle: string } | null =
    null;
  outer: for (const course of courses) {
    for (const lesson of course.lessons) {
      if (lesson.progress.length === 0) {
        nextLesson = {
          href: `/courses/${course.slug}/lessons/${lesson.slug}`,
          lessonTitle: lesson.title,
          courseTitle: course.title,
        };
        break outer;
      }
    }
  }

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

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {nextLesson ? (
          <>
            <h2 className="text-xl font-semibold">Continue learning</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {nextLesson.courseTitle} · {nextLesson.lessonTitle}
            </p>
            <Link
              href={nextLesson.href}
              className="mt-6 inline-block rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
            >
              Pick up where you left off
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold">
              {courses.length > 0
                ? "You finished everything!"
                : "Welcome to ChessGuideX"}
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {courses.length > 0
                ? "Every lesson is done. Bring on the next course."
                : "Courses with interactive lessons, quizzes and puzzles are waiting."}
            </p>
            <Link
              href="/courses"
              className="mt-6 inline-block rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
            >
              Browse courses
            </Link>
          </>
        )}
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Level
          </div>
          <div className="mt-2 text-3xl font-bold">{lvl.level}</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {xp} XP
            {lvl.next
              ? ` · ${lvl.xpToNext} XP to ${lvl.next}`
              : " · top level!"}
          </div>
        </div>
        <DailyStreakClaim
          count={streak?.dailyCount ?? 0}
          claimedToday={claimedToday}
        />
        <StreakCard
          label="Puzzle streak"
          value={streak?.puzzleCount ?? 0}
          unit="in a row"
        />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Badges</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {BADGE_IDS.map((badgeId) => {
            const meta = BADGE_META[badgeId];
            const isEarned = earned.has(badgeId);
            return (
              <div
                key={badgeId}
                className={`rounded-2xl border p-4 ${
                  isEarned
                    ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30"
                    : "border-zinc-200 bg-white opacity-60 dark:border-zinc-800 dark:bg-zinc-900"
                }`}
              >
                <div
                  className={`text-3xl ${
                    isEarned ? "" : "grayscale"
                  }`}
                  aria-hidden
                >
                  {isEarned ? "★" : "☆"}
                </div>
                <div className="mt-2 font-semibold">{meta.label}</div>
                <div className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                  {meta.description}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {klass && leaderboard && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Class leaderboard</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {klass.name}
          </p>
          <ol className="mt-3 divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {leaderboard.map((row) => {
              const isSelf = row.userId === profile.id;
              return (
                <li
                  key={row.userId}
                  className={`flex items-center justify-between px-4 py-3 text-sm ${
                    isSelf
                      ? "bg-zinc-50 dark:bg-zinc-800/60"
                      : ""
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-6 text-right font-semibold text-zinc-500 tabular-nums">
                      {row.rank}
                    </span>
                    <span className="font-medium">
                      {row.name}
                      {isSelf && (
                        <span className="ml-2 rounded-full border border-zinc-300 px-2 py-0.5 text-xs uppercase tracking-wide dark:border-zinc-700">
                          You
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">
                    {row.points} XP
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Recent activity</h2>
        {activity.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            No activity yet — complete your first lesson to start earning
            points.
          </p>
        ) : (
          <ol className="mt-3 divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {activity.map((entry, i) => (
              <li
                key={i}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span>
                  <span className="font-medium">
                    {ACTIVITY_LABELS[entry.reason as AwardKind] ?? entry.reason}
                  </span>
                  <span className="ml-2 text-zinc-500 dark:text-zinc-500">
                    {entry.createdAt.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  +{entry.points} XP
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function StreakCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {value === 0 ? "Not started yet" : unit}
      </div>
    </div>
  );
}

function TeacherHome({ name }: { name: string | null }) {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {name ? `Welcome, ${name}` : "Teacher home"}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manage your classes and follow your students&apos; progress.
        </p>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold">My classes</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Create a class and add your students with their login details.
          </p>
          <Link
            href="/teacher/classes"
            className="mt-5 inline-block rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
          >
            Manage classes
          </Link>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-semibold">Students</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Open a class to see its students and add login accounts.
          </p>
          <Link
            href="/teacher/classes"
            className="mt-5 inline-block rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            View students
          </Link>
        </div>
      </section>
    </div>
  );
}