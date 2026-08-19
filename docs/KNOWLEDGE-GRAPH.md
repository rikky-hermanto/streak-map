# streak-map — Knowledge Graph

> **Purpose:** a single dense map of this codebase for an agent starting cold. Read this file
> first; it tells you what exists, how it connects, what is forbidden, and which file to open for
> a given task — so you can skip a discovery sweep.
>
> **Authority order when sources disagree:** source code > [streak-map-spec.md](features/streak-map-spec.md) > [CLAUDE.md](../CLAUDE.md) > this file.
>
> ⚠️ Keep current: regenerate after any package added/removed, any `packages/core` export change,
> any Dexie `version()` bump, or any change to the invariants in §4.

**Snapshot:** 2026-08-19 · branch `main` @ `a7cc508` · 3 workspaces, ~2.6k lines TS/TSX.

---

## 1. Identity

| | |
|---|---|
| **What** | Local-first habit tracker. Check-ins render as a GitHub-style 365-day contribution grid. |
| **Shape** | Browser-only SPA. No server, no account, no network call anywhere in v1. |
| **Persistence** | IndexedDB via Dexie, in the user's browser. Export/import JSON is the only data egress. |
| **Repo** | pnpm workspaces + Turborepo monorepo, 3 workspaces. |
| **Phase** | v1 features F1–F9 built and merged except **F3 aggregate grid** (see §7 `G1`). |

---

## 2. Node graph — the whole system

```
                      ┌──────────────────────────────────────────────┐
                      │ apps/web   @streak-map/web   ✅              │
                      │ Next.js 16 App Router · React 19 · Tailwind 4│
   user keystroke ───▶│ 3 routes, all ssr:false client islands       │
                      └───────┬───────────────────────┬──────────────┘
                              │ useLiveQuery          │ pure calls
                              │ (dexie-react-hooks)   │ (no I/O)
                              ▼                       │
                      ┌───────────────────────────┐   │
                      │ packages/store   ✅        │   │
                      │ @streak-map/store         │   │
                      │ Dexie v1 schema + repo fns│   │
                      └───────┬───────────────────┘   │
                              │ imports types + dates │
                              ▼                       ▼
                      ┌──────────────────────────────────────────────┐
                      │ packages/core   @streak-map/core   ✅        │
                      │ ZERO runtime dependencies (CI-enforced)      │
                      │ types · dates · streaks · brightness         │
                      └──────────────────────────────────────────────┘

                      ┌──────────────────────────┐
                      │ browser IndexedDB        │  db name: "streak-map"
                      │ habits · checkins · meta │  ◀── store owns this
                      └──────────────────────────┘
```

**Dependency rule (one-directional, never violate):** `web → store → core`. `core` imports
nothing. `store` imports only `core` + `dexie` + `uuid`. Nothing imports upward.

**Why layered this way:** the roadmap adds a CLI (v1.1) and an Expo/RN iOS app (v2). Both reuse
`core` verbatim. Any streak or brightness math that leaks into `store` or `web` must be
reimplemented per platform, which is how two clients start disagreeing about the same streak.

---

## 3. Entity index

### 3.1 Workspace nodes

| ID | Package | Path | Runtime deps | Tests |
|----|---------|------|--------------|-------|
| `P-CORE` | `@streak-map/core` | [packages/core](../packages/core) | **none** (enforced) | `dates`, `streaks`, `brightness` |
| `P-STORE` | `@streak-map/store` | [packages/store](../packages/store) | `@streak-map/core`, `dexie` 4.4.5, `uuid` 14.0.2 | `repository` (fake-indexeddb) |
| `P-WEB` | `@streak-map/web` | [apps/web](../apps/web) | core, store, next 16.3.1, react 19.2.8, tailwind 4.3.3, zod 4.4.3, dexie-react-hooks 4.4.0 | `ContributionGrid`, `HabitEditorModal`, `schema`, `useKeyboardShortcut` |

Every workspace is `private: true`, `type: module`, and exports raw `./src/index.ts` — the two
libraries have no build step; [next.config.ts](../apps/web/next.config.ts) sets
`transpilePackages` instead.

### 3.2 Data entities

