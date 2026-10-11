import { prisma } from "@/lib/db";
import { unlockedCourses, unlockedLessons } from "./gating";

export interface CourseGate {
  unlocked: boolean;
  previousTitle?: string;
}

export interface LessonGateRow {
  id: string;
  slug: string;
  title: string;
  unlocked: boolean;
  passed: boolean;
}

/** Ordered published curriculum path. */
async function pathCourses() {
  return prisma.course.findMany({
    where: { published: true },
    orderBy: [{ level: "asc" }, { order: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      level: true,
      description: true,
      quizId: true,
    },
  });
}

/** A course counts as completed once its certificate exists (issued at ≥90% test pass). */
async function courseCompletedFlags(
  userId: string | null,
  courseIds: string[],
): Promise<boolean[]> {
  if (userId === null || courseIds.length === 0) {
    return courseIds.map(() => false);
  }
  const issued = await prisma.certificate.findMany({
    where: { userId, courseId: { in: courseIds } },
    select: { courseId: true },
  });
  const done = new Set(issued.map((c) => c.courseId));
  return courseIds.map((id) => done.has(id));
}

export async function getCourseGate(
  userId: string | null,
  courseId: string,
): Promise<CourseGate> {
  const path = await pathCourses();
  const index = path.findIndex((c) => c.id === courseId);
  if (index < 0) return { unlocked: false };
  const completed = await courseCompletedFlags(
    userId,
    path.map((c) => c.id),
  );
  const unlocked = unlockedCourses(completed)[index];
  if (unlocked) return { unlocked };
  const previous = index > 0 ? path[index - 1] : undefined;
  return { unlocked: false, previousTitle: previous?.title };
}

/**
 * Per-lesson gates for an ordered course, letting course lock flow through:
 * a locked course locks every lesson regardless of progress.
 */
export async function getLessonGates(
  userId: string | null,
  courseId: string,
): Promise<LessonGateRow[]> {
  const lessons = await prisma.lesson.findMany({
    where: { courseId, published: true },
    orderBy: { order: "asc" },
    select: { id: true, slug: true, title: true },
  });
  const progress =
    userId === null
      ? []
      : await prisma.lessonProgress.findMany({
          where: {
            userId,
            lessonId: { in: lessons.map((l) => l.id) },
            completedAt: { not: null },
          },
          select: { lessonId: true },
        });
  const passed = new Set(progress.map((p) => p.lessonId));
  const courseUnlocked = (await getCourseGate(userId, courseId)).unlocked;
  const flags = unlockedLessons(
    courseUnlocked,
    lessons.map((l) => passed.has(l.id)),
  );
  return lessons.map((l, i) => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    unlocked: flags[i],
    passed: passed.has(l.id),
  }));
}

export interface PathCourse {
  id: string;
  slug: string;
  title: string;
  level: string;
  description: string | null;
  lessonCount: number;
  hasTest: boolean;
  unlocked: boolean;
  completed: boolean;
}

/** The full curriculum path with per-course gate state. */
export async function getPathState(
  userId: string | null,
): Promise<PathCourse[]> {
  const path = await pathCourses();
  const completed = await courseCompletedFlags(
    userId,
    path.map((c) => c.id),
  );
  const unlocked = unlockedCourses(completed);

  const counts = await prisma.lesson.groupBy({
    by: ["courseId"],
    where: { courseId: { in: path.map((c) => c.id) }, published: true },
    _count: { _all: true },
  });
  const countByCourse = new Map(counts.map((c) => [c.courseId, c._count._all]));

  return path.map((c, i) => ({
    ...c,
    lessonCount: countByCourse.get(c.id) ?? 0,
    hasTest: c.quizId != null,
    unlocked: unlocked[i],
    completed: completed[i],
  }));
}

export async function isLessonUnlocked(
  userId: string | null,
  lessonId: string,
): Promise<boolean> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { courseId: true },
  });
  if (!lesson) return false;
  const gates = await getLessonGates(userId, lesson.courseId);
  return gates.find((g) => g.id === lessonId)?.unlocked ?? false;
}