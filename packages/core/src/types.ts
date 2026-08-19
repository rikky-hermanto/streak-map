/** A calendar day key in LOCAL time: "YYYY-MM-DD". Never a timestamp, never UTC-derived. */
export type DateKey = string;

export type Interval = 'daily' | 'weekly';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  color: string;
  interval: Interval;
  target: number;
  startDate: DateKey;
  order: number;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

/**
 * One row per (habitId, date). `count` holds the number of completions that day rather than
 * one row per completion event, so a 365-day grid query is a single indexed range scan.
 */
export interface CheckIn {
  id: string;
  habitId: string;
  date: DateKey;
  count: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
