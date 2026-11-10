import type { Severity } from '@/ml/types';

/** Tailwind class sets per severity, so the same colors are used everywhere. */
export const severityStyles: Record<
  Severity,
  { bg: string; text: string; soft: string; ring: string; fill: string }
> = {
  normal: {
    bg: 'bg-severity-normal',
    text: 'text-severity-normal',
    soft: 'bg-severity-normal/10',
    ring: 'ring-severity-normal/40',
    fill: 'fill-severity-normal',
  },
  mild: {
    bg: 'bg-severity-mild',
    text: 'text-severity-mild',
    soft: 'bg-severity-mild/15',
    ring: 'ring-severity-mild/40',
    fill: 'fill-severity-mild',
  },
  moderate: {
    bg: 'bg-severity-moderate',
    text: 'text-severity-moderate',
    soft: 'bg-severity-moderate/10',
    ring: 'ring-severity-moderate/40',
    fill: 'fill-severity-moderate',
  },
  severe: {
    bg: 'bg-severity-severe',
    text: 'text-severity-severe',
    soft: 'bg-severity-severe/10',
    ring: 'ring-severity-severe/40',
    fill: 'fill-severity-severe',
  },
};

/** Fixed brand hex values (light theme) — used where CSS variables are unavailable (PDF, canvas). */
export const severityHex: Record<Severity, string> = {
  normal: '#2E9E5B',
  mild: '#E0A800',
  moderate: '#E86A1C',
  severe: '#C62828',
};

/** Reads a design token (RGB triplet CSS variable) as a CSS color string at runtime. */
export function cssVarColor(name: string, alpha = 1): string {
  if (typeof document === 'undefined') return '#000';
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
  return v ? `rgb(${v.split(' ').join(', ')}, ${alpha})` : '#000';
}
