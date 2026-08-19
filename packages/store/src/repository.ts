import { type DateKey, enumerateDateKeys, type Habit, type Interval } from '@streak-map/core';
import { v7 as uuidv7 } from 'uuid';
import type { StreakMapDB } from './db';

export interface CreateHabitInput {
  name: string;
  description?: string;
  color: string;
  interval: Interval;
  target: number;
  startDate: DateKey;
}

export async function createHabit(db: StreakMapDB, input: CreateHabitInput): Promise<Habit> {
  const now = new Date().toISOString();
  const existingCount = await db.habits.filter((h) => h.deletedAt === undefined).count();
  const habit: Habit = {
    id: uuidv7(),
    name: input.name,
    description: input.description,
    color: input.color,
    interval: input.interval,
    target: input.target,
    startDate: input.startDate,
    order: existingCount,
    createdAt: now,
    updatedAt: now,
  };
  await db.habits.add(habit);
  return habit;
}

export async function updateHabit(
  db: StreakMapDB,
  id: string,
  patch: Partial<
    Pick<Habit, 'name' | 'description' | 'color' | 'interval' | 'target' | 'startDate' | 'order'>
  >,
): Promise<void> {
  await db.habits.update(id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function archiveHabit(db: StreakMapDB, id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.habits.update(id, { archivedAt: now, updatedAt: now });
}

export async function unarchiveHabit(db: StreakMapDB, id: string): Promise<void> {
  await db.habits.update(id, { archivedAt: undefined, updatedAt: new Date().toISOString() });
}

export async function deleteHabit(db: StreakMapDB, id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.habits.update(id, { deletedAt: now, updatedAt: now });
}

export async function listHabits(
  db: StreakMapDB,
  options: { includeArchived?: boolean } = {},
): Promise<Habit[]> {
  const { includeArchived = false } = options;
  return db.habits
    .filter((h) => h.deletedAt === undefined && (includeArchived || h.archivedAt === undefined))
    .sortBy('order');
}

export async function checkIn(db: StreakMapDB, habitId: string, date: DateKey): Promise<void> {
  await db.transaction('rw', db.checkins, async () => {
    const existing = await db.checkins.where('[habitId+date]').equals([habitId, date]).first();
    const now = new Date().toISOString();
    if (existing) {
      await db.checkins.update(existing.id, { count: existing.count + 1, updatedAt: now });
    } else {
      await db.checkins.add({
        id: uuidv7(),
        habitId,
        date,
        count: 1,
        createdAt: now,
        updatedAt: now,
      });
    }
  });
}

export async function undoCheckIn(db: StreakMapDB, habitId: string, date: DateKey): Promise<void> {
  await db.transaction('rw', db.checkins, async () => {
    const existing = await db.checkins.where('[habitId+date]').equals([habitId, date]).first();
    if (!existing) return;
    if (existing.count <= 1) {
      await db.checkins.delete(existing.id);
    } else {
      await db.checkins.update(existing.id, {
        count: existing.count - 1,
        updatedAt: new Date().toISOString(),
      });
    }
  });
}

export async function getCheckInsForHabitInRange(
  db: StreakMapDB,
  habitId: string,
  startKey: DateKey,
  endKey: DateKey,
): Promise<Record<DateKey, number>> {
  const rows = await db.checkins
    .where('[habitId+date]')
    .between([habitId, startKey], [habitId, endKey], true, true)
    .and((row) => row.deletedAt === undefined)
    .toArray();

  const result: Record<DateKey, number> = {};
  for (const row of rows) result[row.date] = row.count;
  return result;
}

export async function getAggregateTotalsInRange(
  db: StreakMapDB,
  startKey: DateKey,
  endKey: DateKey,
): Promise<{ date: DateKey; total: number }[]> {
  const activeHabits = await db.habits
    .filter((h) => h.deletedAt === undefined && h.archivedAt === undefined)
    .toArray();
  const activeIds = new Set(activeHabits.map((h) => h.id));

  const rows = await db.checkins
    .where('date')
    .between(startKey, endKey, true, true)
    .and((row) => row.deletedAt === undefined && activeIds.has(row.habitId))
    .toArray();

  const totals = new Map<DateKey, number>();
  for (const row of rows) {
    totals.set(row.date, (totals.get(row.date) ?? 0) + row.count);
  }

  return enumerateDateKeys(startKey, endKey).map((date) => ({
    date,
    total: totals.get(date) ?? 0,
  }));
}
