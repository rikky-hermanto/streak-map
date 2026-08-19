'use client';

import { dateFromDateKey, todayKey } from '@streak-map/core';
import { getCheckInsForHabitInRange, listHabits } from '@streak-map/store';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { HabitCard } from '@/components/habit/HabitCard';
import { HabitEditorModal } from '@/components/habit/HabitEditorModal';
import { db } from '@/lib/db';
import { DashboardHeader } from './DashboardHeader';
import { EmptyState } from './EmptyState';

export function DashboardClient() {
  const [editorOpen, setEditorOpen] = useState(false);
  const habits = useLiveQuery(() => listHabits(db), []);
  const yearStart = `${dateFromDateKey(todayKey()).getFullYear()}-01-01`;

  const checkInsThisYear = useLiveQuery(async () => {
    const list = await listHabits(db);
    const perHabit = await Promise.all(
      list.map((h) => getCheckInsForHabitInRange(db, h.id, yearStart, todayKey())),
    );
    return perHabit.reduce(
      (sum, counts) => sum + Object.values(counts).reduce((a, b) => a + b, 0),
      0,
    );
  }, [habits]);

  if (habits === undefined) return null;

  return (
    <main className="mx-auto max-w-[1040px] px-6 pt-[6vh] pb-[140px]">
      <DashboardHeader
        checkInsThisYear={checkInsThisYear ?? 0}
        year={dateFromDateKey(todayKey()).getFullYear()}
      />
      {habits.length === 0 ? (
        <EmptyState onCreateHabit={() => setEditorOpen(true)} />
      ) : (
        <section>
          <h2 className="mb-4 text-[13px] font-medium text-tx2">Habits</h2>
          <div className="flex flex-col gap-4">
            {habits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} />
            ))}
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setEditorOpen(true)}
        className="focus-ring fixed bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-[20px] bg-cta-bg px-5.5 py-3 text-sm font-medium text-cta-text shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:bg-cta-hover"
      >
        New habit <span className="font-mono text-[11px] opacity-70">n</span>
      </button>

      {editorOpen && <HabitEditorModal mode="create" onClose={() => setEditorOpen(false)} />}
    </main>
  );
}
