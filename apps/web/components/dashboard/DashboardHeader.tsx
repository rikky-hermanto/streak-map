import Link from 'next/link';

interface DashboardHeaderProps {
  checkInsThisYear: number;
  year: number;
}

export function DashboardHeader({ checkInsThisYear, year }: DashboardHeaderProps) {
  return (
    <header className="mb-9 flex flex-wrap items-baseline justify-between gap-3">
      <div className="flex flex-wrap items-baseline gap-3.5">
        <h1 className="text-xl font-bold tracking-[-0.01em] text-tx1">streak-map</h1>
        <span className="font-mono text-[13px] text-tx2">
          {checkInsThisYear} check-ins in {year}
        </span>
      </div>
      <Link
        href="/settings"
        aria-label="Settings"
        className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-tx2 opacity-55 transition-opacity hover:bg-accent-s hover:opacity-100"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <circle cx="7.5" cy="7.5" r="6.2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </Link>
    </header>
  );
}
