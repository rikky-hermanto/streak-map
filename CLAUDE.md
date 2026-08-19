# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Pre-implementation. The repo currently contains only `README.md`, `LICENSE`, `.gitignore`, and
[docs/features/streak-map-spec.md](docs/features/streak-map-spec.md) — the approved MVP v1 spec.
**Read the spec before writing code**; it is the source of truth for the data model, the brightness
algorithm, and the build order. No source tree, package manifests, or lockfile exist yet, so the
commands below describe the intended toolchain rather than something already wired up. Update this
file as each piece lands.

## Commands (target toolchain: pnpm workspaces + Turborepo)

```bash
pnpm install            # bootstrap
pnpm dev                # run apps/web (Next.js App Router)
pnpm build              # turbo build
pnpm typecheck          # tsc --noEmit across the workspace
pnpm test               # vitest, all packages
pnpm biome ci .         # lint + format check (Biome replaces ESLint + Prettier)

pnpm --filter @streak-map/core test -- streaks          # single test file
pnpm --filter @streak-map/core test -- -t "grace rule"  # single test by name
```

CI (`.github/workflows/ci.yml`) runs, all blocking: frozen-lockfile install → `biome ci` →
typecheck → test → build → the **core purity check** (see below).

## Architecture

Three layers, deliberately separated because the roadmap adds a CLI (v1.1) and an Expo/RN iOS app (v2):

- `packages/core` — pure TypeScript domain logic: `types.ts`, `dates.ts`, `streaks.ts`,
  `brightness.ts`, `schema.ts` (Zod). **Zero runtime dependencies, no React, no Dexie.** CI asserts
  `packages/core/package.json` has no `dependencies`. Breaking this forces each platform to
  reimplement streak math, which is how two clients start disagreeing about the same streak.
- `packages/store` — persistence adapters. v1 is Dexie/IndexedDB; the compound index
  `[habitId+date]` is what the whole app leans on and it enforces one row per (habit, day).
- `apps/web` — Next.js + React + Tailwind, UI only. State comes from `useLiveQuery`
  (`dexie-react-hooks`) reading Dexie directly; there is no Redux/Zustand and no server state in v1.

Build order is core → store → UI. Core is fully testable headless, and that is where the real bugs are.

## Invariants that are easy to get wrong

- **Day keys are local `YYYY-MM-DD` strings, never timestamps.** Computed once at check-in time from
  the device clock, then treated as opaque strings. Deriving the day key with UTC math records a
  UTC+7 morning check-in on the previous day and silently breaks streaks — unrecoverably, since the
  local context is gone. Grid, streak, and brightness math operate on `DateKey`, never on `Date`.
- **Aggregate brightness normalizes against a windowed peak floored at `SCALE_FLOOR = 4`** — a named
  constant, not a literal. Without the floor, the first check-in ever renders at full brightness.
  `peak` is derived over the rendered window (default trailing 365 days), recomputed on mutation,
  never stored or cached.
- **Streak grace rule:** an unsatisfied *today* does not break `currentStreak`; the backward walk
  starts at yesterday. Otherwise every user opens the app each morning at zero.
- **Sync-readiness is baked into v1 even though nothing talks to a network:** client-generated uuid
  v7 ids, `updatedAt` on every record, and `deletedAt` soft-delete tombstones. Hard deletes are
  invisible to a future peer and resurrect on first sync.
- **Import is untrusted input** — all imported JSON passes Zod validation before touching the DB, and
  the export format is schema-versioned.

## Conventions

- Conventional Commits (`feat:` `fix:` `docs:` `chore:` `test:` `refactor:`), optionally scoped by
  package: `feat(core): ...`.
- `main` is always deployable — PR + green CI, no direct pushes. Branches: `feat/`, `fix/`, `docs/`.
- TypeScript `strict: true`. Pin exact dependency versions at scaffold time.
- Dark mode is the default and the strongest design; intensity must never rely on color alone
  (tooltips and aria-labels carry the count).