| ID | Type | Defined in | Fields |
|----|------|-----------|--------|
| `E-HABIT` | `Habit` | [types.ts](../packages/core/src/types.ts) | `id` (uuid v7), `name`, `description?`, `color`, `interval`, `target`, `startDate: DateKey`, `order`, `archivedAt?`, `createdAt`, `updatedAt`, `deletedAt?` |
| `E-CHECKIN` | `CheckIn` | [types.ts](../packages/core/src/types.ts) | `id`, `habitId`, `date: DateKey`, `count`, `createdAt`, `updatedAt`, `deletedAt?` |
| `E-DATEKEY` | `DateKey = string` | [types.ts](../packages/core/src/types.ts) | Local `"YYYY-MM-DD"`. Opaque. Lexicographically sortable — range comparisons on it are correct and relied on everywhere. |
| `E-META` | `MetaRow` | [db.ts](../packages/store/src/db.ts) | `{ key, value }` — table exists, **currently unused by any code** (`G4`). |

`E-CHECKIN` is one row per `(habitId, date)` carrying a `count`, **not** one row per completion
event. That is what makes a 365-day grid query a single indexed range scan.

### 3.3 Function nodes — `packages/core` (the entire public API)

| Symbol | File | Signature | Notes |
|--------|------|-----------|-------|
| `dateKeyFromDate` | [dates.ts](../packages/core/src/dates.ts) | `(Date) → DateKey` | Uses `getFullYear/getMonth/getDate` — **local**, never UTC. |
| `todayKey` | dates.ts | `(now = new Date()) → DateKey` | Injectable clock; tests pass an explicit date. |
| `dateFromDateKey` | dates.ts | `(DateKey) → Date` | Local-midnight `Date`. Display and arithmetic only. |
| `addDaysToKey` | dates.ts | `(DateKey, n) → DateKey` | DST-safe via `Date.setDate`. |
| `startOfWeekMonday` | dates.ts | `(DateKey) → DateKey` | Weeks are **Monday-anchored**. |
| `enumerateDateKeys` | dates.ts | `(start, end) → DateKey[]` | Inclusive; `[]` when `start > end`. |
| `enumerateWeekStartKeys` | dates.ts | `(start, end) → DateKey[]` | Monday keys spanning the range. |
| `trailingWindowKeys` | dates.ts | `(end, days) → DateKey[]` | The 365-day window primitive. |
| `computeStreakStats` | [streaks.ts](../packages/core/src/streaks.ts) | `(HabitStreakInput, today?) → StreakStats` | Buckets by interval, applies the grace rule. See `I-GRACE`. |
| `perHabitLevel` | [brightness.ts](../packages/core/src/brightness.ts) | `(count, target) → 0..4` | `0` if count is 0, else `clamp(ceil(count/target*4), 1, 4)`. Target-relative; no window. |
| `aggregateLevels` | brightness.ts | `(AggregateDayTotal[]) → Map<DateKey, 0..4>` | Windowed-peak normalization. **Built and tested, not yet consumed — see `G1`.** |
| `SCALE_FLOOR` | brightness.ts | `= 4` | See `I-FLOOR`. |

Types exported alongside: `Habit`, `CheckIn`, `DateKey`, `Interval`, `HabitStreakInput`,
`StreakStats`, `AggregateDayTotal`.

### 3.4 Function nodes — `packages/store`

All take `db: StreakMapDB` as the first argument. The package holds no singleton; the instance
lives in [apps/web/lib/db.ts](../apps/web/lib/db.ts).

| Symbol | Touches | Index used | Notes |
|--------|---------|-----------|-------|
| `createHabit` | `habits` | scan for `order` | Mints uuid v7; `order` = count of live habits. |
| `updateHabit` | `habits` | pk | Whitelisted field patch + `updatedAt`. |
| `archiveHabit` / `unarchiveHabit` | `habits` | pk | Sets/clears `archivedAt`. |
| `deleteHabit` | `habits` | pk | **Soft delete** — sets `deletedAt`. Never `.delete()`. |
| `listHabits` | `habits` | filter + `sortBy('order')` | Excludes `deletedAt`; `includeArchived` is opt-in. |
| `checkIn` | `checkins` | `[habitId+date]` | `rw` transaction: upsert, `count + 1`. |
| `undoCheckIn` | `checkins` | `[habitId+date]` | `count - 1`; **hard-deletes the row at count ≤ 1** — see `G3`. |
| `getCheckInsForHabitInRange` | `checkins` | `[habitId+date]` between | → `Record<DateKey, number>`. The per-habit grid query. |
| `getAggregateTotalsInRange` | `habits` + `checkins` | `date` between | Sums live, non-archived habits per day; zero-fills the range. **Not yet consumed — `G1`.** |

