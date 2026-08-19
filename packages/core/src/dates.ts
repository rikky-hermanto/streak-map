import type { DateKey } from './types';

export function dateKeyFromDate(date: Date): DateKey {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayKey(now: Date = new Date()): DateKey {
  return dateKeyFromDate(now);
}

export function dateFromDateKey(key: DateKey): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDaysToKey(key: DateKey, amount: number): DateKey {
  const date = dateFromDateKey(key);
  date.setDate(date.getDate() + amount);
  return dateKeyFromDate(date);
}

export function startOfWeekMonday(key: DateKey): DateKey {
  const date = dateFromDateKey(key);
  const day = date.getDay(); // 0 = Sunday .. 6 = Saturday, local
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);
  return dateKeyFromDate(date);
}

export function enumerateDateKeys(startKey: DateKey, endKey: DateKey): DateKey[] {
  if (startKey > endKey) return [];
  const keys: DateKey[] = [];
  let cursor = startKey;
  while (cursor <= endKey) {
    keys.push(cursor);
    cursor = addDaysToKey(cursor, 1);
  }
  return keys;
}

export function enumerateWeekStartKeys(startKey: DateKey, endKey: DateKey): DateKey[] {
  const firstWeek = startOfWeekMonday(startKey);
  const lastWeek = startOfWeekMonday(endKey);
  const weeks: DateKey[] = [];
  let cursor = firstWeek;
  while (cursor <= lastWeek) {
    weeks.push(cursor);
    cursor = addDaysToKey(cursor, 7);
  }
  return weeks;
}

export function trailingWindowKeys(endKey: DateKey, days: number): DateKey[] {
  return enumerateDateKeys(addDaysToKey(endKey, -(days - 1)), endKey);
}
