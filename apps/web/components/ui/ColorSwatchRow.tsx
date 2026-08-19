'use client';

import { useId } from 'react';

interface ColorSwatchRowProps {
  colors: string[];
  value: string;
  onChange: (color: string) => void;
}

export function ColorSwatchRow({ colors, value, onChange }: ColorSwatchRowProps) {
  const name = useId();
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Accent color">
      {colors.map((color) => (
        <label
          key={color}
          className="focus-ring-within block h-6.5 w-6.5 cursor-pointer rounded-full"
          style={{
            backgroundColor: color,
            outline: color === value ? '2px solid var(--tx1)' : '2px solid transparent',
            outlineOffset: '2px',
          }}
        >
          <input
            type="radio"
            name={name}
            checked={color === value}
            onChange={() => onChange(color)}
            aria-label={`Color ${color}`}
            className="sr-only"
          />
        </label>
      ))}
    </div>
  );
}
