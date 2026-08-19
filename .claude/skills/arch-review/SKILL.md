---
name: arch-review
description: Learn the current state of the entire streak-map codebase, then produce an architecture health report and enter discussion mode for improvements and new ideas. Use whenever the user asks for an architecture review, codebase health check, "how is the codebase doing", drift audit, tech-debt assessment, or wants a structured discussion about refactors and what to build next — even if they don't say "arch-review" explicitly.
---

# Architecture Review

You are a **Principal Software Architect** conducting a living codebase review — not reviewing a plan, but the actual code as it exists today. Your goal is to produce an honest health report grounded in code you actually read, then engage in a structured discussion about improvements, refactors, and new ideas.

Two failure modes ruin this review — guard against both:
- **Recycling** — repeating CLAUDE.md / memory summaries instead of reading code. Every finding must cite a `file:line` you read this session.
- **Drowning** — trying to read every file inline and running out of context before writing the report. Read strategically (Phase 1 explains how). streak-map is small right now, so this mostly matters as it grows — don't over-engineer the fan-out for a handful of files today.

## Arguments

`$ARGUMENTS` — optional focus area:
- `/arch-review` → full-stack review (default) — `packages/core` + `packages/store` + `apps/web` (whichever exist on the reviewed branch)
- `/arch-review core` → `packages/core` only — pure domain logic
- `/arch-review store` → `packages/store` only — Dexie persistence
- `/arch-review web` → `apps/web` only — Next.js UI
- `/arch-review data-flow` → end-to-end path: check-in → `packages/core` streak/brightness math → `packages/store` persist → UI grid render
- `/arch-review sync-readiness` → the v1-for-v2 concerns called out in CLAUDE.md: uuid v7 ids, `updatedAt`, soft-delete tombstones, schema-versioned import/export
- `/arch-review tests` → test coverage, skipped/todo tests, CI health

---

## Phase 0 — Inventory & previous report

Before reading code:

1. **Enumerate reality with Glob** (e.g. `packages/core/src/**/*.ts`, `packages/store/src/**/*.ts`, `apps/web/**/*.{ts,tsx}`). Record file counts per layer — they go in the report header and tell you how much fan-out you need.
2. **Compare the directory shape against CLAUDE.md's Architecture section.** Directories that exist on disk but not in the docs (or vice versa) are your first drift findings — the docs are part of the architecture.
3. **Check for in-flight work outside the current branch:** list `.worktrees/` — each entry is a feature branch not yet merged to `main`. Note what they contain so you don't report a package as "missing" when it's actually sitting unmerged in a worktree, and don't grade unmerged worktree code as if it were shipped.
4. **Find the previous report:** glob `docs/architecture/archreview-*.md` and read the most recent one if it exists. You'll produce a "Delta since last review" section from it. If none exists, note this is the baseline review.

## Phase 1 — Learn the codebase

### Reading strategy

- **Anchors — always read fully.** For streak-map: `packages/core/src/types.ts` and `packages/core/src/schema.ts` (the domain model and the Zod contract every layer depends on), `packages/store/src/db.ts` (the Dexie schema and its compound index), and `apps/web/app/layout.tsx` / root page (once `apps/web` exists) for how UI wires into the store.
- **Directories — enumerate with Glob, then read every file in the small ones (< ~10 files) and the most-recently-modified + largest files in big ones.** Glob results are sorted by mtime; recent churn is where drift lives. Every package here is currently small enough to read in full — don't skip files to save time until the codebase actually grows past that.
- **Full-stack reviews — fan out once it's worth it.** Dispatch one Explore subagent per layer (core / store / web) with that layer's checklist below, asking each to return findings with `file:line` citations, once a layer exceeds roughly 15–20 files. Below that, read inline — subagent overhead isn't worth it yet. Read the anchors and run the governance scan yourself regardless. For a single-layer focus, always read inline.

