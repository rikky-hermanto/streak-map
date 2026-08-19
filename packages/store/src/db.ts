import type { CheckIn, Habit } from '@streak-map/core';
import Dexie, { type Table } from 'dexie';

export interface MetaRow {
  key: string;
  value: unknown;
}

export class StreakMapDB extends Dexie {
  habits!: Table<Habit, string>;
  checkins!: Table<CheckIn, string>;
  meta!: Table<MetaRow, string>;

  constructor(name = 'streak-map') {
    super(name);
    this.version(1).stores({
      habits: 'id, order, archivedAt, deletedAt',
      checkins: 'id, habitId, date, [habitId+date], deletedAt',
      meta: 'key',
    });
  }
}
