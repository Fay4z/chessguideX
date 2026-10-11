import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in — ChessGuideX" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const user = await getAuthUser();
  if (user) redirect("/dashboard");

  const messages: Record<string, string> = {
    confirm_failed: "We couldn't confirm your email. Please sign in again.",
    signout: "You have been signed out.",
  };

  const successMessages: Record<string, string> = {
    password_updated: "Password updated. Sign in with your new password.",
  };

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold">Sign in to ChessGuideX</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Pick up where you left off.
          </p>
          {success && successMessages[success] && (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              {successMessages[success]}
            </p>
          )}
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