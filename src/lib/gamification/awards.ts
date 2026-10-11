export const AWARD_KINDS = [
  "lesson_complete",
  "quiz_pass",
  "course_test_pass",
  "puzzle_solved",
  "puzzle_streak_bonus",
  "daily_login",
] as const;

export type AwardKind = (typeof AWARD_KINDS)[number];

export interface AwardEvent {
  kind: AwardKind;
  refId: string;
}

export const REWARD_TABLE: Record<AwardKind, number> = {
  lesson_complete: 50,
  quiz_pass: 100,
  course_test_pass: 150,
  puzzle_solved: 10,
  puzzle_streak_bonus: 5,
  daily_login: 20,
};

const ONCE_ONLY_KINDS: ReadonlySet<AwardKind> = new Set<AwardKind>([
  "lesson_complete",
  "quiz_pass",
  "course_test_pass",
  "daily_login",
]);

export interface AwardLedgerState {
  awardedKeys: ReadonlySet<string>;
}

export interface AwardResult {
  points: number;
  awarded: boolean;
  key: string;
}

export function awardFor(event: AwardEvent): number {
  return REWARD_TABLE[event.kind];
}

export function isOnceOnly(kind: AwardKind): boolean {
  return ONCE_ONLY_KINDS.has(kind);
}

export function awardKey(event: AwardEvent): string {
  return `${event.kind}:${event.refId}`;
}

export function applyAward(state: AwardLedgerState, event: AwardEvent): AwardResult {
  const key = awardKey(event);
  if (isOnceOnly(event.kind) && state.awardedKeys.has(key)) {
    return { points: 0, awarded: false, key };
  }
  return { points: awardFor(event), awarded: true, key };
}