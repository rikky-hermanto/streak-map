'use client';

import { useSyncExternalStore } from 'react';

export const NARROW_QUERY = '(max-width: 639px)';

/**
 * Tracks whether the viewport is narrow enough to warrant the calendar layout.
 *
 * Every real caller of `ContributionGrid` gates rendering behind Dexie's
 * `useLiveQuery` and returns `null` until data resolves, so this hook only ever
 * mounts client-side, after `matchMedia` is already answerable. `useSyncExternalStore`
 * reads the real value on the first render — no flash, no throwaway `WideGrid` mount.
 * `getServerSnapshot` returns `false` purely to satisfy SSR/hydration; it is never
 * what a real page load paints.
 */
function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia(NARROW_QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot(): boolean {
  return window.matchMedia(NARROW_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useIsNarrow(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