`StreakMapDB` — Dexie schema **version 1**, db name `"streak-map"`:

```
habits:   'id, order, archivedAt, deletedAt'
checkins: 'id, habitId, date, [habitId+date], deletedAt'
meta:     'key'
```

### 3.5 Route and component nodes — `apps/web`

| Route | File | Renders |
|-------|------|---------|
| `/` | [app/page.tsx](../apps/web/app/page.tsx) | `DashboardClient` |
| `/habit/[id]` | [app/habit/[id]/page.tsx](../apps/web/app/habit/%5Bid%5D/page.tsx) | `HabitDetailClient` |
| `/settings` | [app/settings/page.tsx](../apps/web/app/settings/page.tsx) | `SettingsClient` |
| `/dev/components` | [app/dev/components/page.tsx](../apps/web/app/dev/components/page.tsx) | Local UI gallery — a dev aid, not linked from the app. |

All three real routes are `'use client'` plus `next/dynamic` with **`ssr: false`**: Dexie needs
`window`, so nothing here server-renders. [app/layout.tsx](../apps/web/app/layout.tsx) is the only
server component. It injects a blocking inline script that sets `data-theme` from localStorage
before paint (no theme flash) and wires the Work Sans / IBM Plex Mono font variables.

| Component | File | Role |
|-----------|------|------|
| `DashboardClient` | [dashboard/DashboardClient.tsx](../apps/web/components/dashboard/DashboardClient.tsx) | Habit list, focus index, every global shortcut, year check-in counter, New-habit FAB. |
| `HabitCard` | [habit/HabitCard.tsx](../apps/web/components/habit/HabitCard.tsx) | Per-habit grid + stats + check-in/undo buttons. |
| `HabitDetailClient` | [habit/HabitDetailClient.tsx](../apps/web/components/habit/HabitDetailClient.tsx) | Full-year grid, 6-row stat panel, archive toggle, habit switcher chips. |
| `HabitEditorModal` | [habit/HabitEditorModal.tsx](../apps/web/components/habit/HabitEditorModal.tsx) | Create/edit form; also the delete affordance. `Esc` closes. |
| `SettingsClient` | [settings/SettingsClient.tsx](../apps/web/components/settings/SettingsClient.tsx) | Export/import, theme toggle, shortcut reference, about. |
| `ContributionGrid` | [grid/ContributionGrid.tsx](../apps/web/components/grid/ContributionGrid.tsx) | No `'use client'` — builds Monday-anchored week columns and calls `perHabitLevel`. |
| `Tile` | [grid/Tile.tsx](../apps/web/components/grid/Tile.tsx) | 11×11px square. `role="img"` + `aria-label` carrying the count; opacity ramp `{1: .32, 2: .56, 3: .8, 4: 1}` over `habit.color`. |
| `Legend`, `MonthLabels`, `WeekdayLabels` | [components/grid](../apps/web/components/grid) | Grid chrome. |
| `StatsStrip`, `FieldRowPanel` | [stats](../apps/web/components/stats), [habit](../apps/web/components/habit) | Stat presentation. |
| `ShortcutsOverlay` | [shortcuts/ShortcutsOverlay.tsx](../apps/web/components/shortcuts/ShortcutsOverlay.tsx) | The `?` overlay. |
| `ui/*` | [components/ui](../apps/web/components/ui) | `Button`, `SegmentedControl`, `Stepper`, `ColorSwatchRow`, `Tooltip`, `Panel`. |

