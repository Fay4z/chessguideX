import { describe, expect, it } from "vitest";
import { canStartCourse, canStartLesson } from "./gating";

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