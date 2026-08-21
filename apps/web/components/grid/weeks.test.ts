import { describe, expect, it } from 'vitest';
import { buildGridWeeks } from './weeks';

describe('buildGridWeeks', () => {
  it('ends on today and starts windowDays-1 earlier', () => {
    const { firstDay, lastDay } = buildGridWeeks('2026-08-20', 14);
    expect(lastDay).toBe('2026-08-20');
    expect(firstDay).toBe('2026-08-07');
  });

  it('produces Monday-first weeks of exactly seven consecutive days', () => {
    const { weekStartKeys, columns } = buildGridWeeks('2026-08-20', 14);
    expect(columns).toHaveLength(weekStartKeys.length);
    for (const [i, week] of columns.entries()) {
      expect(week).toHaveLength(7);
      expect(week[0]).toBe(weekStartKeys[i]);
    }
    expect(columns[0]).toEqual([
      '2026-08-03',
      '2026-08-04',
      '2026-08-05',
      '2026-08-06',
      '2026-08-07',
      '2026-08-08',
      '2026-08-09',
    ]);
  });

  it('pads the leading week with days that precede the window', () => {
    const { firstDay, columns } = buildGridWeeks('2026-08-20', 14);
    expect(columns[0][0] < firstDay).toBe(true);
  });

  it('spans a month boundary without skipping or repeating a day', () => {
    const { columns } = buildGridWeeks('2026-03-05', 21);
    const flat = columns.flat();
    expect(new Set(flat).size).toBe(flat.length);
    expect(flat).toContain('2026-02-28');
    expect(flat).toContain('2026-03-01');
  });
});
