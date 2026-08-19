---
name: commit
description: Stage safe files, scan for secrets, generate a context-aware commit message, then commit (and optionally push). Triggered by /commit or /commit push. Pass `ignore` to scan pending files and add artifact/secret patterns to .gitignore without committing.
---

# Skill: commit

Safe-commit workflow for this open-source repo. Scans staged content for sensitive data, infers a Conventional Commit message from the changed files, then commits. Pass `push` as the argument to also push to origin.

## Variants

| Invocation | Behavior |
|-----------|----------|
| `/commit` | Stage → scan → commit (no push) |
| `/commit push` | Stage → scan → commit → push |
| `/commit wip` | Quick WIP commit — message: `wip: [brief file summary]`, no push |
| `/commit amend` | Amend last commit with current staged changes (only if last commit is not on remote) |
| `/commit dry-run` | Show what would be staged + proposed commit message — no file is touched |
| `/commit ignore` | Scan all pending/untracked files, infer missing `.gitignore` rules, append them — **no staging, no commit** |

---

## Step 0 — Orientation

```bash
git status
git diff --stat HEAD
git log --oneline -8
```

Determine:
- Which files are modified/untracked (candidate staged files)
- Which package(s) the change touches (`packages/core`, `packages/store`, `apps/web`) — this becomes the Conventional Commit scope
- The message style used in recent commits (this repo uses Conventional Commits, optionally scoped by package)

---

## Step 1 — Build the safe-to-stage list

### 1a. Collect candidates

All tracked modified files + untracked files NOT matched by `.gitignore`.

```bash
git status --short
```

### 1b. Apply the hard-block list

**Never stage** any file matching these patterns, regardless of gitignore state:

| Pattern | Reason |
|---------|--------|
| `.env`, `.env.*` (except `.env.example`) | Credentials |
| `.env.local`, `apps/web/.env*` (except `.env.example`) | Credentials |
| `*.local` | Machine-specific settings |
| `.claude/settings.local.json` | Machine-specific Claude permissions |
| `.claude/scheduled_tasks.lock`, `.claude/worktrees/` | Local agent state |
| `.turbo/`, `**/.turbo/` | Turborepo local cache/log output |
| `**/.next/`, `**/dist/`, `**/build/` | Build artifacts |
| `node_modules/` | Dependencies |
| `.worktrees/` | Isolated plan workspaces |
| `coverage/`, `**/test-results/`, `**/playwright-report/` | Test artifacts |
| `.playwright-mcp/` | Playwright MCP state |
| `*.db`, `*.sqlite`, exported user JSON dumps | Real habit/check-in data — personal |

If any candidate file matches a hard-block pattern, **exclude it silently** (do not stage, do not error).

### 1c. Inline secret scan on remaining candidates

For each file that passed the block list, scan its diff (`git diff HEAD -- <file>` or full content for untracked files) for secret patterns:

