# Handoff: streak-map UI

## Overview
UI design for **streak-map**, a local-first habit tracker that visualizes habit consistency as a GitHub-style contribution grid. Audience is developers first, legible to non-developers. Tone: calm, dense, precise — GitHub / Linear / Vercel register. No gamification, no mascots, no confetti — the grid filling in is the only reward.

## About the Design Files
The bundled file `streak-map-design-reference.html` is a **design reference built in HTML** (a Claude "Design Component" — plain HTML/CSS/inline-styles + a small JS class driving state). It is a working prototype showing exact layout, color, type, spacing, and interaction — **not production code to copy directly**. Recreate these screens in the target codebase's existing stack. The project is planned for **Tailwind CSS** — translate the design tokens below into Tailwind config (or CSS variables consumed by Tailwind's `arbitrary value`/`theme()` mechanism) rather than porting inline styles verbatim.

Open the file directly in a browser to explore it live: it has in-app navigation across every screen (there's a bottom-left `⌘K` command palette to jump between Dashboard / Empty state / Habit detail / Settings / Components sheet, and a live light/dark theme toggle in Settings).

## Fidelity
**High-fidelity.** Colors, type, spacing and states below are final for this design pass — recreate pixel-for-pixel where feasible, adapting only to the codebase's component patterns.

## Design system / visual direction
Warm, minimal "zen" aesthetic (off-white paper background with a faint dot/grid texture, generous whitespace, no card-shadow-heavy chrome). Light mode is implemented as the primary/default theme in this handoff; dark-mode tokens are also fully specified (see Design Tokens) since the product spec calls for dark-mode-first — wire both themes, default to whichever the team decides at build time (this reference defaults to light per the latest direction).

## Screens / Views

### 1. Dashboard (primary screen)
**Purpose:** land here first; see aggregate activity and check in on habits for today.

**Layout:** single column, max-width 1040px, centered, top padding ~6vh, bottom padding 140px (room for the floating "New habit" button).

**Header** (flex row, space-between, baseline-aligned, wraps on narrow):
- Wordmark "streak-map" — 20px / weight 700 / letter-spacing -0.01em / `tx1` color.
- Total check-ins this year, e.g. "257 check-ins in 2026" — 13px, IBM Plex Mono, `tx2` color, sits inline after the wordmark with 14px gap.
- Settings icon button, top-right — 32×32px, fully transparent, a plain circular ring glyph (a 15×15px circle outlined 1.6px in currentColor — swap for a real gear/settings icon in production), 8px radius, `tx2` at 55% opacity resting, 100% + `accent-s` background on hover, focus ring on keyboard focus.

**Habits section** — label "Habits" (13px, weight 500, `tx2`) above a vertical stack of habit cards, 16px gap between cards.

Each **habit card** (`surface` background, 1px `border`, 12px radius, 20px/22px padding):
- Header row (space-between, wraps): left side is clickable (opens Habit Detail) — a color dot (9×9px circle, habit's accent color) + habit name (15px/600/`tx1`) + streak line below it ("{n}-day streak", 11px IBM Plex Mono `tx3`). Right side: today's count as plain text with no border/background (11px IBM Plex Mono `tx3`, shown only when count > 0, e.g. "1 today") → "Check in" button → a small ghost "−" undo button (30×30px, 10px radius, 1px border, shown only when today's count > 0) — in that left-to-right order.
- **Full 365-day contribution grid** for that habit, in the habit's own accent color — see "Contribution grid" component spec below. Horizontally scrollable container (`overflow-x:auto`, inner content `min-width:800px`) so tiles never shrink below legible size on narrow viewports.
- A small "Less → More" intensity legend under the grid, right-aligned, using the habit's own color at 4 opacity steps (see Design Tokens).
- A stats strip below a 1px top border, 14px top padding, wraps on narrow, 20px gaps: **Current streak**, **Longest streak**, **Active days** (as "{n} / 365"), **Completion rate** (as "{n}%"). Label 11px `tx3`, value 17px/600 IBM Plex Mono `tx1`.

**Check-in behavior:** check-ins are **unlimited per day** — clicking "Check in" increments today's count by 1 (no cap). The grid's color intensity for a habit is normalized against **that habit's own peak day** in the visible window (5 levels: empty + 4 increasing intensities) — more check-ins in a day reads as a denser color, it does not toggle a done/not-done state. The "−" button decrements today's count by 1 (undo a misclick), floors at 0. A "settled" (not loud) button treatment applies once today's count > 0: background becomes the flat `elevated` fill and text dims to `tx2`, vs. the resting state's outlined `border-hi` + `tx1` text — the button never changes to a disabled/"done" look because more check-ins are always possible.

**Floating "New habit" button:** fixed bottom-center, pill-shaped (20px radius), `cta-bg` background, 12×22px padding, shows a trailing "n" keycap hint (IBM Plex Mono, 70% opacity) — the keyboard shortcut.

### 1b. Dashboard — Empty state
Shown when the user has zero habits. Same header, no habit cards. A single centered panel (`elevated` background, 1px border, 12px radius, 72px vertical padding): a 44×44px outlined square with a plus glyph, "No habits yet" (16px/600), a one-line explainer ("Create a habit to start filling in the grid. Every check-in adds to the picture." — 13px `tx2`, max-width 320px), and a primary "Create your first habit" CTA button.

### 2. Habit Detail
**Purpose:** deep dive into one habit's full history and settings.

**Layout:**
- Back arrow (28×28px ghost button) + a row of pills, one per habit, to quick-switch between habits without leaving the detail view (active pill: `border-hi` border + `accent-s` background + `tx1` text; inactive: plain `border` + `tx3` text).
- Title row: color dot (13×13px) + habit name (22px/700) + an "Archived" tag (10px IBM Plex Mono, outlined) when applicable.
- Meta line: habit description, or a generated fallback "{target} / {day|week} · started {date}" — 13px `tx2`.
- 1px divider.
- **Full 365-day grid**, identical component to the dashboard card's grid (month labels along the top, Mon/Wed/Fri row labels down the left, horizontally scrollable), rendered in the habit's accent color.
- A field-row panel (`surface`, 1px border, 12px radius) listing, each row divided by a 1px bottom border: Current streak, Longest streak, Active days ("{n} / 365"), Completion rate ("{n}%"), Target ("{n} / day" or "{n} / week"), Started (formatted date).
- Fixed bottom-center action bar (`surface` pill container): **Edit** button (filled `accent` background) and **Archive/Unarchive** ghost button.

### 3. Habit Editor (modal)
Centered modal over a translucent scrim, `surface` background, 16px radius, 26px padding, max-height 86vh with internal scroll.
- Header: "New habit" / "Edit habit" title (16px/700) + a ✕ close button.
- Fields, each with a 12px `tx2` label above:
  - **Name** — single-line text input, required (empty name silently cancels save).
  - **Description** — optional 2-row textarea.
  - **Start date** + **Interval** side-by-side (50/50): start date is a native date input; interval is a 2-way segmented control ("Daily" / "Weekly").
  - **Target** — stepper: "−" button / "{n} / day" or "{n} / week" label (IBM Plex Mono, 70px min-width, centered) / "+" button. Range 1–20. This target is a **goal threshold used for streak/completion-rate math**, independent of the unlimited raw check-in count.
  - **Accent color** — one row of ~10 circular swatches (26×26px, 8px gap, wraps). Selected swatch gets a 2px `tx1` outline with 2px offset. **New habits default to a green accent** (`#4B8A5E`); the user is free to change it to any swatch. This is the habit's own setting — there is no separate global color control in Settings.
- Footer (space-between): **Delete habit** ghost/de-emphasized red text-button on the left (only shown when editing an existing habit, not when creating), **Cancel** + **Save** (primary, `cta-bg` pill) on the right.

### 4. Settings
Back arrow + "Settings" title, max-width 560px, stacked panels (`surface`, 1px border, 12px radius, 20px padding), 18px gap:
- **Data** — one-line explainer ("Your data lives only in this browser…") + **Export data (JSON)** button (triggers a browser download of `{habits: [...]}` as `streak-map-export.json`) + **Import data (JSON)** (file picker, `accept="application/json"`).
- **Appearance** — Light/Dark segmented toggle (2-way, same segmented-control styling as the editor's interval control).
- **Keyboard shortcuts** — a static reference list (label ⟷ keycap), see Interactions below.
- **About** — link to the GitHub repo, "MIT licensed · open source" caption.

### 5. Components sheet
A living style-guide screen for developer reference — not a shipped app screen. Sections: grid tile states (empty / levels 1–4 / hover / today-outlined, each swatch labeled), a tooltip sample ("3 check-ins on Aug 12, 2026"), buttons (Primary/CTA, Secondary, Ghost, Delete, icon button — each with hover + focus-ring states), inputs (text, textarea, segmented control, stepper), and the accent color swatch row.

## Interactions & Behavior

### Contribution grid (shared component — dashboard card + detail)
- Grid = calendar weeks (Mon-start ISO weeks) × 7 day rows, most recent day last (bottom-right), 365 days trailing from "today."
- Tile: 11×11px, 3px radius, 3px gap between tiles.
- **Intensity mapping**: `level = count===0 ? 0 : min(4, max(1, ceil(count / peak * 4)))`, where `peak = max(4, highest single-day count in that habit's own 365-day window)`. Level 0 renders the neutral empty tile color; levels 1–4 render the habit's accent color at increasing opacity (0.32 / 0.56 / 0.8 / 1.0).
- **Today's tile** gets an inset outline (1.5px solid `tx1`) regardless of level, so it's always identifiable even when empty.
- **Hover**: tile gets an outward 1.5px `tx3` box-shadow ring (a hover affordance distinct from the today-outline).
- **Tooltip on hover**: small dark-on-light (theme-aware) pill anchored above the tile, IBM Plex Mono 12px, reading `"{n} check-in(s) on {Mon D, YYYY}"` or `"No check-ins on {date}"` when count is 0.
- **Accessibility**: every tile carries an `aria-label` with the same count + date text the tooltip shows — intensity is never conveyed by color alone.
- Month labels sit in a row above the grid, left-padded to clear the weekday-label column, printed only on the week a new month starts. Weekday labels ("Mon", "Wed", "Fri") sit in a fixed-width column to the left of the grid, on rows 1/3/5 of the 7-row week.

### Keyboard shortcuts (global, when not typing in a field)
| Action | Key |
|---|---|
| Move between habits (dashboard) | `j` / `k` |
| Check in for the focused habit | `space` or `c` |
| New habit | `n` |
| Open command palette | `⌘K` / `Ctrl+K` |
| Toggle shortcuts overlay | `?` |
| Close any open dialog | `Esc` |

The `?` overlay is a centered modal listing the same table above. The focused habit (via j/k) gets a visible focus ring (inset 1.5px `tx2`) on its whole card.

### Focus ring
Every interactive element (buttons, inputs, swatches) shows a visible `box-shadow: 0 0 0 3px var(--focus-ring)` on keyboard focus — `focus-ring` is a low-opacity tint of the CTA color (see tokens). This is required for keyboard-first navigation and must not be suppressed.

### Command palette (dev/reference affordance)
A small `⌘K` chip fixed bottom-left opens a command palette (search commands like "Go to Dashboard," "View empty state," "Switch to dark theme"). This was built to make every screen state reachable for review — it is **not** part of the target product spec; the developer should omit it or replace it with whatever navigation the real app uses (router links, tabs, etc.) unless the team wants to keep a real command palette.

## State Management
Minimum state needed per the design:
- List of habits, each: `id, name, description, color (hex), interval ('daily'|'weekly'), target (int), startDate, counts` (a per-day check-in count array, unbounded ints, not booleans).
- `selectedHabitId` (detail view), `archivedIds` (or an `archived` flag per habit).
- Derived, not stored: current streak, longest streak, active-day count, completion rate — computed from `counts` + `target` + `interval` (a day/bucket "satisfies" the target when its check-in count, or weekly sum for weekly habits, is ≥ `target`; streaks are runs of satisfied buckets ending at today).
- Theme preference (`light`/`dark`), persisted.
- Editor modal state: open/closed, editing-vs-new, draft object mirroring a habit's editable fields.
- Tooltip state (hovered tile's text + position) — ephemeral UI state, not persisted.

## Design Tokens

### Light theme (default)
| Token | Value | Use |
|---|---|---|
| `bg` | `#F5F3EE` | page background |
| `surface` | `#FFFFFF` | cards, modals |
| `elevated` | `#FAF9F7` | subtle fills (empty-state panel, settled check-in button, badges) |
| `border` | `#E8E5DF` | default hairline borders |
| `border-hi` | `#D4D0C8` | emphasized borders (outlined buttons, hover) |
| `tx1` | `#37352F` | primary text |
| `tx2` | `#6B6B6B` | secondary text |
| `tx3` | `#9B9B9B` | tertiary text / labels |
| `accent` | `#37352F` | secondary-button fill, links |
| `accent-h` | `#2A2825` | accent hover |
| `accent-s` | `#F0EEEA` | accent-tinted subtle background (icon-button hover, active pill) |
| `cta-bg` | `#E8C5A8` (tweakable) | primary CTA fill |
| `cta-text` | `#5C3D1E` | primary CTA text |
| `cta-hover` | `#DEBB9A` | primary CTA hover |
| `red` | `#DC2626` | destructive text (Delete) |
| `green0`…`green4` | `#EDEBE4`, `rgba(22,163,74,.22)`, `.45`, `.72`, `#16A34A` | neutral grid intensity scale (used in the Components sheet's generic legend; per-habit grids use the habit's own color at the same opacity steps: .32/.56/.8/1.0) |
| `focus-ring` | `rgba(196,168,130,.55)` | keyboard focus ring |

### Dark theme
| Token | Value |
|---|---|
| `bg` | `#1E1D1A` |
| `surface` | `#26241F` |
| `elevated` | `#2C2A24` |
| `border` | `#3A3730` |
| `border-hi` | `#4A4640` |
| `tx1` | `#F0EDE6` |
| `tx2` | `#B0AB9E` |
| `tx3` | `#7D786C` |
| `accent` | `#F0EDE6` |
| `accent-h` | `#FFFFFF` |
| `accent-s` | `#33312B` |
| `cta-bg` / `cta-text` / `cta-hover` | same as light (`#E8C5A8` / `#3A2818` / `#DEBB9A`) |
| `red` | `#EF4444` |
| `green0`…`green4` | `#2A2822`, `#173F2B`, `#1F6B44`, `#2B9C5C`, `#3FD37A` |
| `focus-ring` | `rgba(232,197,168,.5)` |

Contrast has been checked for text-on-surface and tile-outline-on-tile in both themes; re-verify after any token substitution.

### Type
- **UI font**: Work Sans (400/500/600/700) — headings, body, buttons, labels.
- **Mono font**: IBM Plex Mono (400/500/600) — all numerals/stats, dates, keycaps, grid-legend text. This split (sans for words, mono for numbers/data) is a deliberate part of the "dev tool" register — keep it.
- Sizes in use: 11px (micro labels/streak lines), 12–13px (body/buttons/inputs), 14–16px (card/section titles), 17px (stat values), 20–22px (page/habit titles).

### Spacing / radii
- Card radius: 12px. Pills/CTA radius: 14–20px. Small icon buttons: 7–10px radius.
- Grid tile: 11×11px, 3px radius, 3px gap.
- Card padding: 20–22px. Section gaps: 16–36px depending on hierarchy.
- Focus ring width: 3px offset ring (box-shadow, not outline, so it doesn't affect layout).

### Background texture
Page background carries a very faint 80×80px grid-line texture (1px lines at ~2.5% opacity in dark / ~2% in light) behind all content — decorative only, do not let it affect contrast of foreground text.

## Assets
No bitmap assets. The settings-icon and empty-state icon are drawn with plain CSS shapes in the reference (a stroked circle, a stroked plus) — swap for the codebase's icon set (e.g. Lucide/Feather "settings" and "plus") in production rather than recreating the CSS shapes.

## Files
- `streak-map-design-reference.html` — the full interactive design reference (Dashboard populated + empty, Habit Detail, Habit Editor modal, Settings, Components sheet). Open directly in any browser. Use the `⌘K` palette or the in-file navigation to reach every screen/state; toggle theme from Settings → Appearance.
