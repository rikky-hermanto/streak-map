'use client';

import { dateFromDateKey, todayKey } from '@streak-map/core';
import { checkIn, getCheckInsForHabitInRange, listHabits } from '@streak-map/store';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { HabitCard } from '@/components/habit/HabitCard';
import { HabitEditorModal } from '@/components/habit/HabitEditorModal';
import { ShortcutsOverlay } from '@/components/shortcuts/ShortcutsOverlay';
import { db } from '@/lib/db';
import { useKeyboardShortcut } from '@/lib/useKeyboardShortcut';
import { DashboardHeader } from './DashboardHeader';
import { EmptyState } from './EmptyState';

export function DashboardClient() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
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

  const anyDialogOpen = editorOpen || shortcutsOpen;

  useKeyboardShortcut(
    'j',
    () => {
      if (!habits || habits.length === 0) return;
      setFocusedIndex((i) => Math.min(habits.length - 1, i + 1));
    },
    { enabled: !anyDialogOpen },
  );

  useKeyboardShortcut(
    'k',
    () => {
      setFocusedIndex((i) => Math.max(0, i - 1));
    },
    { enabled: !anyDialogOpen },
  );

  useKeyboardShortcut(
    'c',
    () => {
      const habit = habits?.[focusedIndex];
      if (habit) checkIn(db, habit.id, todayKey());
    },
    { enabled: !anyDialogOpen },
  );

  useKeyboardShortcut(
    ' ',
    () => {
      const habit = habits?.[focusedIndex];
      if (habit) checkIn(db, habit.id, todayKey());
    },
    { enabled: !anyDialogOpen },
  );

  useKeyboardShortcut('n', () => setEditorOpen(true), { enabled: !anyDialogOpen });
  useKeyboardShortcut('?', () => setShortcutsOpen((v) => !v), { enabled: !editorOpen });
  useKeyboardShortcut('Escape', () => setShortcutsOpen(false), { enabled: shortcutsOpen });

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
            {habits.map((habit, i) => (
              <div
                key={habit.id}
                className={
                  i === focusedIndex ? 'rounded-xl shadow-[inset_0_0_0_1.5px_var(--tx2)]' : ''
                }
              >
                <HabitCard habit={habit} />
              </div>
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
      <ShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </main>
  );
}
