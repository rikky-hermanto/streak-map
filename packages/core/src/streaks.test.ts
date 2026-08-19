import { describe, expect, it } from 'vitest';
import type { HabitStreakInput } from './streaks';
import { computeStreakStats } from './streaks';

const daily = (counts: Record<string, number>, startDate = '2026-08-01'): HabitStreakInput => ({
  interval: 'daily',
  target: 1,
  startDate,
  counts,
});

describe('computeStreakStats — grace rule', () => {
  it('applies the grace rule: an unsatisfied today does not break the streak', () => {
    const stats = computeStreakStats(
      daily({
        '2026-08-17': 1,
        '2026-08-18': 1,
        // 2026-08-19 (today) has no check-in yet
      }),
      '2026-08-19',
    );
    expect(stats.currentStreak).toBe(2);
  });

  it('extends the current streak the same day once today is satisfied', () => {
    const stats = computeStreakStats(
      daily({
        '2026-08-18': 1,
        '2026-08-19': 1,
      }),
      '2026-08-19',
    );
    expect(stats.currentStreak).toBe(2);
  });

  it('breaks the streak once a full unsatisfied day has fully elapsed', () => {
    const stats = computeStreakStats(
      daily({
        '2026-08-16': 1,
        // 2026-08-17: unsatisfied and already elapsed — breaks the run
        '2026-08-18': 1,
        '2026-08-19': 1,
      }),
      '2026-08-19',
    );
    expect(stats.currentStreak).toBe(2); // only the trailing 08-18, 08-19 run
  });
});

describe('computeStreakStats — longestStreak', () => {
  it('finds the longest run even when it is not the current run', () => {
    const stats = computeStreakStats(
      daily({
        '2026-08-01': 1,
        '2026-08-02': 1,
        '2026-08-03': 1,
        '2026-08-04': 1,
        // gap
        '2026-08-10': 1,
      }),
      '2026-08-10',
    );
    expect(stats.longestStreak).toBe(4);
    expect(stats.currentStreak).toBe(1);
  });
});

describe('computeStreakStats — weekly habits', () => {
  it('satisfies a weekly bucket by summing counts across the week', () => {
    // Week of Mon 2026-08-17..Sun 2026-08-23, target 3/week.
    const input: HabitStreakInput = {
      interval: 'weekly',
      target: 3,
      startDate: '2026-08-17',
      counts: {
        '2026-08-17': 1,
        '2026-08-19': 2, // total 3 this week — satisfied
      },
    };
    const stats = computeStreakStats(input, '2026-08-19');
    expect(stats.currentStreak).toBe(1);
  });
});

describe('computeStreakStats — totalActiveDays', () => {
  it('counts distinct days with at least one check-in, independent of target/interval', () => {
    const stats = computeStreakStats(
      {
        interval: 'weekly',
        target: 5,
        startDate: '2026-08-17',
        counts: { '2026-08-17': 1, '2026-08-18': 1 }, // 2 active days, week unsatisfied
      },
      '2026-08-19',
    );
    expect(stats.totalActiveDays).toBe(2);
  });
});

describe('computeStreakStats — completionRate', () => {
  it('divides satisfied intervals by elapsed intervals', () => {
    const stats = computeStreakStats(
      daily({ '2026-08-01': 1, '2026-08-02': 1 }, '2026-08-01'),
      '2026-08-04', // 4 elapsed daily intervals, 2 satisfied
    );
    expect(stats.completionRate).toBeCloseTo(0.5);
    expect(stats.currentStreak).toBe(0); // Aug3 unsat breaks the streak; only Aug4 is dropped by grace rule
  });

  it('is 0, not NaN, for a habit with zero elapsed history', () => {
    const stats = computeStreakStats(daily({}, '2026-08-19'), '2026-08-19');
    expect(stats.completionRate).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.longestStreak).toBe(0);
  });
});
