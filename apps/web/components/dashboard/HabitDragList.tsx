'use client';

import type { Habit } from '@streak-map/core';
import { reorderHabits } from '@streak-map/store';
import { useState } from 'react';
import { HabitCard } from '@/components/habit/HabitCard';
import { db } from '@/lib/db';

interface HabitDragListProps {
  habits: Habit[];
  focusedIndex: number;
}

/** Move `from` to `to`, returning a new array. */
function move<T>(list: T[], from: number, to: number): T[] {
  const next = list.slice();
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next;
}

/**
 * Drag-and-drop reordering over the dashboard grid. `habits` is the persisted order; while a
 * drag is in flight we render `preview` instead so the cards shuffle live, then write the final
 * order once on drop. Cards are only `draggable` once their handle is pressed, otherwise the
 * links and buttons inside them stop behaving like links and buttons.
 */
export function HabitDragList({ habits, focusedIndex }: HabitDragListProps) {
  const [preview, setPreview] = useState<Habit[] | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [armed, setArmed] = useState<number | null>(null);

  const list = preview ?? habits;

  const commit = async (ordered: Habit[]) => {
    await reorderHabits(
      db,
      ordered.map((h) => h.id),
    );
  };

  const handleDragOver = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setPreview(move(list, dragIndex, index));
    setDragIndex(index);
  };

  const handleDrop = async () => {
    const ordered = preview;
    setDragIndex(null);
    setArmed(null);
    if (ordered) await commit(ordered);
    setPreview(null);
  };

  const nudge = async (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= list.length) return;
    const ordered = move(list, index, to);
    setPreview(ordered);
    await commit(ordered);
    setPreview(null);
  };

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,560px),1fr))] gap-4">
      {list.map((habit, i) => (
        // biome-ignore lint/a11y/noStaticElementInteractions: drag target; keyboard path is on the handle
        <div
          key={habit.id}
          draggable={armed === i}
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', habit.id);
            setDragIndex(i);
          }}
          onDragOver={(e) => {
            if (dragIndex === null) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            handleDragOver(i);
          }}
          onDrop={(e) => {
            e.preventDefault();
            void handleDrop();
          }}
          onDragEnd={() => {
            setDragIndex(null);
            setArmed(null);
            setPreview(null);
          }}
          className={`group relative rounded-xl transition-opacity ${
            i === focusedIndex ? 'shadow-[inset_0_0_0_1.5px_var(--tx2)]' : ''
          } ${dragIndex === i ? 'opacity-50' : ''}`}
        >
          <button
            type="button"
            aria-label={`Reorder ${habit.name}. Position ${i + 1} of ${list.length}. Use arrow keys to move.`}
            onPointerDown={() => setArmed(i)}
            onPointerUp={() => setArmed(null)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                void nudge(i, -1);
              } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                void nudge(i, 1);
              }
            }}
            className="focus-ring absolute top-2 left-1.5 z-10 cursor-grab rounded px-1 py-0.5 font-mono text-[13px] leading-none text-tx3 opacity-0 hover:text-tx1 focus-visible:opacity-100 active:cursor-grabbing group-hover:opacity-100"
          >
            ⠿
          </button>
          <HabitCard habit={habit} />
        </div>
      ))}
    </div>
  );
}
