import { describe, expect, it } from "vitest";
import { inferLastMove } from "./last-move";

describe("inferLastMove", () => {
  it("finds the king step that walked into the back-rank mate", () => {
    expect(
      inferLastMove("6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1"),
    ).toBe("f8g8");
  });

  it("finds the king step into the corner", () => {
    expect(inferLastMove("7k/6pp/8/8/8/8/5QPP/6K1 w - - 0 1")).toBe(
      "g8h8",
    );
  });

  it("finds the queen step in front of the pawn", () => {
    expect(inferLastMove("4k3/8/8/3q4/4P3/8/8/4K3 w - - 0 1")).toBe(
      "c5d5",
    );
  });

  it("returns null for an invalid FEN", () => {
    expect(inferLastMove("not-a-fen")).toBeNull();
  });
});
