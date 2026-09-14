import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in — ChessGuideX" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await getAuthUser();
  if (user) redirect("/dashboard");

  const messages: Record<string, string> = {
    confirm_failed: "We couldn't confirm your email. Please sign in again.",
    signout: "You have been signed out.",
  };

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold">Sign in to ChessGuideX</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Pick up where you left off.
          </p>
          <LoginForm initialError={error ? messages[error] : undefined} />
        </div>
        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          No account yet?{" "}
          <Link href="/register" className="font-medium underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}