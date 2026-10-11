"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { getAuthUser, ensureProfile } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { awardAndPersist, type AwardRecordResult } from "@/lib/gamification/record";
import { getCourseGate, isLessonUnlocked } from "@/lib/gamification/gates";
import type { Prisma } from "@/generated/prisma/client";

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
      reward: AwardRecordResult | null;
      certificate?: { code: string };
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

  const unlocked = await isLessonUnlocked(profile.id, lesson.id);
  if (!unlocked) {
    return {
      ok: false,
      error: "This lesson is locked. Complete the previous lesson first.",
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

  const bestScore = Math.max(existing?.score ?? 0, score);

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: profile.id, lessonId: lesson.id } },
    update: {
      score: bestScore,
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

  let reward: AwardRecordResult | null = null;
  if (passed) {
    reward = await awardAndPersist(profile.id, [
      { kind: "lesson_complete", refId: lesson.id },
      { kind: "quiz_pass", refId: lesson.id },
    ]);
  }

  revalidatePath(`/courses/${lesson.course.slug}`);
  revalidatePath(`/courses/${lesson.course.slug}/lessons/${lesson.slug}`);
  revalidatePath("/dashboard");

  return { ok: true, score, minScore, passed, results, reward };
}

// ─── Course test ─────────────────────────────────────────────────────────────

async function gradeQuiz(
  quiz: Prisma.QuizGetPayload<{
    include: { questions: { orderBy: { position: "asc" } } };
  }>,
  answers: Record<string, string>,
) {
  let correct = 0;
  const results: SubmitQuizQuestionResult[] = quiz.questions.map((q) => {
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
  const minScore = quiz.minScore;
  const score =
    quiz.questions.length === 0
      ? 0
      : Math.round((correct / quiz.questions.length) * 100);
  return { results, minScore, score, passed: score >= minScore };
}

export async function submitCourseTest(
  courseId: string,
  answers: Record<string, string>,
): Promise<SubmitQuizResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: "Sign in to take the test." };
  const profile = await ensureProfile(user);

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      quiz: { include: { questions: { orderBy: { position: "asc" } } } },
      lessons: {
        where: { published: true },
        select: { id: true },
      },
    },
  });
  if (!course?.quiz) return { ok: false, error: "This course has no test." };

  const [courseUnlocked, lessonsDone] = await Promise.all([
    getCourseGate(profile.id, course.id),
    prisma.lessonProgress.count({
      where: {
        userId: profile.id,
        lessonId: { in: course.lessons.map((l) => l.id) },
        completedAt: { not: null },
      },
    }),
  ]);
  if (!courseUnlocked.unlocked) {
    return {
      ok: false,
      error: "This course is locked. Complete the previous course first.",
    };
  }
  if (lessonsDone < course.lessons.length) {
    return {
      ok: false,
      error: "Finish every lesson before taking the course test.",
    };
  }

  const grade = await gradeQuiz(course.quiz, answers);

  const existing = await prisma.courseTestAttempt.findUnique({
    where: { userId_courseId: { userId: profile.id, courseId: course.id } },
  });
  const bestScore = Math.max(existing?.score ?? 0, grade.score);

  await prisma.courseTestAttempt.upsert({
    where: { userId_courseId: { userId: profile.id, courseId: course.id } },
    update: {
      score: bestScore,
      passed: grade.passed || existing?.passed === true,
      completedAt:
        !existing?.completedAt && grade.passed ? new Date() : undefined,
    },
    create: {
      userId: profile.id,
      courseId: course.id,
      score: grade.score,
      passed: grade.passed,
      completedAt: grade.passed ? new Date() : null,
    },
  });

  let reward: AwardRecordResult | null = null;
  let certificate: { code: string } | undefined;
  if (grade.passed) {
    reward = await awardAndPersist(profile.id, [
      { kind: "course_test_pass", refId: course.id },
    ]);
    const code = randomBytes(9).toString("hex");
    try {
      await prisma.certificate.create({
        data: {
          userId: profile.id,
          courseId: course.id,
          verificationCode: code,
        },
      });
      certificate = { code };
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }

  revalidatePath(`/courses/${course.slug}`);
  revalidatePath("/courses");
  revalidatePath("/dashboard");

  return {
    ok: true,
    score: grade.score,
    minScore: grade.minScore,
    passed: grade.passed,
    results: grade.results,
    reward,
    certificate,
  };
}