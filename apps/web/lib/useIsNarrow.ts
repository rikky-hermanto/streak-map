'use client';

import { useEffect, useState } from 'react';

export const NARROW_QUERY = '(max-width: 639px)';

/**
 * Tracks whether the viewport is narrow enough to warrant the calendar layout.
 *
 * Returns `false` during SSR and on the first client paint, then syncs in an
 * effect. Rendering the wide layout for one frame is a deliberate trade: the
 * alternative — returning `null` until mounted — blanks the card and produces a
 * worse layout shift.
 */
export function useIsNarrow(): boolean {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(NARROW_QUERY);
    const sync = () => setIsNarrow(mql.matches);
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, []);

  return isNarrow;
}
