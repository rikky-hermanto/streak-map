interface TooltipProps {
  text: string;
  visible: boolean;
}

export function Tooltip({ text, visible }: TooltipProps) {
  if (!visible) return null;
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-elevated px-2.5 py-1.5 font-mono text-xs text-tx1 shadow-[0_4px_16px_rgba(0,0,0,0.15)]"
    >
      {text}
    </div>
  );
}