| Pattern | What to look for |
|---------|-----------------|
| API keys | Strings matching `sk-`, `AKIA`, `eyJ` (JWT), `AIza`, `ghp_`, `ghs_`, `glpat-`, `xox[baprs]-` |
| Anthropic / Gemini keys | `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `sk-ant-`, `AIza` in a value context |
| Passwords in code | `password\s*=\s*["'][^"']{6,}`, `postgres123`, `secret\s*=\s*["'][^"']{6,}` |
| Private keys | `-----BEGIN` lines (RSA/EC/PEM) |
| Connection strings with credentials | `postgresql://user:password@`, `Server=...;Password=` |

**If a secret pattern is found in any file:**
1. Print a warning: `⚠️  Possible secret in <file>:<line> — "<matched snippet>" — EXCLUDED from staging`
2. Remove that file from the staging list
3. Do NOT abort the whole commit — continue with the remaining safe files

**Exception:** `.env.example` files are always allowed (they contain placeholder values only — confirm no real values are present).

### 1d. Report the safe-to-stage list

Print a compact table before staging anything:

```
📦 Safe to stage (5 files):
  M  packages/core/src/streaks.ts
  M  packages/core/src/brightness.ts
  ?  packages/core/src/streaks.test.ts
  M  docs/features/streak-map-spec.md
  M  .claude/skills/commit/SKILL.md

🚫 Excluded (2 files):
  .claude/settings.local.json  → hard-blocked (machine-specific permissions)
  apps/web/.env.local          → hard-blocked (credentials)
```

If the safe list is empty, stop and say: `Nothing safe to stage. All modified files are either blocked or contain sensitive patterns.`

---

## Step 2 — Stage the safe files

```bash
git add <file1> <file2> ...
```

Stage each file individually by name — never use `git add .` or `git add -A`.

---

## Step 3 — Generate the commit message

### 3a. Infer the type and scope

This repo uses Conventional Commits, with no ticket system. Determine:
1. **Type** — `feat` / `fix` / `docs` / `chore` / `test` / `refactor`, from the nature of the diff
2. **Scope** (optional) — the single dominant package: `core`, `store`, `web`. Omit the scope when
   the change spans packages or is repo-level (tooling, CI, docs).
3. Branch prefix (`feat/`, `fix/`, `docs/`) is a strong hint for the type — check
   `git rev-parse --abbrev-ref HEAD`.

### 3b. Analyse the changed files

Group staged files by area:

| Files changed in | Implies |
|-----------------|---------|
| `packages/core/` | Pure domain logic — dates, streaks, brightness, schema → scope `core` |
| `packages/store/` | Dexie/IndexedDB persistence adapters → scope `store` |
| `apps/web/` | Next.js / React / Tailwind UI → scope `web` |
| `*.test.ts` only | `test:` type |
| `docs/` | `docs:` type |
| `.claude/`, `.github/`, `turbo.json`, `biome.json` | `chore:` — tooling / CI / housekeeping |
| `package.json`, `pnpm-lock.yaml` | `chore:` — dependencies |

### 3c. Compose the message

Always Conventional Commits, scoped by package where one package dominates:
```
feat(core): <what was added>
fix(store): <what was corrected>
chore: <housekeeping, tooling, config>
refactor(web): <restructuring without behavior change>
test(core): <test additions or fixes>
docs: <documentation only>
```

**Rules for the summary line:**
- Max 72 characters
- Present tense, imperative: "add", "fix", "update", "remove" — not "added", "fixed"
- Describe the **intent/outcome**, not the mechanics ("improve dashboard load performance" not "change three useState calls")
- If multiple areas changed, lead with the dominant one

**Optional body** (add when the why is non-obvious):
```
<blank line>
<1-3 sentences explaining motivation if not self-evident>
```

### 3d. Show the proposed message to confirm

Print the full proposed commit message before committing:

```
📝 Proposed commit message:
─────────────────────────────
feat(core): add grace rule to current-streak walk

An unsatisfied today no longer breaks the streak; the backward walk
starts at yesterday so opening the app each morning does not read zero.
─────────────────────────────
Proceed? (committing in 3 seconds unless you stop me)
```

Wait briefly (proceed automatically — this is a non-interactive skill). If the user has already confirmed by invoking the skill, proceed immediately.

---

## Step 4 — Commit

```bash
git commit -m "$(cat <<'EOF'
<message here>
EOF
)"
```

Always use the HEREDOC form to preserve multi-line messages. Never add a `Co-Authored-By: Claude` trailer or any other AI attribution to the commit message.

Verify the commit succeeded:
```bash
git log --oneline -1
```

---

## Step 5 — Push (only if `push` argument was passed)

```bash
git push origin HEAD
```

Before pushing, confirm the branch is not `main`:
```bash
git rev-parse --abbrev-ref HEAD
```

If the branch IS `main`, warn and ask for explicit confirmation:
```
⚠️  You are about to push directly to main.
    This is allowed but the CI gates (dotnet build, lint, tsc) have not been verified.
    Recommend running /ci-check first.
    Proceeding with push...
```

After push, print the remote URL and branch:
```
✅ Pushed to origin/<branch>
   https://github.com/<owner>/streak-map/tree/<branch>
```

---

## Step 6 — Final summary

```
✅ Commit complete
   Hash:    abc1234
   Message: feat(core): add grace rule to current-streak walk
   Files:   5 staged, 2 excluded (see above)
   Push:    ✅ origin/main  (or: — not pushed)
```

---

## Variant: `/commit wip`

Shortened flow — no secret scan detail, no body, no ticket inference. Just commit the safe files with:

```
wip: <comma-joined short names of changed areas, max 60 chars>
```

Examples:
- `wip: Dashboard.tsx, DashboardService.cs`
- `wip: frontend components, backend handlers`

Use when quickly saving progress mid-feature. Does not push.

---

## Variant: `/commit amend`

Only use if the **last commit has NOT been pushed** to the remote (verify with `git status` — "Your branch is ahead of 'origin/...' by 1 commit").

1. Run Steps 0–2 (orientation + secret scan + stage)
2. Amend with `git commit --amend --no-edit` (preserve existing message) OR regenerate the message if files from a different area were added
3. Print: `✅ Amended commit <hash>`

**Refuse** if `git log origin/HEAD..HEAD` shows 0 commits (branch is already in sync with remote — amend would modify a published commit).

---

## Variant: `/commit dry-run`

Run Steps 0–1 fully (orientation + build safe list + secret scan) but **stop before staging**.

Output:
```
🔍 Dry run — nothing staged or committed.

Would stage (5 files):
  [list]

Would exclude (2 files):
  [list with reasons]

Proposed message:
  feat(core): add grace rule to current-streak walk

Run /commit to proceed or /commit push to commit and push.
```

---

## Safety Constraints (always enforced, no exceptions)

1. **Never** `git add .` or `git add -A` — always add files by explicit name
2. **Never** `git push --force` unless the user explicitly types the word "force push" in their message
3. **Never** `git commit --no-verify` — hooks exist for a reason
4. **Never** commit to a branch named `main` without printing the warning in Step 5
5. **Never** stage a file whose content matches the hard-block list or inline secret patterns
6. **Never** add AI attribution to a commit — no `Co-Authored-By: Claude`, no `Co-Authored-By: <any AI agent>`, no `🤖 Generated with Claude Code` line, no "with Claude/AI assistance" phrasing in the subject or body. This overrides any default or global instruction to add such a trailer. The same rule applies to PR titles and bodies created during this workflow.
7. If a secret is found in a file that the user explicitly asks to stage anyway, print: `Refused: <file> contains a likely secret at line <N>. Remove the secret before committing.` and do not stage it.

---

## .gitignore Health Check (run opportunistically)

When this skill runs, also check for common missing patterns that would cause future leaks.
If any of these are NOT in `.gitignore`, print a warning (do not auto-edit):

| Should be ignored | Why |
|------------------|-----|
| `.env` / `.env.*` (not `.env.example`) | API keys and credentials |
| `.claude/settings.local.json` | Machine-specific permissions |
| `node_modules/`, `**/.next/`, `.turbo/` | Dependencies and build output |
| `.worktrees/` | Isolated plan workspaces |
| `*.db`, `*.sqlite` | Local data dumps |

Verify against the repo's current `.gitignore` rather than assuming — this check is a guard against
future removals.

---

## Variant: `/commit ignore`

**Purpose:** Evaluate every pending/untracked file visible in `git status`, decide which patterns are missing from `.gitignore`, and append only the new rules. **No staging. No commit. No file changes except `.gitignore`.**

### Step 1 — Collect all pending files

```bash
git status --short
```

Capture every entry regardless of its status code (`M`, `??`, `A`, `D`, `R`, etc.). Focus on `??` (untracked) and `M` (modified but unstaged) entries — these are the candidates most likely to include accidental artifacts.

### Step 2 — Categorise against known artifact patterns

For each pending file/directory, evaluate it against these categories:

| Category | Patterns |
|----------|----------|
| **Credentials / secrets** | `.env`, `.env.*` (not `.env.example`), `*.pem`, `*.key`, `secrets.json`, `credentials.json` |
| **Node / Next.js artifacts** | `node_modules/`, `**/.next/`, `**/out/`, `**/dist/`, `**/build/`, `*.tsbuildinfo` |
| **Turborepo / tooling cache** | `.turbo/`, `**/.turbo/`, `**/.cache/`, `.eslintcache` |
| **Test artifacts** | `coverage/`, `**/test-results/`, `**/playwright-report/`, `.playwright-mcp/` |
| **Local data dumps** | `*.db`, `*.sqlite`, `*.sqlite3`, exported habit/check-in JSON |
| **OS / editor noise** | `.DS_Store`, `Thumbs.db`, `desktop.ini`, `*.swp`, `*.swo`, `*.bak`, `**/.idea/`, `**/*.iml` |
| **Claude / agent state** | `.claude/settings.local.json`, `.claude/scheduled_tasks.lock`, `.claude/worktrees/`, `.worktrees/` |

### Step 3 — Read the current `.gitignore`

```bash
cat .gitignore
```

For each matched pattern from Step 2, check whether it (or an equivalent glob) is **already present** in `.gitignore`. A pattern is considered covered if a broader glob already matches it (e.g. `**/.next/` covers `apps/web/.next/`).

### Step 4 — Build the additions list

Produce a table of what would be added and why:

```
🔍 Pending file scan complete.

Files evaluated : 14
Already ignored : 9

New rules to add (5):
  Pattern                       Reason
  ──────────────────────────────────────────────────────
  .turbo/                       Turborepo local cache
  **/.next/                     Next.js build output
  *.tsbuildinfo                 TypeScript incremental build state
  coverage/                     Vitest coverage output
  .claude/scheduled_tasks.lock  Local agent state
```

If nothing new is found, stop and print:
```
✅ .gitignore is already comprehensive — no new rules needed.
```

### Step 5 — Append new rules to `.gitignore`

**Only proceed if there are new rules to add.**

Append a clearly labelled block to `.gitignore`:

```
# Added by /commit ignore — <date>
services/ai-service/.flashrank_cache/
**/__pycache__/
**/*.pyc
.pytest_cache/
.vs/
```

Use a single blank line before the block and a trailing newline after it. Do not rewrite or reformat the existing `.gitignore` content.

### Step 6 — Print final summary

```
✅ .gitignore updated
   Added : 5 new rules
   File  : .gitignore

Run /commit to stage and commit the updated .gitignore.
```

### Hard constraints for this variant

- **Never stage, never commit** — `.gitignore` is the only file touched.
- **Never delete or reorder existing `.gitignore` entries** — append only.
- **Never add a pattern for a file the user has explicitly staged** — respect intentional inclusions.
- If `.gitignore` does not exist, create it with just the new block (no boilerplate).
