import type { Config } from 'tailwindcss';

/**
 * HemoScan design system tokens.
 *
 * Colors are defined as CSS variables (RGB triplets) in `src/index.css` so that
 * light and dark themes swap at runtime while Tailwind utilities (including
 * opacity modifiers like `bg-primary/10`) keep working.
 */
const withVar = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: withVar('primary'),
          light: withVar('primary-light'),
          dark: withVar('primary-dark'),
          on: withVar('on-primary'),
        },
        secondary: {
          DEFAULT: withVar('secondary'),
          light: withVar('secondary-light'),
          on: withVar('on-secondary'),
        },
        background: withVar('background'),
        surface: { DEFAULT: withVar('surface'), muted: withVar('surface-muted') },
        ink: { DEFAULT: withVar('ink'), muted: withVar('ink-muted') },
        line: withVar('line'),
        severity: {
          normal: withVar('sev-normal'),
          mild: withVar('sev-mild'),
          moderate: withVar('sev-moderate'),
          severe: withVar('sev-severe'),
        },
      },
      fontFamily: {
        sans: ['"Noto Sans"', '"Noto Sans Telugu"', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Body never below 16px; headings 22–32px; Hb number 56px.
        base: ['1rem', { lineHeight: '1.6' }],
        lg: ['1.125rem', { lineHeight: '1.6' }],
        h3: ['1.375rem', { lineHeight: '1.35', fontWeight: '600' }],
        h2: ['1.625rem', { lineHeight: '1.3', fontWeight: '700' }],
        h1: ['2rem', { lineHeight: '1.25', fontWeight: '700' }],
        hb: ['3.5rem', { lineHeight: '1', fontWeight: '800' }],
      },
      borderRadius: {
        card: '20px',
        pill: '999px',
      },
      boxShadow: {
        soft: '0 2px 10px -2px rgb(var(--shadow) / 0.08), 0 8px 24px -8px rgb(var(--shadow) / 0.12)',
        lift: '0 6px 18px -4px rgb(var(--shadow) / 0.16), 0 16px 40px -12px rgb(var(--shadow) / 0.2)',
      },
      minHeight: { touch: '48px' },
      minWidth: { touch: '48px' },
      keyframes: {
        pulseDrop: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.08)', opacity: '0.85' },
        },
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '0.5' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
      },
      animation: {
        'pulse-drop': 'pulseDrop 1.6s ease-in-out infinite',
        ripple: 'ripple 1.8s ease-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
