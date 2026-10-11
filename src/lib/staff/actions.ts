"use server";

import { z } from "zod";
import { getAuthUser, ensureProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/db";

export type StaffFormState = { error?: string; success?: string };

const teacherSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

export async function createTeacher(
  _prevState: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const authUser = await getAuthUser();
  if (!authUser) return { error: "You must be signed in." };
  const profile = await ensureProfile(authUser);
  if (profile.role !== "ADMIN") {
    return { error: "Only admins can create teachers." };
  }

  const parsed = teacherSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { name, email, password } = parsed.data;

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error) {
    if (/already/i.test(error.message)) {
      return { error: "A user with that email already exists." };
    }
    return { error: error.message };
  }

  try {
    await prisma.user.upsert({
      where: { email },
      update: { name, role: "TEACHER", supabaseUserId: data.user!.id },
      create: { email, name, role: "TEACHER", supabaseUserId: data.user!.id },
    });
  } catch {
    return { error: "Could not save the platform profile. A user with that email may already exist." };
  }

  return { success: `Teacher "${name}" created.` };
}