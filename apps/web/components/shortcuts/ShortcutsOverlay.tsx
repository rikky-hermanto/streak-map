const SHORTCUTS: { action: string; key: string }[] = [
  { action: 'Move between habits (dashboard)', key: 'j / k' },
  { action: 'Check in for the focused habit', key: 'space or c' },
  { action: 'New habit', key: 'n' },
  { action: 'Toggle shortcuts overlay', key: '?' },
  { action: 'Close any open dialog', key: 'Esc' },
];

interface ShortcutsOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsOverlay({ open, onClose }: ShortcutsOverlayProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-tx1">Keyboard shortcuts</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="focus-ring cursor-pointer text-tx2 hover:text-tx1"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          {SHORTCUTS.map((s) => (
            <div key={s.action} className="flex items-center justify-between">
              <span className="text-[13px] text-tx2">{s.action}</span>
              <span className="rounded-md border border-border bg-elevated px-1.75 py-0.75 font-mono text-[11px] text-tx1">
                {s.key}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
