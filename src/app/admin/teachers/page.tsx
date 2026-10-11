import { redirect } from "next/navigation";
import { getAuthUser, ensureProfile } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TeachersForm } from "./teachers-form";

export const metadata = { title: "Teachers — ChessGuideX" };

export default async function AdminTeachersPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect("/login");
  const profile = await ensureProfile(authUser);
  if (profile.role !== "ADMIN") redirect("/dashboard");

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Create and manage the teachers who run classes. Each teacher signs in
        with the email and password you set here.
      </p>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Add a teacher</h2>
        <div className="mt-4">
          <TeachersForm />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          Staff ({teachers.length})
        </h2>
        {teachers.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            No teachers yet. Add the first one above.
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
                  >
                    <td className="px-4 py-3 font-medium">{teacher.name ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {teacher.email}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-500">
                      {teacher.createdAt.toLocaleDateString()}
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