import { describe, expect, it } from "vitest";
import { normalizeLichessPuzzle } from "./normalize";

const FEN = "q3k1nr/1pp1nQpp/3p4/1P2p3/4P3/B1PP1b2/B5PP/5K2 b k - 0 17";

describe("normalizeLichessPuzzle", () => {
  it("applies the opponent move and peels it off the solution", () => {
    const parsed = normalizeLichessPuzzle(FEN, [
      "e8d7",
      "a2e6",
      "d7d8",
      "f7f8",
    ]);

    expect(parsed).not.toBeNull();
    expect(parsed?.lastMove).toBe("e8d7");
    expect(parsed?.fen).toBe(
      "q5nr/1ppknQpp/3p4/1P2p3/4P3/B1PP1b2/B5PP/5K2 w - - 1 18",
    );
    expect(parsed?.solutionMoves).toEqual(["a2e6", "d7d8", "f7f8"]);
  });

  it("rejects a line with no solver move", () => {
    expect(normalizeLichessPuzzle(FEN, ["e8d7"])).toBeNull();
  });

  it("rejects an illegal lead move", () => {
    expect(normalizeLichessPuzzle(FEN, ["a1a8", "a2e6"])).toBeNull();
  });
});
