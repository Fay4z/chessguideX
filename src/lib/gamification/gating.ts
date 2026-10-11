export interface LessonGateInput {
  courseUnlocked: boolean;
  firstLesson: boolean;
  previousLessonPassed: boolean;
}

export function canStartLesson({
  courseUnlocked,
  firstLesson,
  previousLessonPassed,
}: LessonGateInput): boolean {
  if (!courseUnlocked) return false;
  if (firstLesson) return true;
  return previousLessonPassed;
}

export interface CourseGateInput {
  hasPriorCourse: boolean;
  priorCourseCompleted: boolean;
}

export function canStartCourse({
  hasPriorCourse,
  priorCourseCompleted,
}: CourseGateInput): boolean {
  if (!hasPriorCourse) return true;
  return priorCourseCompleted;
}

/** Per-lesson unlocked flags for an ordered lesson list. */
export function unlockedLessons(
  courseUnlocked: boolean,
  passed: boolean[],
): boolean[] {
  return passed.map((_, i) =>
    canStartLesson({
      courseUnlocked,
      firstLesson: i === 0,
      previousLessonPassed: i > 0 ? passed[i - 1] : false,
    }),
  );
}

/** Per-course unlocked flags for the ordered curriculum path. */
export function unlockedCourses(completed: boolean[]): boolean[] {
  return completed.map((_, i) =>
    canStartCourse({
      hasPriorCourse: i > 0,
      priorCourseCompleted: i > 0 ? completed[i - 1] : false,
    }),
  );
}