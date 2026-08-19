interface ColorSwatchRowProps {
  colors: string[];
  value: string;
  onChange: (color: string) => void;
}

export function ColorSwatchRow({ colors, value, onChange }: ColorSwatchRowProps) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Accent color">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={color === value}
          aria-label={`Color ${color}`}
          onClick={() => onChange(color)}
          className="focus-ring h-6.5 w-6.5 cursor-pointer rounded-full"
          style={{
            backgroundColor: color,
            outline: color === value ? '2px solid var(--tx1)' : '2px solid transparent',
            outlineOffset: '2px',
          }}
        />
      ))}
    </div>
  );
}
