# Foundation (scaffold + core + store) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the pnpm/Turborepo monorepo scaffold, then build `packages/core` (pure domain
math: types, local date keys, streak math, brightness math) and `packages/store` (Dexie
persistence) with full test coverage — the working, testable foundation the UI plan builds on.

**Architecture:** Three-layer monorepo per the spec (`packages/core` → `packages/store` →
`apps/web`, not built in this plan). `core` is pure TypeScript with **zero runtime
dependencies** so a future CLI/iOS port can import it verbatim. `store` wraps Dexie
(IndexedDB) with a `[habitId+date]` compound index and depends on `core` for types only.
No UI in this plan — `apps/web` is a separate, later plan.

**Tech Stack:** pnpm workspaces + Turborepo, TypeScript `strict: true`, Vitest, Biome,
Dexie, `uuid` (v7 ids), GitHub Actions CI.

**Spec:** [docs/features/streak-map-spec.md](../../features/streak-map-spec.md) — read §3
(data model), §4 (brightness + streak math), §5 (tech stack, repo layout), §6.4 (CI) before
starting. [docs/features/prototypes/implementation.md](../../features/prototypes/implementation.md)
is the UI design handoff for the *next* plan — not needed for this one, but its "State
Management" and "Contribution grid" sections describe what `core`/`store` must be able to
answer, and are useful cross-checks.

## Global Constraints

- **Day keys are local `YYYY-MM-DD` strings, never derived via UTC.** Never call
  `.toISOString()`, `new Date(dateKeyString)`, or any `Date.UTC*` method to produce or parse a
  `DateKey`. Always construct/read local components (`getFullYear`/`getMonth`/`getDate`,
  `new Date(y, m-1, d)`). This is spec §3.2 — the single most important invariant in this repo.
- **`createdAt`/`updatedAt`/`deletedAt`/`archivedAt` are the opposite: real ISO **instant**
  timestamps, generated via `new Date().toISOString()` (UTC is correct and intentional here).
  Do not "fix" these to be local — they are sync metadata, not calendar days. Do not confuse
  this rule with the one above; they apply to disjoint sets of fields.
