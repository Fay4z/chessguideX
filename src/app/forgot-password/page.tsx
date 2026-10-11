import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = { title: "Reset password — ChessGuideX" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold">Reset your password</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Enter your email and we&apos;ll send you a reset link.
          </p>
          {error === "expired" && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              That reset link was invalid or expired. Request a new one below.
            </p>
          )}
          <ForgotPasswordForm />
        </div>
        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Remembered it?{" "}
          <Link href="/login" className="font-medium underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}