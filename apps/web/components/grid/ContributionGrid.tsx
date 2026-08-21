'use client';

import type { DateKey } from '@streak-map/core';
import { todayKey } from '@streak-map/core';
import { useIsNarrow } from '@/lib/useIsNarrow';
import { CalendarGrid } from './CalendarGrid';
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

/**
 * Picks a grid layout for the viewport. Narrow screens get a vertical calendar
 * because 53 week-columns sharing a phone's width collapse tiles to ~5px.
 *
 * Only one layout mounts: rendering both and toggling with CSS would double 365
 * `Tile` components and their hover state.
 */
export function ContributionGrid({
  counts,
  target,
  color,
  windowDays = WINDOW_DAYS,
  today = todayKey(),
}: ContributionGridProps) {
  const isNarrow = useIsNarrow();
  const Layout = isNarrow ? CalendarGrid : WideGrid;

  return (
    <div>
      <Layout counts={counts} target={target} color={color} windowDays={windowDays} today={today} />
      <Legend color={color} />
    </div>
  );
}