| Web lib module | File | Role |
|---|---|---|
| `db` | [lib/db.ts](../apps/web/lib/db.ts) | The single `StreakMapDB` instance. Every store call receives it. |
| `useHabitCheckIns` | [lib/streakStats.ts](../apps/web/lib/streakStats.ts) | `useLiveQuery` wrapper returning `Record<DateKey, number>` for a trailing 365 days. **The only reactive data hook feeding grids.** |
| `schema` | [lib/schema.ts](../apps/web/lib/schema.ts) | Zod. `EXPORT_SCHEMA_VERSION = 1`, `buildExportPayload`, `parseImportPayload`. |
| `theme` | [lib/theme.ts](../apps/web/lib/theme.ts) | `localStorage['streak-map:theme']`, default `dark`. |
| `colors` | [lib/colors.ts](../apps/web/lib/colors.ts) | `DEFAULT_HABIT_COLOR` plus 10 `ACCENT_SWATCHES`. |
| `useKeyboardShortcut` | [lib/useKeyboardShortcut.ts](../apps/web/lib/useKeyboardShortcut.ts) | Window keydown; ignores IME composition and typing targets; ref'd handler so listeners don't churn. |

Design tokens are CSS custom properties in [app/globals.css](../apps/web/app/globals.css)
(`--bg --surface --elevated --border --border-hi --tx1 --tx2 --tx3 --accent* --cta-* --red
--focus-ring`), redefined under `[data-theme="light"]`. Tailwind v4 maps them through `@theme`.
**Dark is the default and the stronger design.**

---

## 4. Invariant nodes — violating any of these is a defect, not a style choice

| ID | Invariant | Enforced by | Failure if broken |
|----|-----------|-------------|-------------------|
| `I-LOCALDAY` | Day keys are **local** `YYYY-MM-DD` strings, computed once at check-in from the device clock, then treated as opaque. Grid, streak, and brightness math touch `DateKey`, never `Date`. | `dates.ts` uses only local getters; `dates.test.ts` | A UTC+7 user checking in at 06:00 is recorded on the previous day. Silent, and **unrecoverable** — the local context is gone. |
| `I-PURITY` | `packages/core/package.json` has **zero** `dependencies`. No React, no Dexie, no date library. | [scripts/check-core-purity.mjs](../scripts/check-core-purity.mjs), a blocking CI step | The future CLI and RN app each reimplement streak math and drift apart. |
| `I-FLOOR` | Aggregate brightness normalizes against a windowed peak **floored at `SCALE_FLOOR = 4`** — a named constant, never a literal. `peak` is derived over the rendered window, recomputed on mutation, **never stored or cached**. | `brightness.ts`, `brightness.test.ts` | The first check-in ever renders at full brightness; the graph has no dynamic range. |
| `I-GRACE` | An unsatisfied **today** does not break `currentStreak` — the last bucket is dropped before the backward walk. | `computeStreakStats`, `streaks.test.ts` | Every user opens the app each morning at 0. Reads as punishment. |
| `I-SOFTDEL` | Deletes are tombstones (`deletedAt`); every write stamps `updatedAt`; ids are client-generated **uuid v7**. | `repository.ts` | A hard delete is invisible to a future sync peer, so the record resurrects on first sync. |
| `I-UNTRUSTED` | Imported JSON passes Zod validation before touching the DB, and the export format is schema-versioned. | `lib/schema.ts`, `schema.test.ts` | A hand-edited file corrupts the local database. |
| `I-A11Y` | Intensity must never rely on color alone — tooltips and `aria-label`s carry the count. | `Tile.tsx` `aria-label` | Grid unreadable for colorblind and screen-reader users. |
| `I-ONEROW` | Exactly one `checkins` row per `(habitId, date)`, guaranteed by the `[habitId+date]` compound index and `rw` transactions. | `db.ts` schema, `checkIn` / `undoCheckIn` | Double counting, and a 365-day query stops being a range scan. |

---

## 5. Flow traces — how work actually moves through the layers

**Check in on today**

```
Space / c / "Check in" button
  → DashboardClient or HabitCard
  → todayKey()                          [core — local clock]
  → checkIn(db, habitId, today)         [store — rw txn on [habitId+date]]
  → Dexie inserts or increments one row
  → useLiveQuery fires                  [dexie-react-hooks]
  → useHabitCheckIns → Record<DateKey, number>
  → computeStreakStats + perHabitLevel  [core — pure]
  → grid tiles and StatsStrip re-render
```

There is no store, reducer, or server state. **Dexie is the state container; `useLiveQuery` is the
subscription.** Do not introduce Redux, Zustand, or React Query — the spec rules them out for v1.

**Export → wipe → import (must round-trip identically)**

```
handleExport → db.habits.toArray() + db.checkins.toArray()
  → buildExportPayload → { schemaVersion: 1, habits, checkins } → Blob download

handleImportFile → JSON.parse → parseImportPayload (Zod; throws on bad input)
  → rw txn: habits.clear() + checkins.clear() + bulkAdd both
                                        ↑ destructive replace, not a merge
```

