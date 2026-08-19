interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  'aria-label-decrease': string;
  'aria-label-increase': string;
}

export function Stepper({ value, min, max, onChange, label, ...rest }: StepperProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={rest['aria-label-decrease']}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="focus-ring h-7.5 w-7.5 cursor-pointer rounded-lg border border-border bg-elevated text-tx1 hover:border-border-hi disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <span className="min-w-17.5 text-center font-mono text-sm text-tx1">{label}</span>
      <button
        type="button"
        aria-label={rest['aria-label-increase']}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="focus-ring h-7.5 w-7.5 cursor-pointer rounded-lg border border-border bg-elevated text-tx1 hover:border-border-hi disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
