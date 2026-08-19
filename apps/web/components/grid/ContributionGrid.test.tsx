import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
