import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthUser, ensureProfile } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCourseGate, getLessonGates } from "@/lib/gamification/gates";
import { submitQuiz } from "@/lib/content/actions";
import {
  parseContentBlocks,
  type ContentBlock,
} from "@/lib/content";
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
  if (profile) {
    progress = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: profile.id, lessonId: lesson.id } },
    });
  }

  const [courseGate, gates] = await Promise.all([
    getCourseGate(profile?.id ?? null, course.id),
    getLessonGates(profile?.id ?? null, course.id),
  ]);
  const lessonIndex = gates.findIndex((g) => g.id === lesson.id);
  const locked = lessonIndex < 0 || !gates[lessonIndex].unlocked;
  const prevLesson = lessonIndex > 0 ? gates[lessonIndex - 1] : undefined;
  const nextLesson =
    lessonIndex < gates.length - 1 ? gates[lessonIndex + 1] : undefined;

  const blocks = parseContentBlocks(lesson.content);

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
          Lesson {lessonIndex + 1} of {gates.length}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {lesson.title}
        </h1>
      </header>

      {locked ? (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <svg
            className="mx-auto h-8 w-8 text-zinc-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          <h2 className="mt-3 text-lg font-semibold">This lesson is locked</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            {courseGate.unlocked && prevLesson
              ? `Complete "${prevLesson.title}" to unlock this lesson.`
              : "Complete the previous course to unlock this lesson."}
          </p>
          <Link
            href={`/courses/${course.slug}`}
            className="mt-5 inline-block rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Back to course
          </Link>
        </div>
      ) : (
        <>
          {!completed && progress?.score != null && (
            <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              Best score so far: {progress.score}% — pass the quiz to complete
              this lesson.
            </div>
          )}

          <div className="mt-8 max-w-3xl">
            {sectionsFrom(blocks).map((section, i) =>
              section.kind === "text" ? (
                <MarkdownBlock key={i} markdown={section.markdown} />
              ) : (
                <BoardDemo key={i} fen={section.fen} moves={section.moves}>
                  {section.texts.length > 0 && (
                    <div className="space-y-0">
                      {section.texts.map((markdown, j) => (
                        <MarkdownBlock key={j} markdown={markdown} />
                      ))}
                    </div>
                  )}
                </BoardDemo>
              ),
            )}
          </div>

          {quizView && (
            <QuizBlock
              quizTitle={lesson.quiz?.title ?? "Quiz"}
              questions={quizView}
              alreadyPassed={completed}
              submit={(answers) => submitQuiz(lesson.id, answers)}
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
              nextLesson.unlocked ? (
                <Link
                  href={`/courses/${course.slug}/lessons/${nextLesson.slug}`}
                  className="text-right text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {nextLesson.title} →
                </Link>
              ) : (
                <span className="text-right text-sm font-medium text-zinc-500">
                  Next lesson locked
                </span>
              )
            ) : (
              <Link
                href={`/courses/${course.slug}`}
                className="text-right text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Finish course →
              </Link>
            )}
          </nav>
        </>
      )}
    </div>
  );
}

type DemoSection = {
  kind: "demo";
  texts: string[];
  fen: string;
  moves: string[] | undefined;
};
type TextSection = { kind: "text"; markdown: string };
type Section = DemoSection | TextSection;

function sectionsFrom(blocks: ContentBlock[]): Section[] {
  const sections: Section[] = [];
  let pending: string[] = [];
  for (const block of blocks) {
    if (block.type === "text") {
      pending.push(block.markdown);
      continue;
    }
    sections.push({
      kind: "demo",
      texts: pending,
      fen: block.fen,
      moves: block.moves ?? undefined,
    });
    pending = [];
  }
  if (pending.length > 0) {
    sections.push({ kind: "text", markdown: pending.join("\n\n") });
  }
  return sections;
}