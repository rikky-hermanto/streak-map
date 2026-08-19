'use client';

import { useState } from 'react';
import { ContributionGrid } from '@/components/grid/ContributionGrid';
import { Button } from '@/components/ui/Button';
import { ColorSwatchRow } from '@/components/ui/ColorSwatchRow';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Stepper } from '@/components/ui/Stepper';
import { ACCENT_SWATCHES, DEFAULT_HABIT_COLOR } from '@/lib/colors';

const GRID_FIXTURE_COUNTS: Record<string, number> = {
  '2026-08-19': 4,
  '2026-08-18': 3,
  '2026-08-17': 2,
  '2026-08-16': 1,
  '2026-08-14': 4,
  '2026-08-12': 4,
  '2026-08-10': 2,
  '2026-08-05': 1,
  '2026-07-29': 4,
  '2026-07-20': 3,
};

export default function ComponentsSheetPage() {
  const [interval, setInterval_] = useState<'daily' | 'weekly'>('daily');
  const [target, setTarget] = useState(1);
  const [color, setColor] = useState(DEFAULT_HABIT_COLOR);

  return (
    <main className="mx-auto max-w-[1040px] px-6 py-12">
      <h1 className="mb-8 text-xl font-bold text-tx1">Components sheet</h1>

      <section className="mb-10 flex flex-wrap items-center gap-3">
        <Button variant="cta">Primary (CTA)</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="delete">Delete</Button>
        <Button variant="icon" aria-label="Icon button">
          ⚙
        </Button>
      </section>

      <section className="mb-10 flex flex-wrap items-center gap-6">
        <input
          placeholder="Habit name"
          className="focus-ring rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[13px] text-tx1 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        />
        <textarea
          placeholder="Description (optional)"
          rows={2}
          className="focus-ring resize-none rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[13px] text-tx1 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        />
      </section>

      <section className="mb-10 flex flex-wrap items-center gap-6">
        <SegmentedControl
          aria-label="Interval"
          value={interval}
          onChange={setInterval_}
          options={[
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
          ]}
        />
        <Stepper
          value={target}
          min={1}
          max={20}
          onChange={setTarget}
          label={`${target} / ${interval === 'daily' ? 'day' : 'week'}`}
          aria-label-decrease="Decrease target"
          aria-label-increase="Increase target"
        />
      </section>

      <section>
        <ColorSwatchRow colors={ACCENT_SWATCHES} value={color} onChange={setColor} />
      </section>

      <section className="mt-10">
        <ContributionGrid counts={GRID_FIXTURE_COUNTS} target={4} color="#4B8A5E" />
      </section>
    </main>
  );
}
