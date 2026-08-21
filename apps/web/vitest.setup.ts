import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// @testing-library/react only self-registers its afterEach cleanup when `afterEach`
// exists as a global (see its source), which requires vitest's `test.globals: true`.
// This project keeps globals off (tests import from 'vitest' explicitly), so cleanup
// is wired up explicitly here instead — without it, DOM trees from earlier tests in
// the same file remain mounted and pollute later `screen` queries.
afterEach(() => {
  cleanup();
});

// jsdom does not implement matchMedia. Components use it to pick a layout, so
// provide a stub that reports "not narrow" — tests that need the narrow layout
// override window.matchMedia themselves.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  });
}
