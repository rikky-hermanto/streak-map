'use client';

import { useState } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import { tileFill } from '@/lib/colors';

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
  const fill = tileFill(color, level);

  return (
    <div className="relative w-full">
      <div
        data-date={date}
        role="img"
        aria-label={label}
        tabIndex={-1}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="aspect-square w-full rounded-[3px]"
        style={{
          ...fill,
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
