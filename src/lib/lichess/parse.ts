export interface LichessPuzzleLine {
  lichessId: string;
  fen: string;
  moves: string[];
  rating: number;
  ratingDeviation: number;
  popularity: number;
  nbPlays: number;
  themes: string[];
  gameUrl: string;
  openingTags: string[];
}

/**
 * Parses one line of lichess_db_puzzle.csv (10 columns, comma-separated).
 * The Themes column is itself comma-separated and unquoted, so the field is
 * recovered by locating the GameUrl column (the only one starting with http).
 * Returns null for the header row and malformed lines.
 */
export function parseLichessLine(line: string): LichessPuzzleLine | null {
  if (line.trim() === "" || line.startsWith("PuzzleId")) return null;
  const parts = line.split(",");
  if (parts.length < 9) return null;

  const urlIdx = parts.findIndex((p) => p.startsWith("http"));
  if (urlIdx < 0) return null;

  const [lichessId, fen, moves, rating, ratingDeviation, popularity, nbPlays] =
    parts;

  const themes = parts
    .slice(7, urlIdx)
    .join(",")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const openingTags = parts
    .slice(urlIdx + 1)
    .join(",")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return {
    lichessId,
    fen,
    moves: moves.split(" ").filter(Boolean),
    rating: Number(rating),
    ratingDeviation: Number(ratingDeviation),
    popularity: Number(popularity),
    nbPlays: Number(nbPlays),
    themes,
    gameUrl: parts[urlIdx],
    openingTags,
  };
}

export function inRatingBand(
  puzzle: Pick<LichessPuzzleLine, "rating">,
  min: number,
  max: number,
): boolean {
  return puzzle.rating >= min && puzzle.rating <= max;
}

export function isValidPuzzle(
  puzzle: Pick<LichessPuzzleLine, "fen" | "moves" | "rating">,
): boolean {
  return (
    puzzle.fen !== "" &&
    puzzle.moves.length > 0 &&
    Number.isFinite(puzzle.rating) &&
    puzzle.rating > 0
  );
}