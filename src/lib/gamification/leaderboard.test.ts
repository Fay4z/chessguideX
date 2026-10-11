import { describe, expect, it } from "vitest";
import { rankByPoints } from "./leaderboard";

function row(userId: string, name: string, points: number) {
  return { userId, name, points };
}

describe("rankByPoints", () => {
  it("ranks by points descending", () => {
    const ranked = rankByPoints([
      row("a", "Amy", 40),
      row("b", "Ben", 150),
      row("c", "Cara", 80),
    ]);
    expect(ranked.map((r) => r.userId)).toEqual(["b", "c", "a"]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("keeps zero-point classmates in the list behind everyone", () => {
    const ranked = rankByPoints([row("a", "Amy", 0), row("b", "Ben", 10)]);
    expect(ranked[1].userId).toBe("a");
    expect(ranked[1].points).toBe(0);
  });

  it("breaks ties deterministically by name", () => {
    const ranked = rankByPoints([
      row("a", "Amy", 50),
      row("b", "Ben", 50),
    ]);
    expect(ranked[0].userId).toBe("a");
    expect(ranked[1].userId).toBe("b");
  });

  it("does not mutate the input array", () => {
    const input = [row("a", "Amy", 40), row("b", "Ben", 150)];
    rankByPoints(input);
    expect(input[0].userId).toBe("a");
    expect(input[1].userId).toBe("b");
  });
});