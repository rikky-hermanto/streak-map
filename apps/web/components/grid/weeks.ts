import type { DateKey } from '@streak-map/core';
import { addDaysToKey, enumerateWeekStartKeys, trailingWindowKeys } from '@streak-map/core';

export interface GridWeeks {
  firstDay: DateKey;
  lastDay: DateKey;
  weekStartKeys: DateKey[];
  /** Parallel to `weekStartKeys`; each entry is exactly 7 Monday-first day keys. */
  columns: DateKey[][];
}

/**
 * Bucket a trailing window of days into Monday-first weeks.
 *
 * Shared by both grid layouts so the horizontal and vertical renderings can
 * never disagree about which day belongs to which week. Day keys stay opaque
 * local `YYYY-MM-DD` strings throughout — no Date arithmetic here.
 */
export function buildGridWeeks(today: DateKey, windowDays: number): GridWeeks {
  const days = trailingWindowKeys(today, windowDays);
  const firstDay = days[0];
  const weekStartKeys = enumerateWeekStartKeys(firstDay, today);
  const columns = weekStartKeys.map((weekStart) =>
    Array.from({ length: 7 }, (_, i) => addDaysToKey(weekStart, i)),
  );
  return { firstDay, lastDay: today, weekStartKeys, columns };
}
