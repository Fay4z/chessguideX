export const LEVELS = [
  "Pawn",
  "Knight",
  "Bishop",
  "Rook",
  "Queen",
  "King",
] as const;

export interface LevelTier {
  name: (typeof LEVELS)[number];
  minXp: number;
}

export const LEVEL_TIERS: readonly LevelTier[] = [
  { name: "Pawn", minXp: 0 },
  { name: "Knight", minXp: 300 },
  { name: "Bishop", minXp: 600 },
  { name: "Rook", minXp: 1000 },
  { name: "Queen", minXp: 1500 },
  { name: "King", minXp: 2200 },
];

export function levelFor(totalXp: number): (typeof LEVELS)[number] {
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_TIERS[i].minXp) return LEVEL_TIERS[i].name;
  }
  return LEVEL_TIERS[0].name;
}

export interface LevelInfo {
  level: (typeof LEVELS)[number];
  xp: number;
  next: (typeof LEVELS)[number] | null;
  xpToNext: number | null;
}

export function levelInfo(totalXp: number): LevelInfo {
  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_TIERS[i].minXp) {
      const next = LEVEL_TIERS[i + 1] ?? null;
      return {
        level: LEVEL_TIERS[i].name,
        xp: totalXp,
        next: next?.name ?? null,
        xpToNext: next ? next.minXp - totalXp : null,
      };
    }
  }
  return levelInfo(0);
}