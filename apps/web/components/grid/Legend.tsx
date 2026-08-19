const LEVELS: Array<{ level: number; opacity: number }> = [
  { level: 0, opacity: 0 },
  { level: 1, opacity: 0.32 },
  { level: 2, opacity: 0.56 },
  { level: 3, opacity: 0.8 },
  { level: 4, opacity: 1.0 },
];

interface LegendProps {
  color: string;
}

export function Legend({ color }: LegendProps) {
  return (
    <div className="mt-2.5 flex items-center justify-end gap-1.5 font-mono text-[10px] text-tx3">
      <span>Less</span>
      {LEVELS.map(({ level, opacity }) => (
        <div
          key={level}
          className="h-[11px] w-[11px] rounded-[3px]"
          style={{
            backgroundColor: level === 0 ? 'var(--elevated)' : color,
            opacity: level === 0 ? 1 : opacity,
          }}
        />
      ))}
      <span>More</span>
    </div>
  );
}
