import { describe, expect, it } from "vitest";
import {
  applyAward,
  awardFor,
  awardKey,
  REWARD_TABLE,
  type AwardEvent,
  type AwardLedgerState,
} from "./awards";

function emptyState(): AwardLedgerState {
  return { awardedKeys: new Set() };
}

function stateWith(keys: string[]): AwardLedgerState {
  return { awardedKeys: new Set(keys) };
}

const example: Record<AwardEvent["kind"], AwardEvent> = {
  lesson_complete: { kind: "lesson_complete", refId: "lesson-l1" },
  quiz_pass: { kind: "quiz_pass", refId: "lesson-l1" },
  course_test_pass: { kind: "course_test_pass", refId: "course-beginner" },
  puzzle_solved: { kind: "puzzle_solved", refId: "puzzle-p1" },
  puzzle_streak_bonus: { kind: "puzzle_streak_bonus", refId: "puzzle-p1" },
  daily_login: { kind: "daily_login", refId: "2026-10-11" },
};

describe("awardFor", () => {
  it("returns the reward table value for every event kind", () => {
    expect(REWARD_TABLE).toEqual({
      lesson_complete: 50,
      quiz_pass: 100,
      course_test_pass: 150,
      puzzle_solved: 10,
      puzzle_streak_bonus: 5,
      daily_login: 20,
    });
    for (const [kind, points] of Object.entries(REWARD_TABLE)) {
      expect(awardFor(example[kind as AwardEvent["kind"]])).toBe(points);
    }
  });
});

describe("applyAward", () => {
  it("awards a quiz pass the first time", () => {
    const result = applyAward(emptyState(), example.quiz_pass);
    expect(result).toEqual({
      points: 100,
      awarded: true,
      key: "quiz_pass:lesson-l1",
    });
  });

  it("awards zero for a quiz pass on a lesson already passed", () => {
    const result = applyAward(
      stateWith([awardKey(example.quiz_pass)]),
      example.quiz_pass,
    );
    expect(result).toEqual({
      points: 0,
      awarded: false,
      key: "quiz_pass:lesson-l1",
    });
  });

  it("awards a lesson completion only once", () => {
    const first = applyAward(emptyState(), example.lesson_complete);
    const second = applyAward(
      stateWith([first.key]),
      example.lesson_complete,
    );
    expect(first).toMatchObject({ points: 50, awarded: true });
    expect(second).toMatchObject({ points: 0, awarded: false });
  });

  it("awards the course test only once", () => {
    const first = applyAward(emptyState(), example.course_test_pass);
    const second = applyAward(
      stateWith([first.key]),
      example.course_test_pass,
    );
    expect(first).toMatchObject({ points: 150, awarded: true });
    expect(second).toMatchObject({ points: 0, awarded: false });
  });

  it("awards the daily login only once per day", () => {
    const first = applyAward(emptyState(), example.daily_login);
    const second = applyAward(stateWith([first.key]), example.daily_login);
    expect(first).toMatchObject({ points: 20, awarded: true });
    expect(second).toMatchObject({ points: 0, awarded: false });
  });

  it("awards a puzzle solve every time, even for the same puzzle", () => {
    const iterations = 3;
    let state = emptyState();
    for (let i = 0; i < iterations; i++) {
      const result = applyAward(state, example.puzzle_solved);
      expect(result).toMatchObject({ points: 10, awarded: true });
      state = stateWith([...state.awardedKeys, result.key]);
    }
  });

  it("awards the puzzle streak bonus every time it extends a streak", () => {
    const first = applyAward(emptyState(), example.puzzle_streak_bonus);
    const second = applyAward(
      stateWith([first.key]),
      example.puzzle_streak_bonus,
    );
    expect(first).toMatchObject({ points: 5, awarded: true });
    expect(second).toMatchObject({ points: 5, awarded: true });
  });

  it("treats a different refId as a fresh once-only award", () => {
    const first = applyAward(emptyState(), example.quiz_pass);
    const otherLesson = applyAward(
      stateWith([first.key]),
      { kind: "quiz_pass", refId: "lesson-l2" },
    );
    expect(otherLesson).toMatchObject({ points: 100, awarded: true });
  });
});