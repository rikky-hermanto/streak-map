import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContributionGrid } from './ContributionGrid';

describe('ContributionGrid', () => {
  it('renders an aria-label for a zero-count day and a positive-count day', () => {
    render(
      <ContributionGrid
        counts={{ '2026-08-19': 3 }}
        target={4}
        color="#4B8A5E"
        windowDays={10}
        today="2026-08-19"
      />,
    );
    expect(screen.getByLabelText('3 check-ins on Aug 19, 2026')).toBeInTheDocument();
    expect(screen.getByLabelText('No check-ins on Aug 18, 2026')).toBeInTheDocument();
  });

  it('uses singular "check-in" for a count of exactly 1', () => {
    render(
      <ContributionGrid
        counts={{ '2026-08-19': 1 }}
        target={4}
        color="#4B8A5E"
        windowDays={5}
        today="2026-08-19"
      />,
    );
    expect(screen.getByLabelText('1 check-in on Aug 19, 2026')).toBeInTheDocument();
  });

  it("renders the trailing window's days count of tiles plus month/weekday labels, ending today", () => {
    render(
      <ContributionGrid
        counts={{}}
        target={1}
        color="#4B8A5E"
        windowDays={14}
        today="2026-08-19"
      />,
    );
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByLabelText('No check-ins on Aug 19, 2026')).toBeInTheDocument();
  });
});

function stubNarrow(matches: boolean) {
  vi.spyOn(window, 'matchMedia').mockReturnValue({
    matches,
    media: '',
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  } as unknown as MediaQueryList);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ContributionGrid layout switching', () => {
  it('renders the wide layout on a wide viewport', () => {
    stubNarrow(false);
    const { container } = render(
      <ContributionGrid
        counts={{}}
        target={1}
        color="#4B8A5E"
        windowDays={14}
        today="2026-08-20"
      />,
    );
    expect(container.querySelectorAll('[data-week]')).toHaveLength(0);
    expect(screen.queryByText('Tue')).not.toBeInTheDocument();
  });

  it('renders the calendar layout on a narrow viewport', () => {
    stubNarrow(true);
    const { container } = render(
      <ContributionGrid
        counts={{}}
        target={1}
        color="#4B8A5E"
        windowDays={14}
        today="2026-08-20"
      />,
    );
    expect(container.querySelectorAll('[data-week]').length).toBeGreaterThan(0);
    expect(screen.getByText('Tue')).toBeInTheDocument();
  });

  it('shows the legend in both layouts', () => {
    stubNarrow(true);
    render(
      <ContributionGrid
        counts={{}}
        target={1}
        color="#4B8A5E"
        windowDays={14}
        today="2026-08-20"
      />,
    );
    expect(screen.getByText('Less')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
  });
});
