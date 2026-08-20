import { tileFill } from '@/lib/colors';

const LEVELS = [0, 1, 2, 3, 4];

interface LegendProps {
  color: string;
}

export function Legend({ color }: LegendProps) {
  return (
    <div className="mt-2.5 flex items-center justify-end gap-1.5 font-mono text-[10px] text-tx3">
      <span>Less</span>
      {LEVELS.map((level) => (
        <div
          key={level}
          className="h-[11px] w-[11px] rounded-[3px]"
          style={tileFill(color, level)}
        />
      ))}
      <span>More</span>
    </div>
  );
}
