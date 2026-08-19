'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { db } from '@/lib/db';
import { buildExportPayload, parseImportPayload } from '@/lib/schema';
import { getStoredTheme, setStoredTheme, type Theme } from '@/lib/theme';

const SHORTCUTS: { action: string; key: string }[] = [
  { action: 'Move between habits (dashboard)', key: 'j / k' },
  { action: 'Check in for the focused habit', key: 'space or c' },
  { action: 'New habit', key: 'n' },
  { action: 'Toggle shortcuts overlay', key: '?' },
  { action: 'Close any open dialog', key: 'Esc' },
];

export function SettingsClient() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleThemeChange = (next: Theme) => {
    setTheme(next);
    setStoredTheme(next);
  };

  const handleExport = async () => {
    const [habits, checkins] = await Promise.all([db.habits.toArray(), db.checkins.toArray()]);
    const payload = buildExportPayload(habits, checkins);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'streak-map-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    setImportError(null);
    try {
      const text = await file.text();
      const payload = parseImportPayload(JSON.parse(text));
      await db.transaction('rw', db.habits, db.checkins, async () => {
        await db.habits.clear();
        await db.checkins.clear();
        await db.habits.bulkAdd(payload.habits);
        await db.checkins.bulkAdd(payload.checkins);
      });
    } catch {
      setImportError('That file is not a valid streak-map export.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <main className="mx-auto max-w-[560px] px-6 pt-[6vh] pb-16">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          aria-label="Back"
          className="focus-ring flex h-7 w-7 items-center justify-center rounded-lg text-tx2 opacity-60 hover:bg-accent-s hover:opacity-100"
        >
          ←
        </Link>
        <h1 className="text-xl font-bold text-tx1">Settings</h1>
      </div>

      <div className="flex flex-col gap-4.5">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-[13px] font-semibold text-tx1">Data</h2>
          <p className="mb-4 text-[13px] text-tx2">
            Your data lives only in this browser. Export it regularly, or before clearing site data,
            so you never lose your history.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Button variant="secondary" onClick={handleExport}>
              Export data (JSON)
            </Button>
            <label
              htmlFor="import-file-input"
              className="cursor-pointer rounded-2xl border border-border bg-elevated px-4 py-2.5 text-[13px] text-tx1 hover:border-border-hi focus-within:[box-shadow:0_0_0_3px_var(--focus-ring)]"
            >
              Import data (JSON)
              <input
                ref={fileInputRef}
                id="import-file-input"
                type="file"
                accept="application/json"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportFile(file);
                }}
              />
            </label>
          </div>
          {importError && <p className="mt-3 text-[13px] text-red">{importError}</p>}
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-[13px] font-semibold text-tx1">Appearance</h2>
          <SegmentedControl
            aria-label="Theme"
            value={theme}
            onChange={handleThemeChange}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-[13px] font-semibold text-tx1">Keyboard shortcuts</h2>
          <div className="flex flex-col gap-2">
            {SHORTCUTS.map((s) => (
              <div key={s.action} className="flex items-center justify-between">
                <span className="text-[13px] text-tx2">{s.action}</span>
                <span className="rounded-md border border-border bg-elevated px-1.75 py-0.75 font-mono text-[11px] text-tx1">
                  {s.key}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-[13px] font-semibold text-tx1">About</h2>
          <a
            href="https://github.com/rikky-hermanto/streak-map"
            target="_blank"
            rel="noreferrer"
            className="focus-ring text-[13px] text-tx1 underline"
          >
            View on GitHub
          </a>
          <p className="mt-1 text-[13px] text-tx2">MIT licensed · open source</p>
        </section>
      </div>
    </main>
  );
}
