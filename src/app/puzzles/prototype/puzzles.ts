/**
 * Prototype mock data — no database. Three single-move puzzles.
 * `solution` and `lastMove` are UCI: from + to + optional promotion.
 */
export interface PrototypePuzzle {
  id: string;
  title: string;
  fen: string;
  solution: string;
  lastMove: string;
}

export const PROTOTYPE_PUZZLES: PrototypePuzzle[] = [
  {
    id: "proto-back-rank",
    title: "Back-rank mate",
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    solution: "e1e8",
    lastMove: "f8g8",
  },
  {
    id: "proto-queen-mate",
    title: "Queen delivers mate",
    fen: "7k/6pp/8/8/8/8/5QPP/6K1 w - - 0 1",
    solution: "f2f8",
    lastMove: "g8h8",
  },
  {
    id: "proto-win-queen",
    title: "Win the queen",
    fen: "4k3/8/8/3q4/4P3/8/8/4K3 w - - 0 1",
    solution: "e4d5",
    lastMove: "d6d5",
  },
];