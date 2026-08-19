'use client';

import type { Habit } from '@streak-map/core';
import { computeStreakStats, todayKey } from '@streak-map/core';
import { checkIn, undoCheckIn } from '@streak-map/store';
import Link from 'next/link';
import { useState } from 'react';
import { ContributionGrid } from '@/components/grid/ContributionGrid';
import { StatsStrip } from '@/components/stats/StatsStrip';
import { db } from '@/lib/db';
import { useHabitCheckIns } from '@/lib/streakStats';

interface HabitCardProps {
  habit: Habit;
}

export function HabitCard({ habit }: HabitCardProps) {
  const [busy, setBusy] = useState(false);
  const counts = useHabitCheckIns(habit.id);
  const today = todayKey();
  const todayCount = counts?.[today] ?? 0;

  if (counts === undefined) return null;

  const stats = computeStreakStats(
    { interval: habit.interval, target: habit.target, startDate: habit.startDate, counts },
    today,
  );

  const handleCheckIn = async () => {
    setBusy(true);
    await checkIn(db, habit.id, today);
    setBusy(false);
  };

  const handleUndo = async () => {
    setBusy(true);
    await undoCheckIn(db, habit.id, today);
    setBusy(false);
  };

  const settled = todayCount > 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-5.5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/habit/${habit.id}`} className="focus-ring flex items-center gap-2.5">
          <span className="h-2.25 w-2.25 rounded-full" style={{ backgroundColor: habit.color }} />
          <span>
            <span className="block text-[15px] font-semibold text-tx1">{habit.name}</span>
            <span className="block font-mono text-[11px] text-tx3">
              {stats.currentStreak}-day streak
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-2.5">
          {todayCount > 0 && (
            <span className="font-mono text-[11px] text-tx3">{todayCount} today</span>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={handleCheckIn}
            className={`focus-ring cursor-pointer rounded-xl px-4.5 py-2 text-[13px] font-medium transition-colors ${
              settled ? 'bg-elevated text-tx2' : 'border border-border-hi text-tx1'
            }`}
          >
            Check in
          </button>
          {todayCount > 0 && (
            <button
              type="button"
              aria-label="Undo last check-in"
              disabled={busy}
              onClick={handleUndo}
              className="focus-ring h-7.5 w-7.5 cursor-pointer rounded-[10px] border border-border text-tx3 hover:border-border-hi hover:text-tx1"
            >
              −
            </button>
          )}
        </div>
      </div>

      <ContributionGrid counts={counts} target={habit.target} color={habit.color} today={today} />
      <StatsStrip stats={stats} />
    </div>
  );
}
