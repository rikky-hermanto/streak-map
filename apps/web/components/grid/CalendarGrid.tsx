'use client';

import type { DateKey } from '@streak-map/core';
import { dateFromDateKey, perHabitLevel } from '@streak-map/core';
import { useState } from 'react';
import { MONTH_NAMES, tileLabel } from './labels';
import { Tile } from './Tile';
import type { GridLayoutProps } from './WideGrid';
import { buildGridWeeks } from './weeks';

/** Twelve weeks. A full year of 44px rows would be ~2,400px of scrolling. */
export const MOBILE_WINDOW_DAYS = 84;

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const RANGES = [
  { label: '12 weeks', days: MOBILE_WINDOW_DAYS },
  { label: '6 months', days: 182 },
  { label: '1 year', days: 365 },
] as const;

function monthHeading(key: DateKey): string {
  const date = dateFromDateKey(key);
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * The narrow-viewport layout: seven columns, one row per week, oldest at the
 * top. Tiles reach ~44px on a 360px screen instead of the ~5px they collapse to
 * when 53 week-columns share the same width.
 */
export function CalendarGrid({ counts, target, color, windowDays, today }: GridLayoutProps) {
  const [rangeDays, setRangeDays] = useState(Math.min(windowDays, MOBILE_WINDOW_DAYS));
  const ranges = RANGES.filter((r) => r.days <= windowDays);
  const { firstDay, lastDay, weekStartKeys, columns } = buildGridWeeks(today, rangeDays);
  const maxCount = Math.max(target, ...Object.values(counts));

  let lastMonth = -1;

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 pb-1 font-mono text-[10px] text-tx3">
        {WEEKDAY_HEADERS.map((day) => (
          <div key={day} className="text-center">
            {day}
          </div>
        ))}
      </div>
      {columns.map((week, weekIndex) => {
        const weekStart = weekStartKeys[weekIndex];
        const month = dateFromDateKey(weekStart).getMonth();
        const showHeading = month !== lastMonth;
        if (showHeading) lastMonth = month;
        return (
          <div key={weekStart}>
            {showHeading && (
              <div className="pt-2 pb-1 font-mono text-[10px] text-tx3">
                {monthHeading(weekStart)}
              </div>
            )}
            <div data-week={weekStart} className="grid grid-cols-7 gap-1 pb-1">
              {week.map((date) => {
                const inWindow = date >= firstDay && date <= lastDay;
                if (!inWindow) return <div key={date} className="aspect-square w-full" />;
                const count = counts[date] ?? 0;
                return (
                  <Tile
                    key={date}
                    date={date}
                    count={count}
                    level={perHabitLevel(count, maxCount)}
                    color={color}
                    isToday={date === lastDay}
                    label={tileLabel(date, count)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
      {ranges.length > 1 && (
        // biome-ignore lint/a11y/useSemanticElements: a toggle-button group, not a form control set — fieldset is the wrong semantics
        <div className="mt-3 flex gap-1.5" role="group" aria-label="Grid range">
          {ranges.map(({ label, days }) => (
            <button
              key={label}
              type="button"
              aria-pressed={days === rangeDays}
              onClick={() => setRangeDays(days)}
              className={`focus-ring cursor-pointer rounded-lg px-3 py-2 font-mono text-[10px] ${
                days === rangeDays ? 'bg-elevated text-tx1' : 'text-tx3 hover:text-tx1'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
