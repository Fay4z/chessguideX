import { describe, expect, it } from "vitest";
import { LEVELS, LEVEL_TIERS, levelFor, levelInfo } from "./level";

describe("level ladder", () => {
  it("defines the six chess-piece levels in order", () => {
    expect(LEVELS).toEqual([
      "Pawn",
      "Knight",
      "Bishop",
      "Rook",
      "Queen",
      "King",
    ]);
  });

  it("defines tiers as data starting at Pawn with the agreed thresholds", () => {
    expect(LEVEL_TIERS).toEqual([
      { name: "Pawn", minXp: 0 },
      { name: "Knight", minXp: 300 },
      { name: "Bishop", minXp: 600 },
      { name: "Rook", minXp: 1000 },
      { name: "Queen", minXp: 1500 },
      { name: "King", minXp: 2200 },
    ]);
  });
});

describe("levelFor", () => {
  it("stays Pawn below the first threshold", () => {
    expect(levelFor(0)).toBe("Pawn");
    expect(levelFor(299)).toBe("Pawn");
    expect(levelFor(-5)).toBe("Pawn");
  });

  it("promotes at and demotes just below every threshold", () => {
    expect(levelFor(300)).toBe("Knight");
    expect(levelFor(599)).toBe("Knight");
    expect(levelFor(600)).toBe("Bishop");
    expect(levelFor(999)).toBe("Bishop");
    expect(levelFor(1000)).toBe("Rook");
    expect(levelFor(1499)).toBe("Rook");
    expect(levelFor(1500)).toBe("Queen");
    expect(levelFor(2199)).toBe("Queen");
    expect(levelFor(2200)).toBe("King");
  });

  it("caps at King at the top", () => {
    expect(levelFor(99999)).toBe("King");
  });
});

describe("levelInfo", () => {
  it("reports the current level and the XP left to the next one", () => {
    expect(levelInfo(0)).toEqual({ level: "Pawn", xp: 0, next: "Knight", xpToNext: 300 });
    expect(levelInfo(210)).toEqual({ level: "Pawn", xp: 210, next: "Knight", xpToNext: 90 });
    expect(levelInfo(300)).toEqual({ level: "Knight", xp: 300, next: "Bishop", xpToNext: 300 });
    expect(levelInfo(1500)).toEqual({ level: "Queen", xp: 1500, next: "King", xpToNext: 700 });
  });

  it("has no next level at the top of the ladder", () => {
    expect(levelInfo(2200).next).toBeNull();
    expect(levelInfo(2200).xpToNext).toBeNull();
    expect(levelInfo(5000).next).toBeNull();
  });

  it("never reports a level below Pawn", () => {
    expect(levelInfo(-5).level).toBe("Pawn");
  });
});