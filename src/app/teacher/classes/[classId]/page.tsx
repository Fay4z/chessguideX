import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser, ensureProfile } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { summarizeProgress } from "@/lib/gamification/student-progress";
import { AddStudentForm } from "./add-student-form";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata = { title: "Class — ChessGuideX" };

export default async function TeacherClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;

  const authUser = await getAuthUser();
  if (!authUser) redirect("/login");
  const profile = await ensureProfile(authUser);
  if (profile.role !== "TEACHER" && profile.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const klass = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              lessonProgress: {
                include: {
                  lesson: {
                    select: {
                      quiz: { select: { minScore: true } },
                    },
                  },
                },
              },
              puzzleAttempts: { select: { puzzleId: true, solved: true } },
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!klass) redirect("/teacher/classes");
  if (profile.role === "TEACHER" && klass.teacherId !== profile.id) {
    redirect("/teacher/classes");
  }

  const memberIds = klass.members.map((member) => member.user.id);
  const totals = await prisma.pointsLedger.groupBy({
    by: ["userId"],
    where: { userId: { in: memberIds } },
    _sum: { points: true },
  });
  const pointsByUser = new Map(
    totals.map((t) => [t.userId, t._sum.points ?? 0]),
  );

  const roster = klass.members.map((member) => {
    const quizzesPassed = member.user.lessonProgress.filter(
      (p) =>
        p.score !== null &&
        p.lesson.quiz !== null &&
        p.score >= p.lesson.quiz.minScore,
    ).length;
    return {
      ...member,
      progress: summarizeProgress({
        points: pointsByUser.get(member.user.id) ?? 0,
        lessonsDone: member.user.lessonProgress.filter((p) => p.passed).length,
        quizzesPassed,
        puzzlesSolved: new Set(
          member.user.puzzleAttempts
            .filter((a) => a.solved)
            .map((a) => a.puzzleId),
        ).size,
      }),
    };
  });

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Link
        href="/teacher/classes"
        className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← My classes
      </Link>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{klass.name}</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {klass.members.length} student{klass.members.length === 1 ? "" : "s"}.
        Each student signs in with the email and password you set.
      </p>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Add a student</h2>
        <div className="mt-4">
          <AddStudentForm classId={klass.id} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Students</h2>
        {klass.members.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            No students yet. Add the first one above.
          </p>
        ) : (
          <div className="mt-3 overflow-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Level</th>
                  <th className="px-4 py-3 text-right font-medium">Points</th>
                  <th className="px-4 py-3 text-right font-medium">Lessons</th>
                  <th className="px-4 py-3 text-right font-medium">Quizzes</th>
                  <th className="px-4 py-3 text-right font-medium">Puzzles</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {roster.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {member.user.name ?? "—"}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-500">
                        {member.user.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">{member.progress.level}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {member.progress.points}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {member.progress.lessonsDone}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {member.progress.quizzesPassed}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {member.progress.puzzlesSolved}
                    </td>
                    <td className="px-4 py-3 text-right align-middle">
                      <ResetPasswordForm
                        classId={klass.id}
                        userId={member.user.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}