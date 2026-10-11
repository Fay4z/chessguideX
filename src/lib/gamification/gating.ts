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