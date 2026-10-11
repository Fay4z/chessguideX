import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata = { title: "Set new password — ChessGuideX" };

export default async function ResetPasswordPage() {
  const user = await getAuthUser();
  if (!user) redirect("/forgot-password?error=expired");

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold">Choose a new password</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            For <span className="font-medium">{user.email}</span>
          </p>
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}