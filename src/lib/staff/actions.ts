"use server";

import { z } from "zod";
import { refresh } from "next/cache";
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

  refresh();
  return { success: `Teacher "${name}" created.` };
}

// ─── Shared helpers ─────────────────────────────────────────────────────────

async function requireStaff() {
  const authUser = await getAuthUser();
  if (!authUser) return null;
  const profile = await ensureProfile(authUser);
  if (profile.role !== "TEACHER" && profile.role !== "ADMIN") return null;
  return profile;
}

async function findAuthUserByEmail(email: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) return null;
  return data.users.find((u) => u.email?.toLowerCase() === email) ?? null;
}

// ─── Classes ────────────────────────────────────────────────────────────────

const classSchema = z.object({
  name: z.string().trim().min(1, "Class name is required.").max(60, "Class name is too long."),
});

export async function createClass(
  _prevState: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const staff = await requireStaff();
  if (!staff) return { error: "Only teachers or admins can create classes." };

  const parsed = classSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await prisma.class.create({
    data: { name: parsed.data.name, teacherId: staff.id },
  });

  refresh();
  return { success: `Class "${parsed.data.name}" created.` };
}

// ─── Students ───────────────────────────────────────────────────────────────

const studentSchema = z.object({
  name: z.string().trim().min(1, "Student name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

const studentPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

export async function createStudent(
  classId: string,
  _prevState: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const staff = await requireStaff();
  if (!staff) return { error: "You must be a teacher or admin." };

  const klass = await prisma.class.findUnique({ where: { id: classId } });
  if (!klass) return { error: "Class not found." };
  if (staff.role === "TEACHER" && klass.teacherId !== staff.id) {
    return { error: "You do not own this class." };
  }

  const parsed = studentSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { name, email, password } = parsed.data;

  const supabase = createAdminClient();
  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  let authUserId = created?.user?.id ?? null;
  if (error) {
    if (!/already/i.test(error.message)) {
      return { error: error.message };
    }
    const existingAuth = await findAuthUserByEmail(email);
    if (!existingAuth) {
      return { error: `Could not reuse ${email}: ${error.message}` };
    }
    authUserId = existingAuth.id;
  }
  if (!authUserId) return { error: "Could not resolve the student account." };

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, role: "STUDENT", supabaseUserId: authUserId },
    create: { email, name, role: "STUDENT", supabaseUserId: authUserId },
  });

  try {
    await prisma.classMember.create({ data: { classId, userId: user.id } });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return { error: "This student is already in the class." };
    }
    return { error: "Could not add the student to the class." };
  }

  refresh();
  return { success: `Student "${name}" added.` };
}

// ─── Password reset ─────────────────────────────────────────────────────────

export async function resetStudentPassword(
  classId: string,
  userId: string,
  _prevState: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const staff = await requireStaff();
  if (!staff) return { error: "You must be a teacher or admin." };

  const klass = await prisma.class.findUnique({ where: { id: classId } });
  if (!klass) return { error: "Class not found." };
  if (staff.role === "TEACHER" && klass.teacherId !== staff.id) {
    return { error: "You do not own this class." };
  }

  const member = await prisma.classMember.findUnique({
    where: { classId_userId: { classId, userId } },
    include: { user: true },
  });
  if (!member) return { error: "That student is not in this class." };

  const parsed = studentPasswordSchema.safeParse({
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabaseUserId = member.user.supabaseUserId;
  if (!supabaseUserId) {
    return { error: "That student has no linked login account yet." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(supabaseUserId, {
    password: parsed.data.password,
  });
  if (error) return { error: error.message };

  return {
    success: `Password updated for ${member.user.name ?? member.user.email}.`,
  };
}