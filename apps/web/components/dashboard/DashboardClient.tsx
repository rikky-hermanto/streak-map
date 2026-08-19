'use client';

import { todayKey } from '@streak-map/core';
import { getCheckInsForHabitInRange, listHabits } from '@streak-map/store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { DashboardHeader } from './DashboardHeader';
import { EmptyState } from './EmptyState';

export function DashboardClient() {
  const habits = useLiveQuery(() => listHabits(db), []);
  const yearStart = `${new Date(todayKey()).getFullYear()}-01-01`;

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

  const handleCreateHabit = () => {
    // Wired to the Habit Editor modal in Task 5.
  };

  return (
    <main className="mx-auto max-w-[1040px] px-6 pt-[6vh] pb-[140px]">
      <DashboardHeader
        checkInsThisYear={checkInsThisYear ?? 0}
        year={new Date(todayKey()).getFullYear()}
      />
      {habits.length === 0 ? (
        <EmptyState onCreateHabit={handleCreateHabit} />
      ) : (
        <p className="text-tx2">{habits.length} habit(s) — cards render in Task 6.</p>
      )}
    </main>
  );
}