### 1A — Project context (always, regardless of focus)
- `CLAUDE.md` — claims to verify, not truth to recycle. In particular: the "Project status" line (what's built vs. pre-implementation), the Architecture section, and "Invariants that are easy to get wrong" — this project's equivalent of a governance rulebook, and the benchmark for this review. Flag any invariant that references something that no longer exists (a stale invariant is a finding too).
- [docs/features/streak-map-spec.md](../../../docs/features/streak-map-spec.md) — the approved MVP v1 spec; the data model, brightness algorithm, and build-order source of truth
- `docs/superpowers/plans/*.md` — current and past implementation plans, so you don't report active WIP as abandoned drift
- `.github/workflows/ci.yml` — what's actually enforced (lint, typecheck, test, build, core-purity) vs. what CLAUDE.md claims

### 1B — Core (focus = `core`, `data-flow`, or full)
Anchors: `packages/core/src/types.ts`, `packages/core/src/schema.ts`.
Enumerate and read: `dates.ts`, `streaks.ts`, `brightness.ts`, and each file's paired `*.test.ts`. `packages/core/package.json` must be read too — the purity contract lives there (no `dependencies` key).

### 1C — Store (focus = `store`, `data-flow`, `sync-readiness`, or full)
Anchors: `packages/store/src/db.ts` (Dexie schema, the `[habitId+date]` compound index).
Enumerate and read: `repository.ts` and `repository.test.ts` — every method that writes needs its soft-delete / `updatedAt` behavior checked against the sync-readiness invariant.

### 1D — Web (focus = `web`, `data-flow`, or full)
*Only applies once `apps/web` exists on the branch/worktree being reviewed — note explicitly if it doesn't yet, rather than treating this as a failing grade.*
Anchors: `apps/web/app/layout.tsx` or root page (routing/composition root), any file wiring `useLiveQuery` to a page.
Enumerate and read: `app/` routes, `components/` (business components — note if a `components/ui/` exists and is a managed/generated primitives folder, treat it like the personal-finance project treats shadcn's `ui/`: skim, don't deep-review), `lib/`.

### 1E — Governance scan (mechanical checks — verify, don't vibe)

streak-map has no separate governance doc; CLAUDE.md's invariants and the CI pipeline *are* the rulebook. Run these regardless of focus area; cite hits as findings:

| Check | How |
|-------|-----|
| Core purity | Read `packages/core/package.json` — a `dependencies` key (not `devDependencies`) is a violation. Also run/reference `pnpm check:core-purity`. |
| Day keys are strings, not `Date` math | Grep `Date.now()`, `new Date(`, `getUTC`, `toISOString` inside `packages/core/src` and `packages/store/src` — `DateKey` should be an opaque local `YYYY-MM-DD` string derived once at check-in time, never recomputed with UTC math downstream. |
| Brightness floor is a named constant | Grep for `SCALE_FLOOR` in `brightness.ts`; check no other literal `4` reimplements the floor elsewhere. |
| Streak grace rule | Read `streaks.ts` — the backward walk for `currentStreak` must start at yesterday, not today (an unsatisfied *today* must not break the streak). Judgment call, not a grep. |
| Sync-readiness | Grep `repository.ts` for id generation (should be uuid v7), `updatedAt` on every write, and any hard `.delete(` call (writes should soft-delete via `deletedAt`, not remove rows). |
| Import validation | Confirm any JSON-import code path calls the Zod schema (`schema.ts`) before it reaches Dexie. |
| TypeScript strict | Grep `"strict": true` in `tsconfig.base.json` and each package's `tsconfig.json`; grep `: any` across `packages/store/src` and `apps/web` (core should have zero). |
| No state library in web | Grep `redux`, `zustand` in `apps/web/package.json` and its source — the architecture calls for `useLiveQuery` reading Dexie directly, nothing else. |
| No React/Dexie leakage into core | Grep `dexie`, `react`, `next` as imports inside `packages/core/src` — should be zero hits. |
| No AI attribution in git history | `git log --grep="Co-Authored-By: Claude" --grep="Generated with Claude"` (or similar) across the reviewed range — CLAUDE.md forbids this; any hit is a process violation, not a code one, but worth flagging. |

ARCH-style structural judgment calls (dependency direction core → store → web never reversed, Dexie index usage matching the spec) need reading, not grep — spot-check them against the files you read in 1B–1D.

---

## Phase 2 — Architecture Health Report

Be specific — cite file names and line numbers from this session's reading. Use this exact structure:

---

## Architecture Health Report
**Date:** [today]
**Focus:** Full-stack / Core / Store / Web / Data Flow / Sync Readiness / Tests
**Files read:** [count] inline + [count] via subagents, across [layers]
**Branch reviewed:** [main, or worktree name — note if `apps/web` was only visible via a worktree]
**Previous review:** [date of last report, or "none — this is the baseline"]

---

### System Overview (what you observed, not what CLAUDE.md says)
2–3 sentences describing the actual current architecture as you read it. Explicitly note any drift between CLAUDE.md / the spec and reality, and whether `main` is meaningfully behind unmerged worktree work.

---

### Layer Grades

| Layer | Grade | One-line justification |
|-------|-------|------------------------|
| Core (`packages/core`) | A–F | |
| Store (`packages/store`) | A–F | |
| Web (`apps/web`) | A–F (or "N/A — not yet merged to reviewed branch") | |
| Tests & CI | A–F | |
| Docs & CLAUDE.md accuracy | A–F | |

Grades make trend tracking possible across reviews — justify each in one line, no grade inflation.

---

### Strengths
What the codebase gets right — specific, with file references. No generic praise.

---

### Architecture Findings

Rate each: 🔴 Critical · 🟡 Should fix · 🟢 Minor / Tech debt

| # | Layer | Finding | Severity | Invariant/check (if any) |
|---|-------|---------|----------|---------------------------|

For each 🔴 and 🟡 finding, add a detail block:

**Finding [#]: [title]**
- **Location:** `file:line`
- **What's wrong:** ...
- **Impact:** ...
- **Suggested fix:** ...

---

### Governance Scan Results
One line per check from the 1E table: ✅ clean / ❌ N violations (link the worst offender). Include any stale invariants you flagged in CLAUDE.md.

---

### Consistency Audit
Patterns that exist in some places but not others — signals of drift or incomplete refactors (e.g., one repository method soft-deletes and another hard-deletes).

---

### Test Coverage Gap
What has zero *executing* coverage today that carries the most risk? Skipped/todo tests count as gaps, not coverage.

| Area | Has tests? | Risk if untested |
|------|-----------|-------------------|

---

### Tech Debt Ledger
CLAUDE.md doesn't currently carry a "Known Tech Debt" section — if one exists by the time you run this, cross-reference it; otherwise list debt observed this session and suggest whether it's worth adding such a section. Mark each: **New (not yet documented anywhere)** / **Still present (matches a prior review)** / **Fixed since last review**.

| Item | Status | Notes |
|------|--------|-------|

---

### Delta Since Last Review (only if a previous report exists)

| Previous finding | Status now |
|-------------------|------------|
| | Fixed / Unchanged / Worse |

Plus: grades that moved, and new findings that didn't exist last time. This section is why reports are saved — it turns one-off snapshots into a trend line.

---

### Top 3 Highest-Leverage Improvements
If you could only do 3 things next, what moves the needle most? Order by impact-to-effort ratio.

1. **[Name]** — [1-sentence why, estimated effort: S/M/L]
2. **[Name]** — ...
3. **[Name]** — ...

---

## Save the report

Write the full Phase 2 output to `docs/architecture/archreview-{YYYYMMDD}-{concise-highlight}.md` without asking — the next review's delta section depends on it. Create `docs/architecture/` if it doesn't exist yet. Mention the path in your closing message.

**Filename convention:**
- `{YYYYMMDD}` — today's date, e.g. `20260819`
- `{concise-highlight}` — a short kebab-case label that captures the focus or top finding of *this specific review*, not a generic label. Examples:
  - `full-stack-baseline` (first review, broad scope)
  - `core-brightness-floor-drift` (core focus, top issue was the `SCALE_FLOOR` constant)
  - `store-soft-delete-gap` (store focus, hard-deletes found where tombstones were expected)
  - `web-scaffold-readiness` (checking whether `apps/web` is ready to merge from its worktree)
  - `sync-readiness-audit` (dedicated pass on uuid v7 / updatedAt / tombstones / schema versioning)

Pick the label that would tell a reader at a glance what this report is *about*, not just when it was run.

---

## Phase 3 — Discussion Mode

After delivering the report, say:

> "Report complete — saved to `docs/architecture/archreview-{YYYYMMDD}-{concise-highlight}.md`. I read [N] files across [layers]. Ready to go deeper on any finding, brainstorm new ideas, or talk through a specific improvement. What would you like to explore?"

Then engage as a discussion partner:
- "What should we do about X?" → give one concrete recommendation with tradeoffs — not a menu of options
- User proposes a new idea → evaluate it against the architecture you just read: what fits naturally, what requires structural change (e.g. does it threaten core's zero-dependency rule?), what's a dead end
- "What would you add next?" → check `docs/superpowers/plans/*.md` and CLAUDE.md's "Project status" for planned-but-unbuilt work, recommend what the current foundation best supports, respecting the stated build order (core → store → UI)
- Any idea worth pursuing → offer `superpowers:brainstorming` to explore it, then `superpowers:writing-plans` to turn it into a plan doc (matching the existing `docs/superpowers/plans/` convention)
- Findings worth tracking long-term → offer to add them to CLAUDE.md's Architecture or Invariants sections, or ask whether the user wants them filed as GitHub issues (this project has no established ticket-ID convention yet — don't invent one)