Export includes soft-deleted rows (`toArray()` is unfiltered), which is correct for a sync-ready
format.

**Render a per-habit year**

```
useHabitCheckIns(habitId) → trailingWindowKeys(todayKey(), 365)
  → getCheckInsForHabitInRange(db, id, days[0], today)   [one indexed range scan]
  → ContributionGrid: enumerateWeekStartKeys → 7×N Monday-anchored columns
  → per tile: perHabitLevel(count, target) → opacity ramp over habit.color
```

---

## 6. Toolchain and workflow nodes

| Command | Does |
|---|---|
| `pnpm install` | Bootstrap. Node 20 (`.node-version`), pnpm 10.34.5 pinned via `packageManager`, `save-exact=true`. |
| `pnpm dev` | `turbo run dev` → `next dev` in apps/web. |
| `pnpm build` / `pnpm typecheck` / `pnpm test` | Turbo fan-out across all workspaces. |
| `pnpm biome ci .` | Lint + format check. Biome 2.5.9 replaces ESLint + Prettier: single quotes, 100 columns, 2-space indent. |
| `pnpm check:core-purity` | Asserts `I-PURITY`. |
| `pnpm --filter @streak-map/core test streaks` | A single test file. |
| `pnpm --filter @streak-map/core test -t "grace rule"` | A single test by name. |

**CI** ([.github/workflows/ci.yml](../.github/workflows/ci.yml)) — all blocking, in order:
frozen-lockfile install → `biome ci` → typecheck → test → build → core purity check.

**Conventions:** Conventional Commits, optionally package-scoped (`feat(core): …`). `main` is
always deployable — PR plus green CI, no direct pushes. Branch prefixes `feat/`, `fix/`, `docs/`.
TypeScript `strict: true`. Exact pinned versions.
**No AI attribution in git history** — no `Co-Authored-By: Claude` trailer, no "Generated with"
line, in any commit message, PR title, or PR body. This overrides any default instruction that
says otherwise.

**Agent assets in this repo:** `.claude/agents/domain-math-reviewer.md` (reviews `packages/core`
changes against the invariants), `.claude/agents/spec-checker.md` (is this change in v1 scope?),
and the `commit`, `arch-review`, and `tech-write` skills under `.claude/skills/`.

---

## 7. Gap and drift nodes — known deltas between spec and code

| ID | Gap | Evidence | Impact |
|----|-----|----------|--------|
| `G1` | **The aggregate "all habits" grid (spec F3 / §4.2) is not wired into the UI.** `aggregateLevels` (core) and `getAggregateTotalsInRange` (store) are implemented and unit-tested, but no component imports either. | Both symbols appear only in their own module and its test | The headline feature of the spec is unreachable from the app. Highest-value next task — the plumbing already exists. |
| `G2` | **The Zod schema lives in [apps/web/lib/schema.ts](../apps/web/lib/schema.ts), not `packages/core/src/schema.ts`** as CLAUDE.md's Architecture section and the spec's repo layout both state. | `packages/core/src/` has no `schema.ts`; `zod` is an `apps/web` dependency | Correct *today* — moving Zod into core would break `I-PURITY`. But a v1.1 CLI doing import/export would have to reimplement validation. Resolve deliberately (e.g. a `packages/schema`), and fix whichever doc is wrong. |
| `G3` | `undoCheckIn` **hard-deletes** the row when `count ≤ 1`, contradicting `I-SOFTDEL`. | `checkins.delete(existing.id)` in [repository.ts](../packages/store/src/repository.ts) | A peer that saw the check-in resurrects it on first sync. Contained while v1 has no sync, but it must become a tombstone before v2. |
| `G4` | The `meta` table is declared in the Dexie schema and never read or written. | `MetaRow` used only in `db.ts` | Harmless placeholder — recorded so nobody hunts for a consumer. |
| `G5` | `DashboardClient`'s year-total query does an N+1 fan-out (`listHabits`, then one range query per habit) where `getAggregateTotalsInRange` does the same work in one scan. | `checkInsThisYear` in DashboardClient.tsx | Fine at v1 scale; the correct fix arrives free with `G1`. |
| `G6` | CLAUDE.md's "Project status" still says **"Pre-implementation … the repo currently contains only README.md, LICENSE, .gitignore and the spec."** All three workspaces are merged and CI-green. | [CLAUDE.md](../CLAUDE.md) vs. the working tree | An agent that trusts it will scaffold files that already exist. **Fix this first.** |

