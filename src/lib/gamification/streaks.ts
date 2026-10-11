function toDays(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

export function nextDailyStreak(
  current: number,
  lastActivityDay: string | null,
  today: string,
): number {
  if (lastActivityDay === null) return 1;
  if (lastActivityDay === today) return current;
  const diff = toDays(today) - toDays(lastActivityDay);
  if (diff === 1) return current + 1;
  return 1;
}

export function nextPuzzleStreak(current: number, solved: boolean): number {
  return solved ? current + 1 : 0;
}