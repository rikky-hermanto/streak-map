'use client';

import type { StreakStats } from '@streak-map/core';
import { useState } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';

interface StatsStripProps {
  stats: StreakStats;
}

export function StatsStrip({ stats }: StatsStripProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const items = [
    {
      label: 'Current streak',
      value: `${stats.currentStreak}`,
      hint: 'Intervals in a row that met the target, counting back from today. An unfinished today does not break it.',
    },
    {
      label: 'Longest streak',
      value: `${stats.longestStreak}`,
      hint: 'The longest run of consecutive intervals that met the target, across all history.',
    },
    {
      label: 'Active days',
      value: `${stats.totalActiveDays} / 365`,
      hint: 'Days with at least one check-in, out of the trailing 365 days shown in the grid.',
    },
    {
      label: 'Completion rate',
      value: `${Math.round(stats.completionRate * 100)}%`,
      hint: 'Share of intervals since the habit started that met the target in full. Partial progress does not count.',
    },
  ];

  return (
    <div className="mt-3.5 flex flex-wrap gap-5 border-t border-border pt-3.5">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className="relative cursor-help text-left"
          aria-label={`${item.label}: ${item.hint}`}
          onMouseEnter={() => setHovered(item.label)}
          onMouseLeave={() => setHovered(null)}
          onFocus={() => setHovered(item.label)}
          onBlur={() => setHovered(null)}
        >
          <div className="text-[11px] text-tx3">{item.label}</div>
          <div className="font-mono text-[17px] font-semibold text-tx1">{item.value}</div>
          <Tooltip
            text={item.hint}
            visible={hovered === item.label}
            className="left-0 max-w-[240px] translate-x-0 whitespace-normal"
          />
        </button>
      ))}
    </div>
  );
}
