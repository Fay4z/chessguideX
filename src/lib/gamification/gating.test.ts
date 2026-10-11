import { describe, expect, it } from "vitest";
import { canStartCourse, canStartLesson, nextLessonIndex, unlockedCourses, unlockedLessons } from "./gating";

describe("canStartLesson", () => {
  it("keeps a locked course closed even for its first lesson", () => {
    expect(
      canStartLesson({ courseUnlocked: false, firstLesson: true, previousLessonPassed: true }),
    ).toBe(false);
    expect(
      canStartLesson({ courseUnlocked: false, firstLesson: false, previousLessonPassed: true }),
    ).toBe(false);
  });

  it("opens the first lesson of an unlocked course", () => {
    expect(
      canStartLesson({ courseUnlocked: true, firstLesson: true, previousLessonPassed: false }),
    ).toBe(true);
  });

  it("locks a lesson whose previous lesson is not passed", () => {
    expect(
      canStartLesson({ courseUnlocked: true, firstLesson: false, previousLessonPassed: false }),
    ).toBe(false);
  });

  it("unlocks a lesson once the previous lesson is passed", () => {
    expect(
      canStartLesson({ courseUnlocked: true, firstLesson: false, previousLessonPassed: true }),
    ).toBe(true);
  });
});

describe("canStartCourse", () => {
  it("always opens the first course on the path", () => {
    expect(canStartCourse({ hasPriorCourse: false, priorCourseCompleted: false })).toBe(true);
  });

  it("stays locked while the prior course is incomplete", () => {
    expect(canStartCourse({ hasPriorCourse: true, priorCourseCompleted: false })).toBe(false);
  });

  it("unlocks once the prior course is completed", () => {
    expect(canStartCourse({ hasPriorCourse: true, priorCourseCompleted: true })).toBe(true);
  });
});

describe("unlockedLessons", () => {
  it("locks every lesson in a locked course", () => {
    expect(unlockedLessons(false, [false, false, false])).toEqual([false, false, false]);
    expect(unlockedLessons(false, [true, true, true])).toEqual([false, false, false]);
  });

  it("opens only the first lesson by default", () => {
    expect(unlockedLessons(true, [false, false, false])).toEqual([true, false, false]);
  });

  it("unlocks each next lesson when the previous one is passed", () => {
    expect(unlockedLessons(true, [true, false, false])).toEqual([true, true, false]);
    expect(unlockedLessons(true, [true, true, false])).toEqual([true, true, true]);
    expect(unlockedLessons(true, [true, true, true])).toEqual([true, true, true]);
  });
});

describe("unlockedCourses", () => {
  it("keeps only the path head open while nothing is completed", () => {
    expect(unlockedCourses([false, false, false])).toEqual([true, false, false]);
  });

  it("advances the open frontier as courses complete", () => {
    expect(unlockedCourses([true, false, false])).toEqual([true, true, false]);
    expect(unlockedCourses([true, true, false])).toEqual([true, true, true]);
  });

  it("lets each course depend only on its immediate predecessor", () => {
    expect(unlockedCourses([true, false, true])).toEqual([true, true, false]);
  });
});

describe("nextLessonIndex", () => {
  it("points at the first lesson by default", () => {
    expect(nextLessonIndex([true, false, false], [false, false, false])).toBe(0);
  });

  it("moves forward as lessons are passed", () => {
    expect(nextLessonIndex([true, true, true], [true, false, false])).toBe(1);
    expect(nextLessonIndex([true, true, true], [true, true, false])).toBe(2);
  });

  it("returns -1 when nothing is left to work on", () => {
    expect(nextLessonIndex([true, true, true], [true, true, true])).toBe(-1);
    expect(nextLessonIndex([true, false, false], [true, false, false])).toBe(-1);
  });
});