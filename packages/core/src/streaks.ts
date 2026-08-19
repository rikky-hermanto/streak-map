import { addDaysToKey, enumerateDateKeys, enumerateWeekStartKeys, todayKey } from './dates';
import type { DateKey, Interval } from './types';

export interface HabitStreakInput {
  interval: Interval;
  target: number;
  startDate: DateKey;
  counts: Record<DateKey, number>;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  completionRate: number;
}

interface Bucket {
  key: DateKey;
  satisfied: boolean;
}

function sumCountsInBucket(
  counts: Record<DateKey, number>,
  bucketKey: DateKey,
  interval: Interval,
): number {
  if (interval === 'daily') return counts[bucketKey] ?? 0;
  const days = enumerateDateKeys(bucketKey, addDaysToKey(bucketKey, 6));
  return days.reduce((sum, day) => sum + (counts[day] ?? 0), 0);
}

function bucketize(input: HabitStreakInput, today: DateKey): Bucket[] {
  if (input.startDate > today) return [];
  const bucketKeys =
    input.interval === 'daily'
      ? enumerateDateKeys(input.startDate, today)
      : enumerateWeekStartKeys(input.startDate, today);

  return bucketKeys.map((key) => ({
    key,
    satisfied: sumCountsInBucket(input.counts, key, input.interval) >= input.target,
  }));
}

export function computeStreakStats(
  input: HabitStreakInput,
  today: DateKey = todayKey(),
): StreakStats {
  const buckets = bucketize(input, today);

  // Grace rule: an unsatisfied "today" bucket is dropped entirely — it neither breaks the
  // streak nor counts as a failure, it just hasn't happened yet.
  const effective =
    buckets.length > 0 && !buckets[buckets.length - 1].satisfied ? buckets.slice(0, -1) : buckets;

  let currentStreak = 0;
  for (let i = effective.length - 1; i >= 0; i--) {
    if (!effective[i].satisfied) break;
    currentStreak++;
  }

  let longestStreak = 0;
  let run = 0;
  for (const bucket of effective) {
    run = bucket.satisfied ? run + 1 : 0;
    longestStreak = Math.max(longestStreak, run);
  }

  const totalActiveDays = enumerateDateKeys(input.startDate, today).filter(
    (day) => (input.counts[day] ?? 0) > 0,
  ).length;

  const satisfiedCount = buckets.filter((b) => b.satisfied).length;
  const completionRate = buckets.length === 0 ? 0 : satisfiedCount / buckets.length;

  return { currentStreak, longestStreak, totalActiveDays, completionRate };
}
