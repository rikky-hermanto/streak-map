interface TooltipProps {
  text: string;
  visible: boolean;
  /**
   * Let prose wrap inside a bubble bounded by both a readable max and the
   * width of the positioned ancestor, so it can never hang off a narrow card.
   * Off by default: the grid tile label is one short line and must not break.
   *
   * The wrap and nowrap widths are chosen here rather than merged from a
   * caller-supplied className — Tailwind resolves conflicting utilities by
   * stylesheet order, not by their order in the attribute, so appending
   * `whitespace-normal` to a base that already says `whitespace-nowrap`
   * silently loses.
   */
  wrap?: boolean;
}

// w-max keeps the bubble as narrow as its content until it hits the cap, so a
// short hint is not rendered as a wide box of mostly empty space. The cap is
// the smaller of a readable line length and the container — on a phone-width
// card the container wins.
const WRAP = 'w-max max-w-[min(17rem,100%)] whitespace-normal break-words';

export function Tooltip({ text, visible, wrap = false }: TooltipProps) {
  if (!visible) return null;
  return (
    <div
      role="tooltip"
      className={`pointer-events-none absolute bottom-full z-10 mb-1.5 rounded-md border border-border bg-elevated px-2.5 py-1.5 font-mono text-xs leading-relaxed text-tx1 shadow-[0_4px_16px_rgba(0,0,0,0.15)] ${
        wrap ? `left-0 ${WRAP}` : 'left-1/2 -translate-x-1/2 whitespace-nowrap'
      }`}
    >
      {text}
    </div>
  );
}
