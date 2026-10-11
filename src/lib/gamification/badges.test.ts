import { describe, expect, it } from "vitest";
import { badgeTrigger, BADGE_TRIGGERS, earnedBadgeIds, type BadgeId, type BadgeStats } from "./badges";

const zeroStats: BadgeStats = {
  lessonsCompleted: 0,
  quizzesPassed: 0,
  puzzlesSolved: 0,
  dailyStreak: 0,
  coursesCompleted: 0,
};

function stats(overrides: Partial<BadgeStats>): BadgeStats {
  return { ...zeroStats, ...overrides };
}

describe("BADGE_TRIGGERS", () => {
  it("declares all five starter badges against their stat", () => {
    expect(BADGE_TRIGGERS).toMatchObject([
      { badge: "first_move", stat: "lessonsCompleted", min: 1 },
      { badge: "quiz_whiz", stat: "quizzesPassed", min: 1 },
      { badge: "puzzle_prowess", stat: "puzzlesSolved", min: 25 },
      { badge: "streak_7", stat: "dailyStreak", min: 7 },
      { badge: "course_champion", stat: "coursesCompleted", min: 1 },
    ]);
  });
});

describe("badgeTrigger", () => {
  it("awards nothing for a brand-new student", () => {
    for (const { badge } of BADGE_TRIGGERS) {
      expect(badgeTrigger(badge as BadgeId, zeroStats)).toBe(false);
    }
  });

  it("awards First Move after the first completed lesson", () => {
    expect(badgeTrigger("first_move", stats({ lessonsCompleted: 0 }))).toBe(false);
    expect(badgeTrigger("first_move", stats({ lessonsCompleted: 1 }))).toBe(true);
  });

  it("awards Quiz Whiz after the first passed quiz", () => {
    expect(badgeTrigger("quiz_whiz", stats({ quizzesPassed: 0 }))).toBe(false);
    expect(badgeTrigger("quiz_whiz", stats({ quizzesPassed: 1 }))).toBe(true);
  });

  it("awards Puzzle Prowess only at 25 solved puzzles", () => {
    expect(badgeTrigger("puzzle_prowess", stats({ puzzlesSolved: 24 }))).toBe(false);
    expect(badgeTrigger("puzzle_prowess", stats({ puzzlesSolved: 25 }))).toBe(true);
    expect(badgeTrigger("puzzle_prowess", stats({ puzzlesSolved: 26 }))).toBe(true);
  });

  it("awards Streak 7 only at a 7-day daily streak", () => {
    expect(badgeTrigger("streak_7", stats({ dailyStreak: 6 }))).toBe(false);
    expect(badgeTrigger("streak_7", stats({ dailyStreak: 7 }))).toBe(true);
  });

  it("awards Course Champion on completing a course", () => {
    expect(badgeTrigger("course_champion", stats({ coursesCompleted: 0 }))).toBe(false);
    expect(badgeTrigger("course_champion", stats({ coursesCompleted: 1 }))).toBe(true);
  });
});

describe("earnedBadgeIds", () => {
  it("returns nothing for a brand-new student", () => {
    expect(earnedBadgeIds(zeroStats)).toEqual([]);
  });

  it("lists every badge whose threshold is met", () => {
    const all = earnedBadgeIds(
      stats({
        lessonsCompleted: 1,
        quizzesPassed: 1,
        puzzlesSolved: 25,
        dailyStreak: 7,
        coursesCompleted: 1,
      }),
    );
    expect(all).toContain("first_move");
    expect(all).toContain("quiz_whiz");
    expect(all).toContain("puzzle_prowess");
    expect(all).toContain("streak_7");
    expect(all).toContain("course_champion");
  });

  it("returns only the badges actually reached", () => {
    expect(
      earnedBadgeIds(stats({ lessonsCompleted: 1, quizzesPassed: 2 })),
    ).toEqual(["first_move", "quiz_whiz"]);
  });
});