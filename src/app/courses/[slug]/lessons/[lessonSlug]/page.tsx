import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthUser, ensureProfile } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseContentBlocks } from "@/lib/content";
import { MarkdownBlock } from "@/components/lesson/MarkdownBlock";
import { BoardDemo } from "@/components/lesson/BoardDemo";
import {
  QuizBlock,
  type QuizQuestionView,
} from "@/components/lesson/QuizBlock";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await prisma.course.findUnique({
    where: { slug },
    select: { title: true },
  });
  return {
    title: course ? `${course.title} — ChessGuideX` : "Lesson — ChessGuideX",
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  const { slug: courseSlug, lessonSlug } = await params;

  const course = await prisma.course.findUnique({ where: { slug: courseSlug } });
  if (!course) notFound();

  const lesson = await prisma.lesson.findUnique({
    where: { courseId_slug: { courseId: course.id, slug: lessonSlug } },
    include: {
      quiz: {
        include: { questions: { orderBy: { position: "asc" } } },
      },
    },
  });
  if (!lesson || !lesson.published) notFound();

  const authUser = await getAuthUser();
  const profile = authUser ? await ensureProfile(authUser) : null;

  let progress = null;
  let enrolled = false;
  if (profile) {
    enrolled = Boolean(
      await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: profile.id, courseId: course.id } },
      }),
    );
    progress = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: profile.id, lessonId: lesson.id } },
    });
  }

  const blocks = parseContentBlocks(lesson.content);

  const lessonList = await prisma.lesson.findMany({
    where: { courseId: course.id, published: true },
    orderBy: { order: "asc" },
    select: { id: true, slug: true, title: true },
  });
  const lessonIndex = lessonList.findIndex((l) => l.id === lesson.id);
  const prevLesson =
    lessonIndex > 0 ? lessonList[lessonIndex - 1] : undefined;
  const nextLesson =
    lessonIndex < lessonList.length - 1
      ? lessonList[lessonIndex + 1]
      : undefined;

  const quizView: QuizQuestionView[] | null = lesson.quiz
    ? lesson.quiz.questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        options: (q.options as { id: string; text: string }[] | null) ?? [],
      }))
    : null;

  const completed = Boolean(progress?.completedAt);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/courses/${course.slug}`}
          className="text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← {course.title}
        </Link>
        {completed && (
          <span className="rounded-full border border-emerald-300 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-600 dark:border-emerald-700 dark:text-emerald-400">
            Completed
          </span>
        )}
      </div>

      <header className="mt-6">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Lesson {lessonIndex + 1} of {lessonList.length}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {lesson.title}
        </h1>
      </header>

      {!enrolled && (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          You can read this lesson, but you must{" "}
          <Link
            href={`/courses/${course.slug}`}
            className="font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            enroll in the course
          </Link>{" "}
          to unlock the quiz and completion tracking.
        </div>
      )}
      {enrolled && !completed && progress?.score != null && (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Best score so far: {progress.score}% — pass the quiz to complete this
          lesson.
        </div>
      )}

      <div className="mt-8 max-w-3xl">
        {blocks.map((block, i) =>
          block.type === "text" ? (
            <MarkdownBlock key={i} markdown={block.markdown} />
          ) : (
            <BoardDemo
              key={i}
              fen={block.fen}
              moves={block.moves ?? undefined}
            />
          ),
        )}
      </div>

      {quizView && (
        <QuizBlock
          lessonId={lesson.id}
          quizTitle={lesson.quiz?.title ?? "Quiz"}
          questions={quizView}
          alreadyPassed={completed}
        />
      )}

      <nav className="mt-12 flex items-center justify-between gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        {prevLesson ? (
          <Link
            href={`/courses/${course.slug}/lessons/${prevLesson.slug}`}
            className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← {prevLesson.title}
          </Link>
        ) : (
          <span />
        )}
        {nextLesson ? (
          <Link
            href={`/courses/${course.slug}/lessons/${nextLesson.slug}`}
            className="text-right text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {nextLesson.title} →
          </Link>
        ) : (
          <Link
            href={`/courses/${course.slug}`}
            className="text-right text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Finish course →
          </Link>
        )}
      </nav>
    </div>
  );
}