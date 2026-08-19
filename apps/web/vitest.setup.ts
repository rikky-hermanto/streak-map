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
