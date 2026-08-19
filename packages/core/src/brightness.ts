import type { DateKey } from './types';

export const SCALE_FLOOR = 4;

export function perHabitLevel(count: number, target: number): number {
  if (count === 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((count / target) * 4)));
}

export interface AggregateDayTotal {
  date: DateKey;
  total: number;
}

export function aggregateLevels(days: AggregateDayTotal[]): Map<DateKey, number> {
  const peak = Math.max(SCALE_FLOOR, ...days.map((d) => d.total));
  const levels = new Map<DateKey, number>();
  for (const { date, total } of days) {
    if (total === 0) {
      levels.set(date, 0);
      continue;
    }
    const intensity = total / peak;
    levels.set(date, Math.min(4, Math.max(1, Math.ceil(intensity * 4))));
  }
  return levels;
}
