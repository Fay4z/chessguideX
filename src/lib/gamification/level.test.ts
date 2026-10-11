import { describe, expect, it } from "vitest";
import { LEVELS } from "./level";

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
});