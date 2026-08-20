export const DEFAULT_HABIT_COLOR = '#39d353';

/**
 * Habit colors rendered with GitHub's *exact* contribution greens rather than a derived ramp:
 * the current default and the legacy pre-GitHub-match default.
 */
const GITHUB_GREENS = new Set([DEFAULT_HABIT_COLOR, '#4b8a5e']);

/**
 * GitHub's ramp is not one color at four opacities — each step is its own hue/saturation/lightness.
 * Flattening it to an alpha ramp is what makes a grid read as washed out next to GitHub's. So we
 * keep the habit's hue, floor its saturation, and take lightness from per-theme CSS vars that carry
 * GitHub's steps (dark: 16/21/40/52%, light: 76/51/41/28%).
 */
const SATURATION_FLOOR = 55;

function hexToHs(hex: string): { h: number; s: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const int = Number.parseInt(m[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  if (d === 0) return { h: 0, s: 0 };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return { h, s: Math.round(s * 100) };
}

/** Inline style for a tile (or legend swatch) at `level` (0-4). */
export function tileFill(color: string, level: number): React.CSSProperties {
  if (level === 0) return { backgroundColor: 'var(--elevated)' };
  if (GITHUB_GREENS.has(color.toLowerCase())) {
    return { backgroundColor: `var(--lvl-${level})` };
  }
  const hs = hexToHs(color);
  if (!hs) return { backgroundColor: color };
  const s = Math.max(hs.s, SATURATION_FLOOR);
  return { backgroundColor: `hsl(${hs.h} ${s}% var(--lvl-l-${level}))` };
}

export const ACCENT_SWATCHES: string[] = [
  '#C4574F',
  '#C97C3D',
  '#BFA13A',
  '#7C9A4A',
  '#4C9C82',
  '#3E8FA3',
  '#4C6FA8',
  '#7B62A8',
  '#A85C93',
  '#6B6558',
];
