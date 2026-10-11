import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser, ensureProfile } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AddStudentForm } from "./add-student-form";

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
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!klass) redirect("/teacher/classes");
  if (profile.role === "TEACHER" && klass.teacherId !== profile.id) {
    redirect("/teacher/classes");
  }

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
          <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {klass.members.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
                  >
                    <td className="px-4 py-3 font-medium">
                      {member.user.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {member.user.email}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-500">
                      {member.joinedAt.toLocaleDateString()}
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