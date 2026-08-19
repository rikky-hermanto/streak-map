import { beforeEach, describe, expect, it } from 'vitest';
import { StreakMapDB } from './db';
import {
  archiveHabit,
  checkIn,
  createHabit,
  deleteHabit,
  getAggregateTotalsInRange,
  getCheckInsForHabitInRange,
  listHabits,
  unarchiveHabit,
  undoCheckIn,
} from './repository';

let db: StreakMapDB;

beforeEach(() => {
  db = new StreakMapDB(`test-${crypto.randomUUID()}`);
});

describe('createHabit / listHabits', () => {
  it('assigns a uuid id and timestamps, then is listed', async () => {
    const habit = await createHabit(db, {
      name: 'Deep work',
      color: '#4B8A5E',
      interval: 'daily',
      target: 1,
      startDate: '2026-08-01',
    });

    expect(habit.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(habit.createdAt).toBe(habit.updatedAt);
    expect(habit.order).toBe(0);

    const habits = await listHabits(db);
    expect(habits).toHaveLength(1);
    expect(habits[0].id).toBe(habit.id);
  });
});

describe('checkIn / undoCheckIn', () => {
  it('increments unlimited times, then undo decrements, then deletes at 0', async () => {
    const habit = await createHabit(db, {
      name: 'Read',
      color: '#2ea043',
      interval: 'daily',
      target: 1,
      startDate: '2026-08-01',
    });

    await checkIn(db, habit.id, '2026-08-19');
    await checkIn(db, habit.id, '2026-08-19');
    await checkIn(db, habit.id, '2026-08-19');

    let counts = await getCheckInsForHabitInRange(db, habit.id, '2026-08-19', '2026-08-19');
    expect(counts['2026-08-19']).toBe(3);

    await undoCheckIn(db, habit.id, '2026-08-19');
    counts = await getCheckInsForHabitInRange(db, habit.id, '2026-08-19', '2026-08-19');
    expect(counts['2026-08-19']).toBe(2);

    await undoCheckIn(db, habit.id, '2026-08-19');
    await undoCheckIn(db, habit.id, '2026-08-19');
    // count reached 0 — the row is deleted, not stored as 0.
    counts = await getCheckInsForHabitInRange(db, habit.id, '2026-08-19', '2026-08-19');
    expect(counts['2026-08-19']).toBeUndefined();

    // undo below 0 is a no-op, not an error.
    await expect(undoCheckIn(db, habit.id, '2026-08-19')).resolves.toBeUndefined();
  });
});

describe('archiveHabit / unarchiveHabit / deleteHabit', () => {
  it('archived habits are excluded by default and included on request', async () => {
    const habit = await createHabit(db, {
      name: 'Old habit',
      color: '#888',
      interval: 'daily',
      target: 1,
      startDate: '2026-08-01',
    });
    await archiveHabit(db, habit.id);

    expect(await listHabits(db)).toHaveLength(0);
    expect(await listHabits(db, { includeArchived: true })).toHaveLength(1);

    await unarchiveHabit(db, habit.id);
    expect(await listHabits(db)).toHaveLength(1);
  });

  it('deleted habits never come back, even with includeArchived', async () => {
    const habit = await createHabit(db, {
      name: 'Gone',
      color: '#888',
      interval: 'daily',
      target: 1,
      startDate: '2026-08-01',
    });
    await deleteHabit(db, habit.id);

    expect(await listHabits(db)).toHaveLength(0);
    expect(await listHabits(db, { includeArchived: true })).toHaveLength(0);
  });
});

describe('getAggregateTotalsInRange', () => {
  it('sums non-archived habits per day, zero-filled, excluding archived habits', async () => {
    const a = await createHabit(db, {
      name: 'A',
      color: '#111',
      interval: 'daily',
      target: 1,
      startDate: '2026-08-17',
    });
    const b = await createHabit(db, {
      name: 'B',
      color: '#222',
      interval: 'daily',
      target: 1,
      startDate: '2026-08-17',
    });

    await checkIn(db, a.id, '2026-08-18');
    await checkIn(db, a.id, '2026-08-18');
    await checkIn(db, b.id, '2026-08-18');
    await checkIn(db, b.id, '2026-08-19');

    await archiveHabit(db, b.id);

    const totals = await getAggregateTotalsInRange(db, '2026-08-17', '2026-08-19');
    expect(totals).toEqual([
      { date: '2026-08-17', total: 0 },
      { date: '2026-08-18', total: 2 }, // only A's 2 check-ins — B is archived
      { date: '2026-08-19', total: 0 },
    ]);
  });
});
