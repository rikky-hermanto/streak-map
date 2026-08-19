'use client';

import { useState } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';

const LEVEL_OPACITY: Record<number, number> = { 1: 0.32, 2: 0.56, 3: 0.8, 4: 1.0 };

interface TileProps {
  date: string;
  count: number;
  level: number;
  color: string;
  isToday: boolean;
  label: string;
}

export function Tile({ date, count: _count, level, color, isToday, label }: TileProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative">
      <div
        data-date={date}
        role="img"
        aria-label={label}
        tabIndex={-1}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="h-[11px] w-[11px] rounded-[3px]"
        style={{
          backgroundColor: level === 0 ? 'var(--elevated)' : color,
          opacity: level === 0 ? 1 : LEVEL_OPACITY[level],
          boxShadow:
            [isToday ? 'inset 0 0 0 1.5px var(--tx1)' : '', hovered ? '0 0 0 1.5px var(--tx3)' : '']
              .filter(Boolean)
              .join(', ') || undefined,
        }}
      />
      <Tooltip text={label} visible={hovered} />
    </div>
  );
}
