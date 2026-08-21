import type { DateKey } from '@streak-map/core';
import { perHabitLevel, todayKey } from '@streak-map/core';
import { Legend } from './Legend';
import { tileLabel } from './labels';
import { MonthLabels } from './MonthLabels';
import { Tile } from './Tile';
import { WeekdayLabels } from './WeekdayLabels';
import { buildGridWeeks } from './weeks';

const WINDOW_DAYS = 365;

interface ContributionGridProps {
  counts: Record<DateKey, number>;
  target: number;
  color: string;
  windowDays?: number;
  today?: DateKey;
}

export function ContributionGrid({
  counts,
  target,
  color,
  windowDays = WINDOW_DAYS,
  today = todayKey(),
}: ContributionGridProps) {
  const { firstDay, lastDay, weekStartKeys, columns } = buildGridWeeks(today, windowDays);

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
                  level={perHabitLevel(count, target)}
                  color={color}
                  isToday={date === lastDay}
                  label={tileLabel(date, count)}
                />
              );
            })}
          </div>
        ))}
      </div>
      <Legend color={color} />
    </div>
  );
}
