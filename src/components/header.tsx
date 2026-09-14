"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/lib/auth/actions";

export function Header() {
  const [user, setUser] = useState<{ email?: string | null } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          ChessGuideX
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/courses"
            className="hidden text-zinc-600 transition hover:text-zinc-900 sm:inline dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Courses
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden text-zinc-600 transition hover:text-zinc-900 sm:inline dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Dashboard
              </Link>
              <span className="hidden text-zinc-500 md:inline">
                {user.email}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-full border border-zinc-300 px-4 py-1.5 font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-zinc-900 px-4 py-1.5 font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}