'use client';

import { useId } from 'react';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  'aria-label': string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ...rest
}: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-label={rest['aria-label']}
      className="inline-flex rounded-lg border border-border bg-elevated p-0.5"
    >
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`focus-ring-within cursor-pointer rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
            opt.value === value ? 'bg-surface text-tx1 border border-border-hi' : 'text-tx3'
          }`}
        >
          <input
            type="radio"
            name={name}
            checked={opt.value === value}
            onChange={() => onChange(opt.value)}
            className="sr-only"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