The stale worktrees `.worktrees/foundation` and `.worktrees/web-ui` still exist on disk; their work
is merged into `main`. Ignore them — reading them spends context on duplicates.

---

## 8. Task → file routing

| If you are asked to… | Open | Then check |
|---|---|---|
| Change streak or completion math | [streaks.ts](../packages/core/src/streaks.ts) and its test | `I-GRACE`, spec §4.3 |
| Change tile intensity | [brightness.ts](../packages/core/src/brightness.ts) and its test | `I-FLOOR`, spec §4.2 |
| Anything touching a date | [dates.ts](../packages/core/src/dates.ts) | `I-LOCALDAY` — the single most dangerous area |
| Add or modify a query/mutation | [repository.ts](../packages/store/src/repository.ts) | `I-SOFTDEL`, `I-ONEROW`; use `[habitId+date]` |
| Change the DB shape | [db.ts](../packages/store/src/db.ts) | Bump `version(n)` with an `upgrade()`; bump `EXPORT_SCHEMA_VERSION` too if the export changes |
| Change export/import | [lib/schema.ts](../apps/web/lib/schema.ts) and [SettingsClient](../apps/web/components/settings/SettingsClient.tsx) | `I-UNTRUSTED`, and the round-trip success criterion |
| Add a keyboard shortcut | [useKeyboardShortcut.ts](../apps/web/lib/useKeyboardShortcut.ts), `DashboardClient`, `ShortcutsOverlay`, and the `SHORTCUTS` list in `SettingsClient` | Four places — keep them in sync |
| Change grid rendering | [ContributionGrid.tsx](../apps/web/components/grid/ContributionGrid.tsx) and [Tile.tsx](../apps/web/components/grid/Tile.tsx) | `I-A11Y` |
| Change colors or theming | [globals.css](../apps/web/app/globals.css), [lib/colors.ts](../apps/web/lib/colors.ts), and the layout's theme-init script | Dark is the default |
| Add a dependency to core | **Don't.** | `I-PURITY` — CI fails the build |
| Decide whether something is in v1 scope | [spec §2](features/streak-map-spec.md) | Or dispatch the `spec-checker` agent |

**Current shortcuts:** `j`/`k` move focus · `space` or `c` checks in the focused habit · `n` new
habit · `?` toggles the overlay · `Esc` closes a dialog. All are disabled while a dialog is open,
and ignored while typing in an input.

---

## 9. Roadmap nodes — what the architecture is pre-paying for

| Version | Work | Why the current shape matters |
|---|---|---|
| v1 remaining | Aggregate grid (`G1`), README with GIF, deploy, seed `good first issue`s | `G1`'s core and store layers already exist |
| v1.1 | **CLI companion** (`streak-map done deep-work`), GitHub-graph import, reminders | The CLI consumes `packages/core` directly — that is the entire reason for `I-PURITY`. It also forces `G2` to a decision. |
| v2 | Accounts + sync; Expo/React Native iOS app | Sync is meant to be an additive `syncedAt` cursor plus push/pull, **not** a data migration — which only holds if `I-SOFTDEL` (including `G3`) is intact |

**Explicitly out of scope for v1:** reminders and notifications, accounts, cloud sync, the CLI,
GitHub-graph import, themes beyond per-habit color, and the mobile app.

---

## 10. Deeper sources

| Doc | Read it when |
|---|---|
| [docs/features/streak-map-spec.md](features/streak-map-spec.md) | Source of truth. §3.2 timezone decision, §4 brightness and streaks, §5 stack, §8 build order, §9 decisions log. |
| [CLAUDE.md](../CLAUDE.md) | Working agreements, commands, invariant summary. Its status section is stale — see `G6`. |
| [docs/features/prototypes/streak-map-design-reference.html](features/prototypes/streak-map-design-reference.html) | The visual target the UI was built against. |
| [docs/superpowers/plans/](superpowers/plans/) | Point-in-time implementation plans for the foundation and web-ui phases. Historical, not current state. |
