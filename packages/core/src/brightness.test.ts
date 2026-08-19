import { describe, expect, it } from 'vitest';
import { aggregateLevels, perHabitLevel, SCALE_FLOOR } from './brightness';

describe('perHabitLevel', () => {
  it('is 0 when count is 0', () => {
    expect(perHabitLevel(0, 4)).toBe(0);
  });

  it('produces levels 1-4 at the exact ceil boundaries for target=4', () => {
    expect(perHabitLevel(1, 4)).toBe(1);
    expect(perHabitLevel(2, 4)).toBe(2);
    expect(perHabitLevel(3, 4)).toBe(3);
    expect(perHabitLevel(4, 4)).toBe(4);
  });

  it('clamps overshoot at 4, never exceeding it', () => {
    expect(perHabitLevel(9, 4)).toBe(4);
  });

  it('floors at level 1 for any nonzero count, however small relative to target', () => {
    expect(perHabitLevel(1, 20)).toBe(1);
  });
});

describe('aggregateLevels', () => {
  it('matches the spec worked example: peak=5, a 1-count day reads as level 1', () => {
    const levels = aggregateLevels([
      { date: '2026-08-18', total: 5 },
      { date: '2026-08-19', total: 1 },
    ]);
    expect(levels.get('2026-08-18')).toBe(4);
    expect(levels.get('2026-08-19')).toBe(1);
  });

  it('floors the peak at SCALE_FLOOR so a single early check-in is not full brightness', () => {
    expect(SCALE_FLOOR).toBe(4);
    const levels = aggregateLevels([
      { date: '2026-08-19', total: 1 },
      { date: '2026-08-18', total: 0 },
    ]);
    // peak = max(4, 1) = 4; intensity = 1/4 = 0.25; ceil(0.25*4) = 1, NOT 4.
    expect(levels.get('2026-08-19')).toBe(1);
  });

  it('is always level 0 for a zero-total day regardless of peak', () => {
    const levels = aggregateLevels([
      { date: '2026-08-18', total: 8 },
      { date: '2026-08-19', total: 0 },
    ]);
    expect(levels.get('2026-08-19')).toBe(0);
  });
});
