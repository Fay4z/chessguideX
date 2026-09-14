"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser, ensureProfile } from "@/lib/auth";
import { prisma } from "@/lib/db";

// ─── Enroll ─────────────────────────────────────────────────────────────────

export type EnrollState = { ok: boolean; message?: string };

export async function enrollInCourse(
  _prevState: EnrollState,
  formData: FormData,
): Promise<EnrollState> {
  const courseId = String(formData.get("courseId") ?? "");
  if (!courseId) return { ok: false, message: "Missing course id." };

  const user = await getAuthUser();
  if (!user) return { ok: false, message: "Sign in to enroll." };
  const profile = await ensureProfile(user);

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return { ok: false, message: "Course not found." };

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: profile.id, courseId } },
    update: {},
    create: { userId: profile.id, courseId },
  });

  revalidatePath(`/courses/${course.slug}`);
  revalidatePath("/dashboard");
  return { ok: true, message: "You are now enrolled. Happy learning!" };
}

// ─── Quiz submission ─────────────────────────────────────────────────────────

export type SubmitQuizQuestionResult = {
  questionId: string;
  prompt: string;
  yourAnswer: string;
  correctAnswer: string;
  correctOptionId: string;
  correct: boolean;
  explanation?: string;
};

export type SubmitQuizResult =
  | {
      ok: true;
      score: number;
      minScore: number;
      passed: boolean;
      results: SubmitQuizQuestionResult[];
    }
  | { ok: false; error: string };

type QuizOption = { id: string; text: string };

export async function submitQuiz(
  lessonId: string,
  answers: Record<string, string>,
): Promise<SubmitQuizResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: "Sign in to submit the quiz." };
  const profile = await ensureProfile(user);

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: { select: { slug: true } },
      quiz: {
        include: {
          questions: { orderBy: { position: "asc" } },
        },
      },
    },
  });
  if (!lesson?.quiz) return { ok: false, error: "This lesson has no quiz." };

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId: profile.id, courseId: lesson.courseId },
    },
  });
  if (!enrollment) {
    return {
      ok: false,
      error: "Enroll in this course before taking the quiz.",
    };
  }

  const questions = lesson.quiz.questions;

  let correct = 0;
  const results: SubmitQuizQuestionResult[] = questions.map((q) => {
    const options = (q.options as QuizOption[] | null) ?? [];
    const rightId = q.correctAnswer as string;
    const userOptionId = answers[q.id] ?? "";
    const isCorrect = typeof rightId === "string" && userOptionId === rightId;
    if (isCorrect) correct++;

    return {
      questionId: q.id,
      prompt: q.prompt,
      yourAnswer:
        options.find((o) => o.id === userOptionId)?.text ??
        (userOptionId ? userOptionId : "(no answer)"),
      correctAnswer:
        options.find((o) => o.id === rightId)?.text ?? String(rightId),
      correctOptionId: String(rightId),
      correct: isCorrect,
      explanation: q.explanation ?? undefined,
    };
  });

  const minScore = lesson.quiz.minScore;
  const score =
    questions.length === 0 ? 0 : Math.round((correct / questions.length) * 100);
  const passed = score >= minScore;

  const existing = await prisma.lessonProgress.findUnique({
    where: {
      userId_lessonId: { userId: profile.id, lessonId: lesson.id },
    },
  });

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: profile.id, lessonId: lesson.id } },
    update: {
      score,
      passed: passed || existing?.passed === true,
      completedAt:
        !existing?.completedAt && passed ? new Date() : undefined,
    },
    create: {
      userId: profile.id,
      lessonId: lesson.id,
      score,
      passed,
      completedAt: passed ? new Date() : null,
    },
  });

  revalidatePath(`/courses/${lesson.course.slug}`);
  revalidatePath(`/courses/${lesson.course.slug}/lessons/${lesson.slug}`);
  revalidatePath("/dashboard");

  return { ok: true, score, minScore, passed, results };
}