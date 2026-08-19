'use client';

import type { Habit } from '@streak-map/core';
import { todayKey } from '@streak-map/core';
import { createHabit, deleteHabit, updateHabit } from '@streak-map/store';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ColorSwatchRow } from '@/components/ui/ColorSwatchRow';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Stepper } from '@/components/ui/Stepper';
import { ACCENT_SWATCHES, DEFAULT_HABIT_COLOR } from '@/lib/colors';
import { db } from '@/lib/db';
import { useKeyboardShortcut } from '@/lib/useKeyboardShortcut';

interface HabitEditorModalProps {
  mode: 'create' | 'edit';
  habit?: Habit;
  onClose: () => void;
}

export function HabitEditorModal({ mode, habit, onClose }: HabitEditorModalProps) {
  const [name, setName] = useState(habit?.name ?? '');
  const [description, setDescription] = useState(habit?.description ?? '');
  const [startDate, setStartDate] = useState(habit?.startDate ?? todayKey());
  const [interval, setInterval_] = useState<'daily' | 'weekly'>(habit?.interval ?? 'daily');
  const [target, setTarget] = useState(habit?.target ?? 1);
  const [color, setColor] = useState(habit?.color ?? DEFAULT_HABIT_COLOR);

  useKeyboardShortcut('Escape', onClose);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (trimmed === '') {
      onClose();
      return;
    }
    if (mode === 'create') {
      await createHabit(db, {
        name: trimmed,
        description: description.trim() || undefined,
        color,
        interval,
        target,
        startDate,
      });
    } else if (habit) {
      await updateHabit(db, habit.id, {
        name: trimmed,
        description: description.trim() || undefined,
        color,
        interval,
        target,
        startDate,
      });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (habit) await deleteHabit(db, habit.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex max-h-[86vh] w-full max-w-[440px] flex-col overflow-y-auto rounded-2xl border border-border bg-surface p-6.5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-tx1">
            {mode === 'create' ? 'New habit' : 'Edit habit'}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="focus-ring cursor-pointer text-tx2 hover:text-tx1"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-tx2">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="focus-ring rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[13px] text-tx1"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-tx2">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="focus-ring resize-none rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[13px] text-tx1"
            />
          </label>

          <div className="flex gap-4">
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs text-tx2">Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="focus-ring rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[13px] text-tx1"
              />
            </label>
            <div className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs text-tx2">Interval</span>
              <SegmentedControl
                aria-label="Interval"
                value={interval}
                onChange={setInterval_}
                options={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                ]}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-tx2">Target</span>
            <Stepper
              value={target}
              min={1}
              max={20}
              onChange={setTarget}
              label={`${target} / ${interval === 'daily' ? 'day' : 'week'}`}
              aria-label-decrease="Decrease target"
              aria-label-increase="Increase target"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-tx2">Accent color</span>
            <ColorSwatchRow colors={ACCENT_SWATCHES} value={color} onChange={setColor} />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          {mode === 'edit' ? (
            <Button variant="delete" onClick={handleDelete}>
              Delete habit
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="cta" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
