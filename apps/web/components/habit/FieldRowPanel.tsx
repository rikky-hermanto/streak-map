interface Row {
  label: string;
  value: string;
}

interface FieldRowPanelProps {
  rows: Row[];
}

export function FieldRowPanel({ rows }: FieldRowPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-surface">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex items-center justify-between px-5 py-3.5 ${i < rows.length - 1 ? 'border-b border-border' : ''}`}
        >
          <span className="text-[13px] text-tx2">{row.label}</span>
          <span className="font-mono text-[13px] text-tx1">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
