import type { Region } from '@/ml/types';

type Kind = Region | 'all';

/**
 * Simple, friendly line illustrations for each scan region. Pure SVG using
 * theme tokens, so they adapt to dark mode and scale on projectors.
 */
export function RegionIllustration({ kind, size = 72 }: { kind: Kind; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 80 80', 'aria-hidden': true } as const;
  switch (kind) {
    case 'eye':
      return (
        <svg {...common}>
          <circle cx="40" cy="40" r="38" className="fill-primary-light" />
          <path
            d="M12 38c8-12 18-17 28-17s20 5 28 17c-8 12-18 17-28 17S20 50 12 38Z"
            className="fill-surface stroke-ink"
            strokeWidth="2.5"
          />
          <circle cx="40" cy="34" r="9" className="fill-secondary" />
          <circle cx="40" cy="34" r="4" className="fill-ink" />
          <path
            d="M20 46c6 7 13 10 20 10s14-3 20-10"
            className="fill-none stroke-primary"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M40 60v8m-6-2 6 4 6-4"
            className="fill-none stroke-ink-muted"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'nails':
      return (
        <svg {...common}>
          <circle cx="40" cy="40" r="38" className="fill-primary-light" />
          {[18, 31, 44, 57].map((x, i) => (
            <g key={x}>
              <rect
                x={x}
                y={14 + (i === 0 || i === 3 ? 6 : 0)}
                width="11"
                height="46"
                rx="5.5"
                className="fill-surface stroke-ink"
                strokeWidth="2"
              />
              <rect
                x={x + 2}
                y={16 + (i === 0 || i === 3 ? 6 : 0)}
                width="7"
                height="9"
                rx="3.5"
                className="fill-primary"
                opacity="0.75"
              />
            </g>
          ))}
        </svg>
      );
    case 'palm':
      return (
        <svg {...common}>
          <circle cx="40" cy="40" r="38" className="fill-primary-light" />
          <path
            d="M26 70V42l-6-12c-1.5-3 2.5-5 4.5-2.5L30 36V14c0-3.5 5-3.5 5 0v18V10c0-3.5 5-3.5 5 0v22V13c0-3.5 5-3.5 5 0v20V19c0-3.5 5-3.5 5 0v27c0 12-6 18-8 24Z"
            className="fill-surface stroke-ink"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <circle cx="41" cy="50" r="7" className="fill-primary" opacity="0.55" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="40" cy="40" r="38" className="fill-secondary-light" />
          <circle cx="26" cy="30" r="10" className="fill-surface stroke-secondary" strokeWidth="2.5" />
          <circle cx="26" cy="30" r="3.5" className="fill-secondary" />
          <rect
            x="44"
            y="18"
            width="8"
            height="24"
            rx="4"
            className="fill-surface stroke-secondary"
            strokeWidth="2.5"
          />
          <rect
            x="54"
            y="20"
            width="8"
            height="22"
            rx="4"
            className="fill-surface stroke-secondary"
            strokeWidth="2.5"
          />
          <path
            d="M22 50h36v14a8 8 0 0 1-8 8H30a8 8 0 0 1-8-8Z"
            className="fill-surface stroke-secondary"
            strokeWidth="2.5"
          />
          <path
            d="m30 60 6 5 12-12"
            className="fill-none stroke-primary"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}
