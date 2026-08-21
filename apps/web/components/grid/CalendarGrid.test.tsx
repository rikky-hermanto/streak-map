import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CalendarGrid } from './CalendarGrid';

describe('CalendarGrid', () => {
  it('renders all seven weekday headers', () => {
    render(
      <CalendarGrid counts={{}} target={1} color="#4B8A5E" windowDays={14} today="2026-08-20" />,
    );
    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
      expect(screen.getByText(day)).toBeInTheDocument();
    }
  });

  it('renders one row per week, newest last', () => {
    const { container } = render(
      <CalendarGrid counts={{}} target={1} color="#4B8A5E" windowDays={14} today="2026-08-20" />,
    );
    // 2026-08-07..2026-08-20 spans the weeks beginning Aug 3 and Aug 10, plus
    // the partial week beginning Aug 17 that contains today.
    expect(container.querySelectorAll('[data-week]')).toHaveLength(3);
  });

  it('labels tiles with the count, preserving the shared aria-label wording', () => {
    render(
      <CalendarGrid
        counts={{ '2026-08-20': 2 }}
        target={4}
        color="#4B8A5E"
        windowDays={14}
        today="2026-08-20"
      />,
    );
    expect(screen.getByLabelText('2 check-ins on Aug 20, 2026')).toBeInTheDocument();
    expect(screen.getByLabelText('No check-ins on Aug 19, 2026')).toBeInTheDocument();
  });

  it('omits days outside the window rather than rendering them as zero-count tiles', () => {
    render(
      <CalendarGrid counts={{}} target={1} color="#4B8A5E" windowDays={14} today="2026-08-20" />,
    );
    // Aug 3 sits in the first rendered week but precedes the 14-day window.
    expect(screen.queryByLabelText('No check-ins on Aug 3, 2026')).not.toBeInTheDocument();
    // Aug 21 sits in the last rendered week but is in the future.
    expect(screen.queryByLabelText('No check-ins on Aug 21, 2026')).not.toBeInTheDocument();
  });

  it('heads each new month with a label row', () => {
    // 21 days ending 2026-03-05 spans 4 weeks beginning Feb 9, Feb 16, Feb 23, Mar 2.
    render(
      <CalendarGrid counts={{}} target={1} color="#4B8A5E" windowDays={21} today="2026-03-05" />,
    );
    expect(screen.getByText('Feb 2026')).toBeInTheDocument();
    expect(screen.getByText('Mar 2026')).toBeInTheDocument();
  });

  it('clamps a long window to the 12-week mobile default', () => {
    const { container } = render(
      <CalendarGrid counts={{}} target={1} color="#4B8A5E" windowDays={365} today="2026-08-20" />,
    );
    // 84 days ending on a Thursday spans 13 Monday-start weeks.
    expect(container.querySelectorAll('[data-week]')).toHaveLength(13);
  });
});
