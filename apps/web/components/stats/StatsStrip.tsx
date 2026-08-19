import type { StreakStats } from '@streak-map/core';

interface StatsStripProps {
  stats: StreakStats;
}

export function StatsStrip({ stats }: StatsStripProps) {
  const items = [
    { label: 'Current streak', value: `${stats.currentStreak}` },
    { label: 'Longest streak', value: `${stats.longestStreak}` },
    { label: 'Active days', value: `${stats.totalActiveDays} / 365` },
    { label: 'Completion rate', value: `${Math.round(stats.completionRate * 100)}%` },
  ];

  return (
    <div className="mt-3.5 flex flex-wrap gap-5 border-t border-border pt-3.5">
      {items.map((item) => (
        <div key={item.label}>
          <div className="text-[11px] text-tx3">{item.label}</div>
          <div className="font-mono text-[17px] font-semibold text-tx1">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
