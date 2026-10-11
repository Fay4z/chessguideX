import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser, ensureProfile } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateClassForm } from "./create-class-form";

export const metadata = { title: "My Classes — ChessGuideX" };

export default async function TeacherClassesPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect("/login");
  const profile = await ensureProfile(authUser);
  if (profile.role !== "TEACHER" && profile.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const classes = await prisma.class.findMany({
    where: { teacherId: profile.id },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { members: true } } },
  });

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">My classes</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Create a class, then add your students with their login details.
      </p>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">New class</h2>
        <div className="mt-4">
          <CreateClassForm />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          Classes ({classes.length})
        </h2>
        {classes.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            No classes yet. Create the first one above.
          </p>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {classes.map((klass) => (
              <Link
                key={klass.id}
                href={`/teacher/classes/${klass.id}`}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
              >
                <div className="text-lg font-semibold">{klass.name}</div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {klass._count.members} student
                  {klass._count.members === 1 ? "" : "s"}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}