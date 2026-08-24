import type { DateKey } from '@streak-map/core';
import { perHabitLevel } from '@streak-map/core';
import { tileLabel } from './labels';
import { MonthLabels } from './MonthLabels';
import { Tile } from './Tile';
import { WeekdayLabels } from './WeekdayLabels';
import { buildGridWeeks } from './weeks';

export interface GridLayoutProps {
  counts: Record<DateKey, number>;
  target: number;
  color: string;
  windowDays: number;
  today: DateKey;
}

/** The year-at-a-glance layout: one column per week, days running down each column. */
export function WideGrid({ counts, target, color, windowDays, today }: GridLayoutProps) {
  const { firstDay, lastDay, weekStartKeys, columns } = buildGridWeeks(today, windowDays);
  const maxCount = Math.max(target, ...Object.values(counts));

  return (
    <div>
      <MonthLabels weekStartKeys={weekStartKeys} />
      <div className="flex gap-[3px]">
        <WeekdayLabels />
        {columns.map((week, weekIndex) => (
          <div key={weekStartKeys[weekIndex]} className="flex min-w-0 flex-1 flex-col gap-[3px]">
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
        ))}
      </div>
    </div>
  );
}
