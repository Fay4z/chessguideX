export interface LeaderboardRow {
  userId: string;
  name: string;
  points: number;
}

export interface RankedRow extends LeaderboardRow {
  rank: number;
}

export function rankByPoints(rows: LeaderboardRow[]): RankedRow[] {
  return [...rows]
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.name.localeCompare(b.name);
    })
    .map((row, i) => ({ ...row, rank: i + 1 }));
}