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
  return (
    <div
      role="radiogroup"
      aria-label={rest['aria-label']}
      className="inline-flex rounded-lg border border-border bg-elevated p-0.5"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={opt.value === value}
          onClick={() => onChange(opt.value)}
          className={`focus-ring cursor-pointer rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
            opt.value === value ? 'bg-surface text-tx1 border border-border-hi' : 'text-tx3'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