- **`packages/core/package.json` has zero entries under `dependencies`, full stop** — enforced
  by `.claude/hooks/core-purity.sh` (blocks any edit that adds one) and by this plan's own CI
  (Task 5). This is stricter than it first looks:
  - **Ruling (deviates from the spec's prose):** spec §5.1 lists `schema.ts` (Zod-based) and
    the tech-stack table assigns **date-fns** to date math — both would require a runtime
    dependency inside `core`, which the hook and CLAUDE.md flatly forbid (CLAUDE.md: "CI
    asserts `packages/core/package.json` has no `dependencies`"). This plan resolves the
    contradiction in favor of the hard-enforced rule: **`packages/core/src/dates.ts` hand-rolls
    its local-date arithmetic with plain `Date` methods — no date-fns.** Zod/`schema.ts` is out
    of scope for this plan entirely; it will live in `apps/web` in the export/import plan,
    consuming `core`'s plain TS types. If you disagree with this ruling, it's cheap to revisit
    before the UI plan is written — flag it in review rather than silently reintroducing the
    dependency.
  - `packages/store` has **no** purity constraint — `dexie` and `uuid` as real `dependencies`
    there are correct and expected.
  - uuid v7 generation happens in `packages/store` (at record-creation time), never in `core`.
    `core` only declares the `id: string` field on the types.
- **`SCALE_FLOOR = 4`** is a named exported constant in `brightness.ts`, never an inline
  literal (spec §4.2).
- **Streak grace rule:** build today's bucket into the sequence only if it is already
  satisfied; if unsatisfied, drop it entirely (neither breaks `currentStreak` nor counts as a
  failure in `longestStreak`). See Task 3 for the exact algorithm — this is the one place in
  the spec (§4.3) that's under-specified for weekly habits, and Task 3 documents the
  generalization chosen.
- **Dexie compound index `[habitId+date]`** (spec §3.3) is how both "one habit's window" and
  "does this habit have a row on this day" queries stay O(log n) and how the one-row-per-day
  invariant is enforced — always query/write through it, never scan-and-filter in JS.
- **Exact dependency versions, never ranges.** Task 1 creates a root `.npmrc` with
  `save-exact=true`. Every dependency in this plan is added by running `pnpm add [-D] <pkg>`
  (per-package, via `--filter` or `cd`-ing into the package directory) and letting pnpm resolve
  and pin the current version — never hand-type a version number or a `^`/`~` range into a
  `package.json`.
- **No build step for `core`/`store` in this plan.** Both are consumed as TypeScript source via
  each package's `exports` field; there is no `tsc` emit, no `dist/`. `apps/web` (a later plan)
  wires up Next.js `transpilePackages` to consume them directly. `pnpm build` (via
  `turbo run build`) is expected to no-op successfully in this plan — that's correct, not a bug.
- TypeScript `strict: true` everywhere (CLAUDE.md).
- Conventional Commits, one commit per task step group as specified.
- This plan does **not** touch README, CONTRIBUTING, issue templates, deployment, or git
  push/remote — those are explicitly out of scope (spec build-order step 7, excluded by the
  human partner up front).

---

### Task 1: Monorepo tooling scaffold

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `.npmrc`
- Create: `package.json` (root)
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `biome.json` (via `biome init`, then edited)
- Create: `.node-version`
- Modify: `.gitignore` (add `.turbo/`)

**Interfaces:**
- Consumes: nothing (first task).
- Produces: the workspace root every later task's `package.json` extends/references —
  `tsconfig.base.json` (extended by every package's `tsconfig.json`), the root `dev`/`build`/
  `typecheck`/`test`/`biome` scripts, and `.npmrc`'s `save-exact=true` (governs every later
  `pnpm add`).

- [ ] **Step 1: Create the workspace and npm config**

`pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

`.npmrc`:
```
save-exact=true
```

- [ ] **Step 2: Create the root package.json**

```json
{
  "name": "streak-map",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "biome": "biome",
    "check:core-purity": "node scripts/check-core-purity.mjs"
  }
}
```

(The `check:core-purity` script is wired up in Task 5 — the script file doesn't exist yet,
which is fine; it's only invoked, not validated, in this step.)

- [ ] **Step 3: Install root tooling**

Run:
```bash
pnpm add -D -w turbo @biomejs/biome
```

Expected: creates `pnpm-lock.yaml`, adds both packages under root `devDependencies` in
`package.json` with **exact** versions (no `^`), and `node_modules/`.

- [ ] **Step 4: Detect and pin the node + pnpm versions actually installed**

Run:
```bash
node --version
pnpm --version
```

Write the node major version (digits only, no `v` prefix, e.g. `22`) to `.node-version`.

Add a `packageManager` field to root `package.json` using the exact pnpm version printed above,
e.g. `"packageManager": "pnpm@9.15.0"` (use whatever version you actually saw — do not guess).

- [ ] **Step 5: Generate and configure Biome**

Run:
```bash
pnpm exec biome init
```

This writes `biome.json` (or `biome.jsonc`) matching the installed Biome version's schema. Open
it and set:
- `formatter.enabled` = `true`, `formatter.indentStyle` = `"space"`, `formatter.indentWidth` = `2`, `formatter.lineWidth` = `100`
- `javascript.formatter.quoteStyle` = `"single"`, `javascript.formatter.semicolons` = `"always"`
- `linter.enabled` = `true`, `linter.rules.recommended` = `true`
- `organizeImports.enabled` = `true` (if present in the generated schema)
- `files.ignore` (or `files.includes` with negation, depending on the generated schema shape)
  covering `**/.next/**`, `**/dist/**`, `**/node_modules/**`, `**/.turbo/**`

- [ ] **Step 6: Create the base tsconfig**

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true
  }
}
```

- [ ] **Step 7: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

- [ ] **Step 8: Ignore Turborepo's cache directory**

Add to `.gitignore` (near the existing pnpm section):
```
# turborepo
.turbo/
```

- [ ] **Step 9: Verify**

Run:
```bash
pnpm install
pnpm exec biome --version
pnpm exec turbo --version
pnpm typecheck
pnpm build
pnpm test
```

Expected: `pnpm install` succeeds with no lockfile changes (already installed in Step 3);
`biome --version`/`turbo --version` print version strings; `typecheck`/`build`/`test` all
succeed trivially (turbo finds zero packages with those scripts yet — that's correct, not a
failure).

- [ ] **Step 10: Commit**

```bash
git add pnpm-workspace.yaml .npmrc package.json turbo.json tsconfig.base.json biome.json* .node-version .gitignore pnpm-lock.yaml
git commit -m "chore: initialize monorepo tooling (pnpm, turbo, biome, tsconfig)"
```

---

### Task 2: packages/core — types & local date-key math

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/vitest.config.ts`
- Create: `packages/core/src/types.ts`
- Create: `packages/core/src/dates.ts`
- Create: `packages/core/src/dates.test.ts`
- Create: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: `tsconfig.base.json` (Task 1).
- Produces (used by Tasks 3, 4, and every future task that touches dates/types):
  - Types: `DateKey`, `Interval`, `Habit`, `CheckIn`
  - Functions: `dateKeyFromDate(date: Date): DateKey`, `todayKey(now?: Date): DateKey`,
    `dateFromDateKey(key: DateKey): Date`, `addDaysToKey(key: DateKey, amount: number): DateKey`,
    `startOfWeekMonday(key: DateKey): DateKey`,
    `enumerateDateKeys(startKey: DateKey, endKey: DateKey): DateKey[]`,
    `enumerateWeekStartKeys(startKey: DateKey, endKey: DateKey): DateKey[]`,
    `trailingWindowKeys(endKey: DateKey, days: number): DateKey[]`

- [ ] **Step 1: Scaffold the package**

`packages/core/package.json`:
```json
{
  "name": "@streak-map/core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  }
}
```

`packages/core/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}
```

`packages/core/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

Run:
```bash
pnpm add -D typescript vitest --filter @streak-map/core
```

Expected: `packages/core/package.json` now has a `devDependencies` block with exact versions
for `typescript` and `vitest`; `dependencies` remains **absent or empty** — do not add anything
there.

- [ ] **Step 2: Write types.ts**

`packages/core/src/types.ts`:
```ts
/** A calendar day key in LOCAL time: "YYYY-MM-DD". Never a timestamp, never UTC-derived. */
export type DateKey = string;

export type Interval = 'daily' | 'weekly';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  color: string;
  interval: Interval;
  target: number;
  startDate: DateKey;
  order: number;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

/**
 * One row per (habitId, date). `count` holds the number of completions that day rather than
 * one row per completion event, so a 365-day grid query is a single indexed range scan.
 */
export interface CheckIn {
  id: string;
  habitId: string;
  date: DateKey;
  count: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
```

- [ ] **Step 3: Write the failing tests for dates.ts**

`packages/core/src/dates.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  addDaysToKey,
  dateKeyFromDate,
  enumerateDateKeys,
  enumerateWeekStartKeys,
  startOfWeekMonday,
  todayKey,
  trailingWindowKeys,
} from './dates';

describe('dateKeyFromDate', () => {
  it('formats a local date as zero-padded YYYY-MM-DD', () => {
    expect(dateKeyFromDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(dateKeyFromDate(new Date(2026, 7, 19))).toBe('2026-08-19');
  });
});

describe('todayKey', () => {
  it('derives the key from local date fields, not UTC, regardless of TZ', () => {
    const originalTz = process.env.TZ;
    process.env.TZ = 'Pacific/Kiritimati'; // UTC+14 — maximizes chance of catching UTC drift
    try {
      // A fixed local wall-clock moment: Aug 19, 2026, 23:30 local time.
      const localMoment = new Date(2026, 7, 19, 23, 30);
      expect(todayKey(localMoment)).toBe('2026-08-19');
    } finally {
      process.env.TZ = originalTz;
    }
  });
});

describe('addDaysToKey', () => {
  it('adds days forward across a month boundary', () => {
    expect(addDaysToKey('2026-01-30', 3)).toBe('2026-02-02');
  });

  it('subtracts days backward across a year boundary', () => {
    expect(addDaysToKey('2026-01-01', -1)).toBe('2025-12-31');
  });
});

describe('startOfWeekMonday', () => {
  it('returns the Monday of the week for a mid-week date', () => {
    // 2026-08-19 is a Wednesday.
    expect(startOfWeekMonday('2026-08-19')).toBe('2026-08-17');
  });

  it('returns the same date when already a Monday', () => {
    expect(startOfWeekMonday('2026-08-17')).toBe('2026-08-17');
  });

  it('rolls a Sunday back to the preceding Monday, not forward', () => {
    expect(startOfWeekMonday('2026-08-23')).toBe('2026-08-17');
  });
});

describe('enumerateDateKeys', () => {
  it('returns an inclusive range', () => {
    expect(enumerateDateKeys('2026-08-17', '2026-08-19')).toEqual([
      '2026-08-17',
      '2026-08-18',
      '2026-08-19',
    ]);
  });

  it('returns an empty array when end is before start', () => {
    expect(enumerateDateKeys('2026-08-19', '2026-08-17')).toEqual([]);
  });
});

describe('enumerateWeekStartKeys', () => {
  it('returns one Monday key per week spanned by the range', () => {
    // Aug 17 (Mon) through Aug 26 (Wed) spans the weeks starting Aug 17 and Aug 24.
    expect(enumerateWeekStartKeys('2026-08-17', '2026-08-26')).toEqual([
      '2026-08-17',
      '2026-08-24',
    ]);
  });
});

describe('trailingWindowKeys', () => {
  it('returns exactly N keys ending at the given key', () => {
    const keys = trailingWindowKeys('2026-08-19', 5);
    expect(keys).toEqual([
      '2026-08-15',
      '2026-08-16',
      '2026-08-17',
      '2026-08-18',
      '2026-08-19',
    ]);
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `pnpm --filter @streak-map/core test`
Expected: FAIL — `dates.ts` does not exist yet.

- [ ] **Step 5: Implement dates.ts**

`packages/core/src/dates.ts`:
```ts
import type { DateKey } from './types';

export function dateKeyFromDate(date: Date): DateKey {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayKey(now: Date = new Date()): DateKey {
  return dateKeyFromDate(now);
}

export function dateFromDateKey(key: DateKey): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDaysToKey(key: DateKey, amount: number): DateKey {
  const date = dateFromDateKey(key);
  date.setDate(date.getDate() + amount);
  return dateKeyFromDate(date);
}

export function startOfWeekMonday(key: DateKey): DateKey {
  const date = dateFromDateKey(key);
  const day = date.getDay(); // 0 = Sunday .. 6 = Saturday, local
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);
  return dateKeyFromDate(date);
}

export function enumerateDateKeys(startKey: DateKey, endKey: DateKey): DateKey[] {
  if (startKey > endKey) return [];
  const keys: DateKey[] = [];
  let cursor = startKey;
  while (cursor <= endKey) {
    keys.push(cursor);
    cursor = addDaysToKey(cursor, 1);
  }
  return keys;
}

export function enumerateWeekStartKeys(startKey: DateKey, endKey: DateKey): DateKey[] {
  const firstWeek = startOfWeekMonday(startKey);
  const lastWeek = startOfWeekMonday(endKey);
  const weeks: DateKey[] = [];
  let cursor = firstWeek;
  while (cursor <= lastWeek) {
    weeks.push(cursor);
    cursor = addDaysToKey(cursor, 7);
  }
  return weeks;
}

export function trailingWindowKeys(endKey: DateKey, days: number): DateKey[] {
  return enumerateDateKeys(addDaysToKey(endKey, -(days - 1)), endKey);
}
```

Note: `enumerateDateKeys`/`enumerateWeekStartKeys` compare `DateKey` strings directly with
`<`/`<=` — this is safe and intentional: `YYYY-MM-DD` strings sort lexicographically in exactly
calendar order, so no `Date` parsing is needed for ordering comparisons, only for arithmetic.

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter @streak-map/core test`
Expected: PASS, all tests green.

- [ ] **Step 7: Create the barrel export**

`packages/core/src/index.ts`:
```ts
export * from './types';
export * from './dates';
```

- [ ] **Step 8: Typecheck**

Run: `pnpm --filter @streak-map/core typecheck`
Expected: PASS, no errors.

- [ ] **Step 9: Commit**

```bash
git add packages/core/package.json packages/core/tsconfig.json packages/core/vitest.config.ts packages/core/src/types.ts packages/core/src/dates.ts packages/core/src/dates.test.ts packages/core/src/index.ts pnpm-lock.yaml
git commit -m "feat(core): habit and check-in types with local date-key math"
```

---

### Task 3: packages/core — streak math

**Files:**
- Create: `packages/core/src/streaks.ts`
- Create: `packages/core/src/streaks.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes (from Task 2): `DateKey`, `Interval` types;
  `enumerateDateKeys`, `enumerateWeekStartKeys`, `addDaysToKey`, `todayKey` functions.
- Produces (used by the future UI plan's stats display):
  `HabitStreakInput`, `StreakStats`, `computeStreakStats(input: HabitStreakInput, today?: DateKey): StreakStats`

**The grace-rule generalization used here** (spec §4.3 states it in daily terms only — this is
the documented ruling for weekly habits): build the chronological sequence of interval
"buckets" (one per day for daily habits, one per Monday-start week for weekly habits) from
`startDate` through `today`. If the **last** bucket (the one containing today) is unsatisfied,
drop it from the sequence entirely before computing streaks — it isn't a break, and it isn't a
success yet, it simply doesn't exist for streak-run purposes until it's satisfied or has fully
elapsed. If it's already satisfied, keep it — checking in today can extend the streak the same
day. This makes `currentStreak` "trailing consecutive satisfied buckets" and `longestStreak`
"longest consecutive run" both operate on the same de-graced sequence.

- [ ] **Step 1: Write the failing tests**

`packages/core/src/streaks.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { computeStreakStats } from './streaks';
import type { HabitStreakInput } from './streaks';

const daily = (counts: Record<string, number>, startDate = '2026-08-01'): HabitStreakInput => ({
  interval: 'daily',
  target: 1,
  startDate,
  counts,
});

describe('computeStreakStats — grace rule', () => {
  it('applies the grace rule: an unsatisfied today does not break the streak', () => {
    const stats = computeStreakStats(
      daily({
        '2026-08-17': 1,
        '2026-08-18': 1,
        // 2026-08-19 (today) has no check-in yet
      }),
      '2026-08-19',
    );
    expect(stats.currentStreak).toBe(2);
  });

  it('extends the current streak the same day once today is satisfied', () => {
    const stats = computeStreakStats(
      daily({
        '2026-08-18': 1,
        '2026-08-19': 1,
      }),
      '2026-08-19',
    );
    expect(stats.currentStreak).toBe(2);
  });

  it('breaks the streak once a full unsatisfied day has fully elapsed', () => {
    const stats = computeStreakStats(
      daily({
        '2026-08-16': 1,
        // 2026-08-17: unsatisfied and already elapsed — breaks the run
        '2026-08-18': 1,
        '2026-08-19': 1,
      }),
      '2026-08-19',
    );
    expect(stats.currentStreak).toBe(2); // only the trailing 08-18, 08-19 run
  });
});

describe('computeStreakStats — longestStreak', () => {
  it('finds the longest run even when it is not the current run', () => {
    const stats = computeStreakStats(
      daily({
        '2026-08-01': 1,
        '2026-08-02': 1,
        '2026-08-03': 1,
        '2026-08-04': 1,
        // gap
        '2026-08-10': 1,
      }),
      '2026-08-10',
    );
    expect(stats.longestStreak).toBe(4);
    expect(stats.currentStreak).toBe(1);
  });
});

describe('computeStreakStats — weekly habits', () => {
  it('satisfies a weekly bucket by summing counts across the week', () => {
    // Week of Mon 2026-08-17..Sun 2026-08-23, target 3/week.
    const input: HabitStreakInput = {
      interval: 'weekly',
      target: 3,
      startDate: '2026-08-17',
      counts: {
        '2026-08-17': 1,
        '2026-08-19': 2, // total 3 this week — satisfied
      },
    };
    const stats = computeStreakStats(input, '2026-08-19');
    expect(stats.currentStreak).toBe(1);
  });
});

describe('computeStreakStats — totalActiveDays', () => {
  it('counts distinct days with at least one check-in, independent of target/interval', () => {
    const stats = computeStreakStats(
      {
        interval: 'weekly',
        target: 5,
        startDate: '2026-08-17',
        counts: { '2026-08-17': 1, '2026-08-18': 1 }, // 2 active days, week unsatisfied
      },
      '2026-08-19',
    );
    expect(stats.totalActiveDays).toBe(2);
  });
});

describe('computeStreakStats — completionRate', () => {
  it('divides satisfied intervals by elapsed intervals', () => {
    const stats = computeStreakStats(
      daily({ '2026-08-01': 1, '2026-08-02': 1 }, '2026-08-01'),
      '2026-08-04', // 4 elapsed daily intervals, 2 satisfied
    );
    expect(stats.completionRate).toBeCloseTo(0.5);
  });

  it('is 0, not NaN, for a habit with zero elapsed history', () => {
    const stats = computeStreakStats(daily({}, '2026-08-19'), '2026-08-19');
    expect(stats.completionRate).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.longestStreak).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @streak-map/core test -- streaks`
Expected: FAIL — `streaks.ts` does not exist yet.

- [ ] **Step 3: Implement streaks.ts**

`packages/core/src/streaks.ts`:
```ts
import { addDaysToKey, enumerateDateKeys, enumerateWeekStartKeys, todayKey } from './dates';
import type { DateKey, Interval } from './types';

export interface HabitStreakInput {
  interval: Interval;
  target: number;
  startDate: DateKey;
  counts: Record<DateKey, number>;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  completionRate: number;
}

interface Bucket {
  key: DateKey;
  satisfied: boolean;
}

function sumCountsInBucket(
  counts: Record<DateKey, number>,
  bucketKey: DateKey,
  interval: Interval,
): number {
  if (interval === 'daily') return counts[bucketKey] ?? 0;
  const days = enumerateDateKeys(bucketKey, addDaysToKey(bucketKey, 6));
  return days.reduce((sum, day) => sum + (counts[day] ?? 0), 0);
}

function bucketize(input: HabitStreakInput, today: DateKey): Bucket[] {
  if (input.startDate > today) return [];
  const bucketKeys =
    input.interval === 'daily'
      ? enumerateDateKeys(input.startDate, today)
      : enumerateWeekStartKeys(input.startDate, today);

  return bucketKeys.map((key) => ({
    key,
    satisfied: sumCountsInBucket(input.counts, key, input.interval) >= input.target,
  }));
}

export function computeStreakStats(
  input: HabitStreakInput,
  today: DateKey = todayKey(),
): StreakStats {
  const buckets = bucketize(input, today);

  // Grace rule: an unsatisfied "today" bucket is dropped entirely — it neither breaks the
  // streak nor counts as a failure, it just hasn't happened yet.
  const effective =
    buckets.length > 0 && !buckets[buckets.length - 1].satisfied ? buckets.slice(0, -1) : buckets;

  let currentStreak = 0;
  for (let i = effective.length - 1; i >= 0; i--) {
    if (!effective[i].satisfied) break;
    currentStreak++;
  }

  let longestStreak = 0;
  let run = 0;
  for (const bucket of effective) {
    run = bucket.satisfied ? run + 1 : 0;
    longestStreak = Math.max(longestStreak, run);
  }

  const totalActiveDays = enumerateDateKeys(input.startDate, today).filter(
    (day) => (input.counts[day] ?? 0) > 0,
  ).length;

  const satisfiedCount = buckets.filter((b) => b.satisfied).length;
  const completionRate = buckets.length === 0 ? 0 : satisfiedCount / buckets.length;

  return { currentStreak, longestStreak, totalActiveDays, completionRate };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @streak-map/core test -- streaks`
Expected: PASS, all tests green. Also confirm the CLAUDE.md-documented filter works:
`pnpm --filter @streak-map/core test -- -t "grace rule"` should run only the grace-rule
`describe` block and pass.

- [ ] **Step 5: Update the barrel export**

`packages/core/src/index.ts` — add:
```ts
export * from './streaks';
```
(full file now exports `./types`, `./dates`, `./streaks`)

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter @streak-map/core typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/streaks.ts packages/core/src/streaks.test.ts packages/core/src/index.ts
git commit -m "feat(core): streak math with the today-grace rule"
```

---

### Task 4: packages/core — brightness math

**Files:**
- Create: `packages/core/src/brightness.ts`
- Create: `packages/core/src/brightness.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes (from Task 2): `DateKey` type.
- Produces (used by the future UI plan's grid rendering):
  `SCALE_FLOOR`, `perHabitLevel(count: number, target: number): number`,
  `AggregateDayTotal`, `aggregateLevels(days: AggregateDayTotal[]): Map<DateKey, number>`

**Note for whoever writes the UI plan:** `aggregateLevels` is a pure function over
pre-summed daily totals — it has no concept of habits, archival, or deletion. The exclusion of
archived/deleted habits from the aggregate totals (spec §4.2, "all non-archived habits") is a
**store-layer** query concern, implemented in Task 6's `getAggregateTotalsInRange`, not here.

- [ ] **Step 1: Write the failing tests**

`packages/core/src/brightness.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { SCALE_FLOOR, aggregateLevels, perHabitLevel } from './brightness';

describe('perHabitLevel', () => {
  it('is 0 when count is 0', () => {
    expect(perHabitLevel(0, 4)).toBe(0);
  });

  it('produces levels 1-4 at the exact ceil boundaries for target=4', () => {
    expect(perHabitLevel(1, 4)).toBe(1);
    expect(perHabitLevel(2, 4)).toBe(2);
    expect(perHabitLevel(3, 4)).toBe(3);
    expect(perHabitLevel(4, 4)).toBe(4);
  });

  it('clamps overshoot at 4, never exceeding it', () => {
    expect(perHabitLevel(9, 4)).toBe(4);
  });

  it('floors at level 1 for any nonzero count, however small relative to target', () => {
    expect(perHabitLevel(1, 20)).toBe(1);
  });
});

describe('aggregateLevels', () => {
  it('matches the spec worked example: peak=5, a 1-count day reads as level 1', () => {
    const levels = aggregateLevels([
      { date: '2026-08-18', total: 5 },
      { date: '2026-08-19', total: 1 },
    ]);
    expect(levels.get('2026-08-18')).toBe(4);
    expect(levels.get('2026-08-19')).toBe(1);
  });

  it('floors the peak at SCALE_FLOOR so a single early check-in is not full brightness', () => {
    expect(SCALE_FLOOR).toBe(4);
    const levels = aggregateLevels([
      { date: '2026-08-19', total: 1 },
      { date: '2026-08-18', total: 0 },
    ]);
    // peak = max(4, 1) = 4; intensity = 1/4 = 0.25; ceil(0.25*4) = 1, NOT 4.
    expect(levels.get('2026-08-19')).toBe(1);
  });

  it('is always level 0 for a zero-total day regardless of peak', () => {
    const levels = aggregateLevels([
      { date: '2026-08-18', total: 8 },
      { date: '2026-08-19', total: 0 },
    ]);
    expect(levels.get('2026-08-19')).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @streak-map/core test -- brightness`
Expected: FAIL — `brightness.ts` does not exist yet.

- [ ] **Step 3: Implement brightness.ts**

`packages/core/src/brightness.ts`:
```ts
import type { DateKey } from './types';

export const SCALE_FLOOR = 4;

export function perHabitLevel(count: number, target: number): number {
  if (count === 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((count / target) * 4)));
}

export interface AggregateDayTotal {
  date: DateKey;
  total: number;
}

export function aggregateLevels(days: AggregateDayTotal[]): Map<DateKey, number> {
  const peak = Math.max(SCALE_FLOOR, ...days.map((d) => d.total));
  const levels = new Map<DateKey, number>();
  for (const { date, total } of days) {
    if (total === 0) {
      levels.set(date, 0);
      continue;
    }
    const intensity = total / peak;
    levels.set(date, Math.min(4, Math.max(1, Math.ceil(intensity * 4))));
  }
  return levels;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @streak-map/core test -- brightness`
Expected: PASS, all tests green.

- [ ] **Step 5: Update the barrel export**

`packages/core/src/index.ts` — add:
```ts
export * from './brightness';
```

- [ ] **Step 6: Typecheck and full core test run**

Run:
```bash
pnpm --filter @streak-map/core typecheck
pnpm --filter @streak-map/core test
```
Expected: both PASS — this is the full `core` suite (types, dates, streaks, brightness)
together for the first time.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/brightness.ts packages/core/src/brightness.test.ts packages/core/src/index.ts
git commit -m "feat(core): per-habit and aggregate brightness math with SCALE_FLOOR"
```

---

### Task 5: CI workflow + core-purity check script

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `scripts/check-core-purity.mjs`

**Interfaces:**
- Consumes: Task 1's root scripts (`biome`, `typecheck`, `test`, `build`), Task 2's
  `packages/core/package.json` (the file this script inspects).
- Produces: the `pnpm check:core-purity` script invoked by CI (root script already declared
  in Task 1, Step 2).

This task mirrors, in CI, the same rule `.claude/hooks/core-purity.sh` already enforces at
edit-time locally (spec §6.4, item 6) — CI is the check that survives someone editing without
Claude Code's hooks active.

- [ ] **Step 1: Write the purity check script**

`scripts/check-core-purity.mjs`:
```js
#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pkgPath = fileURLToPath(new URL('../packages/core/package.json', import.meta.url));
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const deps = Object.keys(pkg.dependencies ?? {});

if (deps.length > 0) {
  console.error(
    `packages/core/package.json must have zero runtime dependencies (spec §5.1). Found: ${deps.join(', ')}`,
  );
  process.exit(1);
}

console.log('core purity check passed: packages/core has zero runtime dependencies.');
```

- [ ] **Step 2: Verify it passes against the current (clean) state**

Run: `node scripts/check-core-purity.mjs`
Expected: prints the success message, exits 0.

- [ ] **Step 3: Verify it fails on a violation, then confirm the repo is still clean**

Temporarily add a fake dependency to `packages/core/package.json` (e.g.
`"dependencies": { "left-pad": "1.0.0" }`), run the script again, confirm it exits non-zero with
the expected message naming `left-pad`, then **revert the file** (do not leave the fake
dependency in place — check `git diff packages/core/package.json` shows no changes before
moving on).

- [ ] **Step 4: Write the CI workflow**

`.github/workflows/ci.yml`:
```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: .node-version
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm biome ci .
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
      - run: pnpm check:core-purity
```

`pnpm/action-setup@v4` reads the root `package.json`'s `packageManager` field (set in Task 1)
to install the matching pnpm version automatically — no version pin needed here.

- [ ] **Step 5: Verify the CI steps locally**

Since this workflow only actually runs on GitHub Actions once pushed (out of scope for this
plan), verify each step's underlying command locally instead:
```bash
pnpm install --frozen-lockfile
pnpm biome ci .
pnpm typecheck
pnpm test
pnpm build
pnpm check:core-purity
```
Expected: every command exits 0.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/ci.yml scripts/check-core-purity.mjs
git commit -m "chore: add CI workflow and core-purity check script"
```

---

### Task 6: packages/store — Dexie schema & repository functions

**Files:**
- Create: `packages/store/package.json`
- Create: `packages/store/tsconfig.json`
- Create: `packages/store/vitest.config.ts`
- Create: `packages/store/vitest.setup.ts`
- Create: `packages/store/src/db.ts`
- Create: `packages/store/src/repository.ts`
- Create: `packages/store/src/repository.test.ts`
- Create: `packages/store/src/index.ts`

**Interfaces:**
- Consumes (from Task 2): `Habit`, `CheckIn`, `DateKey`, `Interval` types;
  `enumerateDateKeys` function.
- Produces (used by the future UI plan via `useLiveQuery`):
  - `StreakMapDB` class (Dexie subclass; tables `habits`, `checkins`, `meta`)
  - `createHabit(db, input: CreateHabitInput): Promise<Habit>`
  - `updateHabit(db, id, patch): Promise<void>`
  - `archiveHabit(db, id): Promise<void>`, `unarchiveHabit(db, id): Promise<void>`
  - `deleteHabit(db, id): Promise<void>` (soft delete)
  - `listHabits(db, options?: { includeArchived?: boolean }): Promise<Habit[]>`
  - `checkIn(db, habitId, date): Promise<void>` (unlimited increments)
  - `undoCheckIn(db, habitId, date): Promise<void>` (decrements; deletes row at 0)
  - `getCheckInsForHabitInRange(db, habitId, startKey, endKey): Promise<Record<DateKey, number>>`
    — **sparse**: only days with a row appear as keys; treat missing keys as 0.
  - `getAggregateTotalsInRange(db, startKey, endKey): Promise<{ date: DateKey; total: number }[]>`
    — **dense**: one entry per day in the range, zero-filled, archived/deleted habits excluded.

- [ ] **Step 1: Scaffold the package**

`packages/store/package.json`:
```json
{
  "name": "@streak-map/store",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@streak-map/core": "workspace:*"
  }
}
```

`packages/store/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}
```

`packages/store/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

`packages/store/vitest.setup.ts`:
```ts
import 'fake-indexeddb/auto';
```

Run:
```bash
pnpm add dexie uuid --filter @streak-map/store
pnpm add -D typescript vitest fake-indexeddb --filter @streak-map/store
pnpm install
```

Expected: `packages/store/package.json` now lists `@streak-map/core` (workspace:*), `dexie`,
`uuid` under `dependencies`, and `typescript`, `vitest`, `fake-indexeddb` under
`devDependencies`, all with exact versions except the workspace reference.

- [ ] **Step 2: Write the Dexie schema**

`packages/store/src/db.ts`:
```ts
import Dexie, { type Table } from 'dexie';
import type { CheckIn, Habit } from '@streak-map/core';

export interface MetaRow {
  key: string;
  value: unknown;
}

export class StreakMapDB extends Dexie {
  habits!: Table<Habit, string>;
  checkins!: Table<CheckIn, string>;
  meta!: Table<MetaRow, string>;

  constructor(name = 'streak-map') {
    super(name);
    this.version(1).stores({
      habits: 'id, order, archivedAt, deletedAt',
      checkins: 'id, habitId, date, [habitId+date], deletedAt',
      meta: 'key',
    });
  }
}
```

- [ ] **Step 3: Write the failing repository tests**

`packages/store/src/repository.test.ts`:
```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { StreakMapDB } from './db';
import {
  archiveHabit,
  checkIn,
  createHabit,
  deleteHabit,
  getAggregateTotalsInRange,
  getCheckInsForHabitInRange,
  listHabits,
  undoCheckIn,
  unarchiveHabit,
} from './repository';

let db: StreakMapDB;

beforeEach(() => {
  db = new StreakMapDB(`test-${crypto.randomUUID()}`);
});

describe('createHabit / listHabits', () => {
  it('assigns a uuid id and timestamps, then is listed', async () => {
    const habit = await createHabit(db, {
      name: 'Deep work',
      color: '#4B8A5E',
      interval: 'daily',
      target: 1,
      startDate: '2026-08-01',
    });

    expect(habit.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(habit.createdAt).toBe(habit.updatedAt);
    expect(habit.order).toBe(0);

    const habits = await listHabits(db);
    expect(habits).toHaveLength(1);
    expect(habits[0].id).toBe(habit.id);
  });
});

describe('checkIn / undoCheckIn', () => {
  it('increments unlimited times, then undo decrements, then deletes at 0', async () => {
    const habit = await createHabit(db, {
      name: 'Read',
      color: '#2ea043',
      interval: 'daily',
      target: 1,
      startDate: '2026-08-01',
    });

    await checkIn(db, habit.id, '2026-08-19');
    await checkIn(db, habit.id, '2026-08-19');
    await checkIn(db, habit.id, '2026-08-19');

    let counts = await getCheckInsForHabitInRange(db, habit.id, '2026-08-19', '2026-08-19');
    expect(counts['2026-08-19']).toBe(3);

    await undoCheckIn(db, habit.id, '2026-08-19');
    counts = await getCheckInsForHabitInRange(db, habit.id, '2026-08-19', '2026-08-19');
    expect(counts['2026-08-19']).toBe(2);

    await undoCheckIn(db, habit.id, '2026-08-19');
    await undoCheckIn(db, habit.id, '2026-08-19');
    // count reached 0 — the row is deleted, not stored as 0.
    counts = await getCheckInsForHabitInRange(db, habit.id, '2026-08-19', '2026-08-19');
    expect(counts['2026-08-19']).toBeUndefined();

    // undo below 0 is a no-op, not an error.
    await expect(undoCheckIn(db, habit.id, '2026-08-19')).resolves.toBeUndefined();
  });
});

describe('archiveHabit / unarchiveHabit / deleteHabit', () => {
  it('archived habits are excluded by default and included on request', async () => {
    const habit = await createHabit(db, {
      name: 'Old habit',
      color: '#888',
      interval: 'daily',
      target: 1,
      startDate: '2026-08-01',
    });
    await archiveHabit(db, habit.id);

    expect(await listHabits(db)).toHaveLength(0);
    expect(await listHabits(db, { includeArchived: true })).toHaveLength(1);

    await unarchiveHabit(db, habit.id);
    expect(await listHabits(db)).toHaveLength(1);
  });

  it('deleted habits never come back, even with includeArchived', async () => {
    const habit = await createHabit(db, {
      name: 'Gone',
      color: '#888',
      interval: 'daily',
      target: 1,
      startDate: '2026-08-01',
    });
    await deleteHabit(db, habit.id);

    expect(await listHabits(db)).toHaveLength(0);
    expect(await listHabits(db, { includeArchived: true })).toHaveLength(0);
  });
});

describe('getAggregateTotalsInRange', () => {
  it('sums non-archived habits per day, zero-filled, excluding archived habits', async () => {
    const a = await createHabit(db, {
      name: 'A',
      color: '#111',
      interval: 'daily',
      target: 1,
      startDate: '2026-08-17',
    });
    const b = await createHabit(db, {
      name: 'B',
      color: '#222',
      interval: 'daily',
      target: 1,
      startDate: '2026-08-17',
    });

    await checkIn(db, a.id, '2026-08-18');
    await checkIn(db, a.id, '2026-08-18');
    await checkIn(db, b.id, '2026-08-18');
    await checkIn(db, b.id, '2026-08-19');

    await archiveHabit(db, b.id);

    const totals = await getAggregateTotalsInRange(db, '2026-08-17', '2026-08-19');
    expect(totals).toEqual([
      { date: '2026-08-17', total: 0 },
      { date: '2026-08-18', total: 2 }, // only A's 2 check-ins — B is archived
      { date: '2026-08-19', total: 0 },
    ]);
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `pnpm --filter @streak-map/store test`
Expected: FAIL — `repository.ts` does not exist yet.

- [ ] **Step 5: Implement repository.ts**

`packages/store/src/repository.ts`:
```ts
import { enumerateDateKeys, type DateKey, type Habit, type Interval } from '@streak-map/core';
import { v7 as uuidv7 } from 'uuid';
import type { StreakMapDB } from './db';

export interface CreateHabitInput {
  name: string;
  description?: string;
  color: string;
  interval: Interval;
  target: number;
  startDate: DateKey;
}

export async function createHabit(db: StreakMapDB, input: CreateHabitInput): Promise<Habit> {
  const now = new Date().toISOString();
  const existingCount = await db.habits.filter((h) => h.deletedAt === undefined).count();
  const habit: Habit = {
    id: uuidv7(),
    name: input.name,
    description: input.description,
    color: input.color,
    interval: input.interval,
    target: input.target,
    startDate: input.startDate,
    order: existingCount,
    createdAt: now,
    updatedAt: now,
  };
  await db.habits.add(habit);
  return habit;
}

export async function updateHabit(
  db: StreakMapDB,
  id: string,
  patch: Partial<
    Pick<Habit, 'name' | 'description' | 'color' | 'interval' | 'target' | 'startDate' | 'order'>
  >,
): Promise<void> {
  await db.habits.update(id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function archiveHabit(db: StreakMapDB, id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.habits.update(id, { archivedAt: now, updatedAt: now });
}

export async function unarchiveHabit(db: StreakMapDB, id: string): Promise<void> {
  await db.habits.update(id, { archivedAt: undefined, updatedAt: new Date().toISOString() });
}

export async function deleteHabit(db: StreakMapDB, id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.habits.update(id, { deletedAt: now, updatedAt: now });
}

export async function listHabits(
  db: StreakMapDB,
  options: { includeArchived?: boolean } = {},
): Promise<Habit[]> {
  const { includeArchived = false } = options;
  return db.habits
    .filter((h) => h.deletedAt === undefined && (includeArchived || h.archivedAt === undefined))
    .sortBy('order');
}

export async function checkIn(db: StreakMapDB, habitId: string, date: DateKey): Promise<void> {
  await db.transaction('rw', db.checkins, async () => {
    const existing = await db.checkins.where('[habitId+date]').equals([habitId, date]).first();
    const now = new Date().toISOString();
    if (existing) {
      await db.checkins.update(existing.id, { count: existing.count + 1, updatedAt: now });
    } else {
      await db.checkins.add({
        id: uuidv7(),
        habitId,
        date,
        count: 1,
        createdAt: now,
        updatedAt: now,
      });
    }
  });
}

export async function undoCheckIn(db: StreakMapDB, habitId: string, date: DateKey): Promise<void> {
  await db.transaction('rw', db.checkins, async () => {
    const existing = await db.checkins.where('[habitId+date]').equals([habitId, date]).first();
    if (!existing) return;
    if (existing.count <= 1) {
      await db.checkins.delete(existing.id);
    } else {
      await db.checkins.update(existing.id, {
        count: existing.count - 1,
        updatedAt: new Date().toISOString(),
      });
    }
  });
}

export async function getCheckInsForHabitInRange(
  db: StreakMapDB,
  habitId: string,
  startKey: DateKey,
  endKey: DateKey,
): Promise<Record<DateKey, number>> {
  const rows = await db.checkins
    .where('[habitId+date]')
    .between([habitId, startKey], [habitId, endKey], true, true)
    .and((row) => row.deletedAt === undefined)
    .toArray();

  const result: Record<DateKey, number> = {};
  for (const row of rows) result[row.date] = row.count;
  return result;
}

export async function getAggregateTotalsInRange(
  db: StreakMapDB,
  startKey: DateKey,
  endKey: DateKey,
): Promise<{ date: DateKey; total: number }[]> {
  const activeHabits = await db.habits
    .filter((h) => h.deletedAt === undefined && h.archivedAt === undefined)
    .toArray();
  const activeIds = new Set(activeHabits.map((h) => h.id));

  const rows = await db.checkins
    .where('date')
    .between(startKey, endKey, true, true)
    .and((row) => row.deletedAt === undefined && activeIds.has(row.habitId))
    .toArray();

  const totals = new Map<DateKey, number>();
  for (const row of rows) {
    totals.set(row.date, (totals.get(row.date) ?? 0) + row.count);
  }

  return enumerateDateKeys(startKey, endKey).map((date) => ({
    date,
    total: totals.get(date) ?? 0,
  }));
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter @streak-map/store test`
Expected: PASS, all tests green. Pay particular attention to the "deletes at 0" and
"archived excluded from aggregate totals" assertions — confirm they actually exercised the
deletion/exclusion path rather than passing vacuously.

- [ ] **Step 7: Create the barrel export**

`packages/store/src/index.ts`:
```ts
export * from './db';
export * from './repository';
```

- [ ] **Step 8: Typecheck and full workspace verification**

Run:
```bash
pnpm --filter @streak-map/store typecheck
pnpm typecheck
pnpm test
pnpm biome ci .
pnpm check:core-purity
```
Expected: everything PASSES — this is the full foundation, verified together for the first
time (core + store + CI scripts, across the whole workspace).

- [ ] **Step 9: Commit**

```bash
git add packages/store/package.json packages/store/tsconfig.json packages/store/vitest.config.ts packages/store/vitest.setup.ts packages/store/src/db.ts packages/store/src/repository.ts packages/store/src/repository.test.ts packages/store/src/index.ts pnpm-lock.yaml
git commit -m "feat(store): dexie schema and repository with habitId+date compound index"
```
