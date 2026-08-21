import type { DateKey } from '@streak-map/core';
import { todayKey } from '@streak-map/core';
import { Legend } from './Legend';
import { WideGrid } from './WideGrid';

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
  return (
    <div>
      <WideGrid
        counts={counts}
        target={target}
        color={color}
        windowDays={windowDays}
        today={today}
      />
      <Legend color={color} />
    </div>
  );
}
