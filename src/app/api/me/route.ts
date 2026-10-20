import { NextResponse } from "next/server";
import { getAuthUser, ensureProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Lightweight viewer lookup for the client header. Returns the signed-in
 * user's email and platform role, or `null` when unauthenticated.
 */
export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json(
      { user: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const profile = await ensureProfile(authUser);
  return NextResponse.json(
    { user: { email: profile.email, role: profile.role } },
    { headers: { "Cache-Control": "no-store" } },
  );
}