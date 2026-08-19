'use client';

import { computeStreakStats, dateFromDateKey, todayKey } from '@streak-map/core';
import { archiveHabit, listHabits, unarchiveHabit } from '@streak-map/store';
import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ContributionGrid } from '@/components/grid/ContributionGrid';
import { HabitEditorModal } from '@/components/habit/HabitEditorModal';
import { Button } from '@/components/ui/Button';
import { db } from '@/lib/db';
import { useHabitCheckIns } from '@/lib/streakStats';
import { FieldRowPanel } from './FieldRowPanel';

interface HabitDetailClientProps {
  habitId: string;
}

function formatStartDate(dateKey: string): string {
  return dateFromDateKey(dateKey).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function HabitDetailClient({ habitId }: HabitDetailClientProps) {
  const router = useRouter();
  const [editorOpen, setEditorOpen] = useState(false);
  const allHabits = useLiveQuery(() => listHabits(db, { includeArchived: true }), []);
  const counts = useHabitCheckIns(habitId);

  if (allHabits === undefined || counts === undefined) return null;

  const habit = allHabits.find((h) => h.id === habitId);
  if (!habit) {
    return (
      <main className="mx-auto max-w-[1040px] px-6 pt-[6vh]">
        <p className="text-tx2">Habit not found.</p>
        <Link href="/" className="focus-ring text-tx1 underline">
          Back to dashboard
        </Link>
      </main>
    );
  }

  const stats = computeStreakStats(
    { interval: habit.interval, target: habit.target, startDate: habit.startDate, counts },
    todayKey(),
  );

  const meta =
    habit.description ||
    `${habit.target} / ${habit.interval === 'daily' ? 'day' : 'week'} · started ${formatStartDate(habit.startDate)}`;

  const handleToggleArchive = async () => {
    if (habit.archivedAt) {
      await unarchiveHabit(db, habit.id);
    } else {
      await archiveHabit(db, habit.id);
    }
  };

  return (
    <main className="mx-auto max-w-[1040px] px-6 pt-[6vh] pb-[140px]">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          aria-label="Back to dashboard"
          onClick={() => router.push('/')}
          className="focus-ring flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-tx2 opacity-60 hover:bg-accent-s hover:opacity-100"
        >
          ←
        </button>
        <div className="flex flex-wrap gap-2">
          {allHabits.map((h) => (
            <Link
              key={h.id}
              href={`/habit/${h.id}`}
              className={`focus-ring rounded-full border px-3 py-1 text-[13px] ${
                h.id === habit.id
                  ? 'border-border-hi bg-accent-s text-tx1'
                  : 'border-border text-tx3'
              }`}
            >
              {h.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-1 flex items-center gap-2.5">
        <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: habit.color }} />
        <h1 className="text-2xl font-bold text-tx1">{habit.name}</h1>
        {habit.archivedAt && (
          <span className="rounded-md border border-border px-1.75 py-0.5 font-mono text-[10px] text-tx3">
            Archived
          </span>
        )}
      </div>
      <p className="mb-5 text-[13px] text-tx2">{meta}</p>
      <div className="mb-6 border-t border-border" />

      <ContributionGrid
        counts={counts}
        target={habit.target}
        color={habit.color}
        today={todayKey()}
      />

      <div className="mt-6">
        <FieldRowPanel
          rows={[
            { label: 'Current streak', value: `${stats.currentStreak}` },
            { label: 'Longest streak', value: `${stats.longestStreak}` },
            { label: 'Active days', value: `${stats.totalActiveDays} / 365` },
            { label: 'Completion rate', value: `${Math.round(stats.completionRate * 100)}%` },
            {
              label: 'Target',
              value: `${habit.target} / ${habit.interval === 'daily' ? 'day' : 'week'}`,
            },
            { label: 'Started', value: formatStartDate(habit.startDate) },
          ]}
        />
      </div>

      <div className="fixed bottom-6 left-1/2 flex -translate-x-1/2 gap-2 rounded-full border border-border bg-surface p-1.5">
        <Button variant="secondary" onClick={() => setEditorOpen(true)}>
          Edit
        </Button>
        <Button variant="ghost" onClick={handleToggleArchive}>
          {habit.archivedAt ? 'Unarchive' : 'Archive'}
        </Button>
      </div>

      {editorOpen && (
        <HabitEditorModal mode="edit" habit={habit} onClose={() => setEditorOpen(false)} />
      )}
    </main>
  );
}
