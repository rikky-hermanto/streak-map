import type { DateKey } from '@streak-map/core';
import {
  dateFromDateKey,
  enumerateWeekStartKeys,
  perHabitLevel,
  todayKey,
  trailingWindowKeys,
} from '@streak-map/core';
import { Legend } from './Legend';
import { MonthLabels } from './MonthLabels';
import { Tile } from './Tile';
import { WeekdayLabels } from './WeekdayLabels';

const WINDOW_DAYS = 365;

interface ContributionGridProps {
  counts: Record<DateKey, number>;
  target: number;
  color: string;
  windowDays?: number;
  today?: DateKey;
}

function formatDisplayDate(key: DateKey): string {
  const date = dateFromDateKey(key);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function tileLabel(date: DateKey, count: number): string {
  if (count === 0) return `No check-ins on ${formatDisplayDate(date)}`;
  return `${count} check-in${count === 1 ? '' : 's'} on ${formatDisplayDate(date)}`;
}

export function ContributionGrid({
  counts,
  target,
  color,
  windowDays = WINDOW_DAYS,
  today = todayKey(),
}: ContributionGridProps) {
  const days = trailingWindowKeys(today, windowDays);
  const firstDay = days[0];
  const weekStartKeys = enumerateWeekStartKeys(firstDay, today);

  const columns: DateKey[][] = weekStartKeys.map((weekStart) => {
    const week: DateKey[] = [];
    const start = dateFromDateKey(weekStart);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      week.push(key);
    }
    return week;
  });

  return (
    <div>
      <MonthLabels weekStartKeys={weekStartKeys} />
      <div className="flex gap-[3px]">
        <WeekdayLabels />
        {columns.map((week, weekIndex) => (
          <div key={weekStartKeys[weekIndex]} className="flex min-w-0 flex-1 flex-col gap-[3px]">
            {week.map((date) => {
              const inWindow = date >= firstDay && date <= today;
              if (!inWindow) return <div key={date} className="aspect-square w-full" />;
              const count = counts[date] ?? 0;
              const level = perHabitLevel(count, target);
              return (
                <Tile
                  key={date}
                  date={date}
                  count={count}
                  level={level}
                  color={color}
                  isToday={date === today}
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
