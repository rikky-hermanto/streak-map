import type { DateKey } from '@streak-map/core';
import { dateFromDateKey } from '@streak-map/core';

export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export function formatDisplayDate(key: DateKey): string {
  const date = dateFromDateKey(key);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function tileLabel(date: DateKey, count: number): string {
  if (count === 0) return `No check-ins on ${formatDisplayDate(date)}`;
  return `${count} check-in${count === 1 ? '' : 's'} on ${formatDisplayDate(date)}`;
}
