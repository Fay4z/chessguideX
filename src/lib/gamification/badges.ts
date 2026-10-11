export const BADGE_IDS = [
  "first_move",
  "quiz_whiz",
  "puzzle_prowess",
  "streak_7",
  "course_champion",
] as const;

export type BadgeId = (typeof BADGE_IDS)[number];

export interface BadgeStats {
  lessonsCompleted: number;
  quizzesPassed: number;
  puzzlesSolved: number;
  dailyStreak: number;
  coursesCompleted: number;
}

export type BadgeStatKey = keyof BadgeStats;

export interface BadgeTrigger {
  badge: BadgeId;
  stat: BadgeStatKey;
  min: number;
}

export const BADGE_TRIGGERS: readonly BadgeTrigger[] = [
  { badge: "first_move", stat: "lessonsCompleted", min: 1 },
  { badge: "quiz_whiz", stat: "quizzesPassed", min: 1 },
  { badge: "puzzle_prowess", stat: "puzzlesSolved", min: 25 },
  { badge: "streak_7", stat: "dailyStreak", min: 7 },
  { badge: "course_champion", stat: "coursesCompleted", min: 1 },
];

export function badgeTrigger(badge: BadgeId, stats: BadgeStats): boolean {
  const trigger = BADGE_TRIGGERS.find((t) => t.badge === badge);
  if (!trigger) return false;
  return stats[trigger.stat] >= trigger.min;
}

export function earnedBadgeIds(stats: BadgeStats): BadgeId[] {
  return BADGE_IDS.filter((badge) => badgeTrigger(badge, stats));
}

export interface BadgeMeta {
  label: string;
  description: string;
}

export const BADGE_META: Record<BadgeId, BadgeMeta> = {
  first_move: { label: "First Move", description: "Complete your first lesson" },
  quiz_whiz: { label: "Quiz Whiz", description: "Pass your first quiz" },
  puzzle_prowess: { label: "Puzzle Prowess", description: "Solve 25 puzzles" },
  streak_7: { label: "Streak 7", description: "Reach a 7-day daily streak" },
  course_champion: { label: "Course Champion", description: "Complete a course" },
};