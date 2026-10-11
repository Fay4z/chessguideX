import { redirect } from "next/navigation";
import { getAuthUser, ensureProfile } from "@/lib/auth";
import { pickNextPuzzle } from "@/lib/puzzles/pick";
import { PuzzleZone } from "@/components/puzzles/PuzzleZone";

export const metadata = { title: "Puzzle Zone — ChessGuideX" };

export default async function PuzzlesPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect("/login");
  const profile = await ensureProfile(authUser);
  if (profile.role === "ADMIN") redirect("/admin/teachers");
  if (profile.role === "TEACHER") redirect("/dashboard");

  const initial = await pickNextPuzzle(profile.id);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Puzzle Zone</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Free practice — solve puzzles to grow your rating and streak.
          </p>
        </div>
      </div>
      <PuzzleZone initial={initial} />
    </div>
  );
}