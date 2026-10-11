import { describe, expect, it } from "vitest";
import { nextDailyStreak, nextPuzzleStreak } from "./streaks";

describe("nextDailyStreak", () => {
  it("grows by one on a consecutive day", () => {
    expect(nextDailyStreak(3, "2026-10-10", "2026-10-11")).toBe(4);
  });

  it("starts a streak at one on the first day", () => {
    expect(nextDailyStreak(0, null, "2026-10-11")).toBe(1);
  });

  it("restarts at one after a full missed day", () => {
    expect(nextDailyStreak(5, "2026-10-09", "2026-10-11")).toBe(1);
  });

  it("leaves the streak unchanged when today is already counted", () => {
    expect(nextDailyStreak(7, "2026-10-11", "2026-10-11")).toBe(7);
  });

  it("treats a month boundary as consecutive", () => {
    expect(nextDailyStreak(6, "2026-09-30", "2026-10-01")).toBe(7);
  });

  it("treats a year boundary as consecutive", () => {
    expect(nextDailyStreak(6, "2026-12-31", "2027-01-01")).toBe(7);
  });
});

describe("nextPuzzleStreak", () => {
  it("increments on a correct solve", () => {
    expect(nextPuzzleStreak(5, true)).toBe(6);
    expect(nextPuzzleStreak(0, true)).toBe(1);
  });

  it("resets to zero on a wrong answer", () => {
    expect(nextPuzzleStreak(5, false)).toBe(0);
  });
});