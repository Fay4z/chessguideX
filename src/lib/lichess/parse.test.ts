import { describe, expect, it } from "vitest";
import {
  inRatingBand,
  isValidPuzzle,
  parseLichessLine,
} from "./parse";

const header =
  "PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags";

const singleLine =
  "abc123,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4 e7e5 e1g1,1500,60,72,2400,mate,short,https://lichess.org/training/abc123,trap";

const multiThemeLine =
  "def456,8/8/8/8/8/8/8/k2K4 w - - 0 1,c3c2,700,80,51,1200,endgame,crushing,https://lichess.org/training/def456,";

describe("parseLichessLine", () => {
  it("skips the header and empty lines", () => {
    expect(parseLichessLine(header)).toBeNull();
    expect(parseLichessLine("")).toBeNull();
    expect(parseLichessLine("   ")).toBeNull();
  });

  it("returns null for malformed lines", () => {
    expect(parseLichessLine("just,something")).toBeNull();
  });

  it("parses a normal row", () => {
    const p = parseLichessLine(singleLine);
    expect(p).not.toBeNull();
    expect(p?.lichessId).toBe("abc123");
    expect(p?.fen).toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    expect(p?.moves).toEqual(["e2e4", "e7e5", "e1g1"]);
    expect(p?.rating).toBe(1500);
    expect(p?.ratingDeviation).toBe(60);
    expect(p?.popularity).toBe(72);
    expect(p?.nbPlays).toBe(2400);
  });

  it("recoveries multi-value themes and opening tags past the unquoted comma", () => {
    const p = parseLichessLine(singleLine);
    expect(p?.themes).toEqual(["mate", "short"]);
    expect(p?.openingTags).toEqual(["trap"]);
    expect(p?.gameUrl).toBe("https://lichess.org/training/abc123");
  });

  it("parses multi-word themes and empty opening tags", () => {
    const p = parseLichessLine(multiThemeLine);
    expect(p?.themes).toEqual(["endgame", "crushing"]);
    expect(p?.openingTags).toEqual([]);
    expect(p?.moves).toEqual(["c3c2"]);
    expect(p?.nbPlays).toBe(1200);
  });
});

describe("inRatingBand", () => {
  it("includes the boundaries", () => {
    expect(inRatingBand({ rating: 300 }, 300, 1800)).toBe(true);
    expect(inRatingBand({ rating: 1800 }, 300, 1800)).toBe(true);
  });
  it("excludes out-of-band ratings", () => {
    expect(inRatingBand({ rating: 299 }, 300, 1800)).toBe(false);
    expect(inRatingBand({ rating: 1801 }, 300, 1800)).toBe(false);
  });
});

describe("isValidPuzzle", () => {
  it("accepts a well-formed row", () => {
    expect(isValidPuzzle({ fen: "k7/8/8/8/8/8/8/K7 w - - 0 1", moves: ["a1a2"], rating: 700 })).toBe(true);
  });
  it("rejects rows without a FEN, moves, or positive rating", () => {
    expect(isValidPuzzle({ fen: "", moves: ["a1a2"], rating: 700 })).toBe(false);
    expect(isValidPuzzle({ fen: "k7/8", moves: [], rating: 700 })).toBe(false);
    expect(isValidPuzzle({ fen: "k7/8", moves: ["a1a2"], rating: NaN })).toBe(false);
    expect(isValidPuzzle({ fen: "k7/8", moves: ["a1a2"], rating: 0 })).toBe(false);
  });
});