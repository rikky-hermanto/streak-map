import { describe, expect, it } from 'vitest';
import {
  addDaysToKey,
  dateKeyFromDate,
  enumerateDateKeys,
  enumerateWeekStartKeys,
  startOfWeekMonday,
  todayKey,
  trailingWindowKeys,
} from './dates';

describe('dateKeyFromDate', () => {
  it('formats a local date as zero-padded YYYY-MM-DD', () => {
    expect(dateKeyFromDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(dateKeyFromDate(new Date(2026, 7, 19))).toBe('2026-08-19');
  });
});

describe('todayKey', () => {
  it('derives the key from local date fields, not UTC, regardless of TZ', () => {
    const originalTz = process.env.TZ;
    process.env.TZ = 'Pacific/Kiritimati'; // UTC+14
    try {
      // A fixed local wall-clock moment: Aug 19, 2026, 00:30 local time.
      // In UTC+14, this is 2026-08-18 10:30 UTC — the *previous* day.
      // Correct local-based extraction returns 2026-08-19 (local date of construction).
      // Buggy UTC-based extraction would incorrectly return 2026-08-18.
      const localMoment = new Date(2026, 7, 19, 0, 30);
      expect(todayKey(localMoment)).toBe('2026-08-19');
    } finally {
      process.env.TZ = originalTz;
    }
  });
});

describe('addDaysToKey', () => {
  it('adds days forward across a month boundary', () => {
    expect(addDaysToKey('2026-01-30', 3)).toBe('2026-02-02');
  });

  it('subtracts days backward across a year boundary', () => {
    expect(addDaysToKey('2026-01-01', -1)).toBe('2025-12-31');
  });
});

describe('startOfWeekMonday', () => {
  it('returns the Monday of the week for a mid-week date', () => {
    // 2026-08-19 is a Wednesday.
    expect(startOfWeekMonday('2026-08-19')).toBe('2026-08-17');
  });

  it('returns the same date when already a Monday', () => {
    expect(startOfWeekMonday('2026-08-17')).toBe('2026-08-17');
  });

  it('rolls a Sunday back to the preceding Monday, not forward', () => {
    expect(startOfWeekMonday('2026-08-23')).toBe('2026-08-17');
  });
});

describe('enumerateDateKeys', () => {
  it('returns an inclusive range', () => {
    expect(enumerateDateKeys('2026-08-17', '2026-08-19')).toEqual([
      '2026-08-17',
      '2026-08-18',
      '2026-08-19',
    ]);
  });

  it('returns an empty array when end is before start', () => {
    expect(enumerateDateKeys('2026-08-19', '2026-08-17')).toEqual([]);
  });
});

describe('enumerateWeekStartKeys', () => {
  it('returns one Monday key per week spanned by the range', () => {
    // Aug 17 (Mon) through Aug 26 (Wed) spans the weeks starting Aug 17 and Aug 24.
    expect(enumerateWeekStartKeys('2026-08-17', '2026-08-26')).toEqual([
      '2026-08-17',
      '2026-08-24',
    ]);
  });
});

describe('trailingWindowKeys', () => {
  it('returns exactly N keys ending at the given key', () => {
    const keys = trailingWindowKeys('2026-08-19', 5);
    expect(keys).toEqual(['2026-08-15', '2026-08-16', '2026-08-17', '2026-08-18', '2026-08-19']);
  });
});
