const WEEKDAY_ROWS: Array<{ key: string; label: string }> = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: '' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: '' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: '' },
  { key: 'sun', label: '' },
];

export function WeekdayLabels() {
  return (
    <div className="flex w-[14px] shrink-0 flex-col gap-[3px]">
      {WEEKDAY_ROWS.map(({ key, label }) => (
        <div key={key} className="h-[11px] font-mono text-[10px] text-tx3">
          {label}
        </div>
      ))}
    </div>
  );
}
