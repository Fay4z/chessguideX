import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/auth";

/**
 * Handles the OAuth / email-confirmation callback: exchanges the
 * `code` for a session, then redirects to the dashboard.
 *
 * Called by Supabase with `?code=...` (email confirmation links and
 * other redirect flows).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/dashboard";

  // Prevent open redirects — only allow same-site paths.
  if (!next.startsWith("/") || next.startsWith("//")) next = "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const user = await supabase.auth.getUser();
      if (user.data.user) await ensureProfile(user.data.user);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=confirm_failed`,
  );
}