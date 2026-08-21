import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useIsNarrow } from './useIsNarrow';

function Probe() {
  return <span>{useIsNarrow() ? 'narrow' : 'wide'}</span>;
}

function stubMatchMedia(matches: boolean) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  const mql = {
    matches,
    media: '',
    onchange: null,
    addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.delete(cb),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  };
  vi.spyOn(window, 'matchMedia').mockReturnValue(mql as unknown as MediaQueryList);
  return { mql, listeners };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useIsNarrow', () => {
  it('reports wide when the media query does not match', () => {
    stubMatchMedia(false);
    render(<Probe />);
    expect(screen.getByText('wide')).toBeInTheDocument();
  });

  it('reports narrow once mounted when the media query matches', () => {
    stubMatchMedia(true);
    render(<Probe />);
    expect(screen.getByText('narrow')).toBeInTheDocument();
  });

  it('subscribes to changes and unsubscribes on unmount', () => {
    const { listeners } = stubMatchMedia(false);
    const { unmount } = render(<Probe />);
    expect(listeners.size).toBe(1);
    unmount();
    expect(listeners.size).toBe(0);
  });
});
