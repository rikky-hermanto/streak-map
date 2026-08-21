import type { DateKey } from '@streak-map/core';
import { dateFromDateKey, perHabitLevel } from '@streak-map/core';
import { MONTH_NAMES, tileLabel } from './labels';
import { Tile } from './Tile';
import type { GridLayoutProps } from './WideGrid';
import { buildGridWeeks } from './weeks';

/** Twelve weeks. A full year of 44px rows would be ~2,400px of scrolling. */
export const MOBILE_WINDOW_DAYS = 84;

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

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
  const { firstDay, lastDay, weekStartKeys, columns } = buildGridWeeks(
    today,
    Math.min(windowDays, MOBILE_WINDOW_DAYS),
  );

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
                    level={perHabitLevel(count, target)}
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
    </div>
  );
}
