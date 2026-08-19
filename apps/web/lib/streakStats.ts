'use client';

import type { DateKey } from '@streak-map/core';
import { todayKey, trailingWindowKeys } from '@streak-map/core';
import { getCheckInsForHabitInRange } from '@streak-map/store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';

const WINDOW_DAYS = 365;

export function useHabitCheckIns(
  habitId: string,
  windowDays = WINDOW_DAYS,
): Record<DateKey, number> | undefined {
  return useLiveQuery(() => {
    const days = trailingWindowKeys(todayKey(), windowDays);
    return getCheckInsForHabitInRange(db, habitId, days[0], todayKey());
  }, [habitId, windowDays]);
}
