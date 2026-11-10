/** Onboarding illustrations: 0 = phone scanning, 1 = body parts, 2 = screening shield. */
export function OnboardingIllustration({ step }: { step: number }) {
  const common = { width: 220, height: 220, viewBox: '0 0 220 220', 'aria-hidden': true } as const;
  if (step === 0) {
    return (
      <svg {...common}>
        <circle cx="110" cy="110" r="100" className="fill-primary-light" />
        <rect
          x="70"
          y="36"
          width="80"
          height="148"
          rx="16"
          className="fill-surface stroke-ink"
          strokeWidth="4"
        />
        <rect x="80" y="54" width="60" height="96" rx="8" className="fill-secondary-light" />
        <path d="M110 70s-18 22-18 34a18 18 0 0 0 36 0c0-12-18-34-18-34Z" className="fill-primary" />
        <path
          d="M98 106h7l3-6 4 11 3-5h7"
          className="fill-none stroke-primary-light"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="110" cy="166" r="6" className="fill-line" />
        <path
          d="M40 60l14 8M36 110h16M40 160l14-8M180 60l-14 8M184 110h-16M180 160l-14-8"
          className="stroke-secondary"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (step === 1) {
    return (
      <svg {...common}>
        <circle cx="110" cy="110" r="100" className="fill-secondary-light" />
        <g transform="translate(36 40)">
          <path
            d="M4 36c10-14 22-20 34-20s24 6 34 20c-10 14-22 20-34 20S14 50 4 36Z"
            className="fill-surface stroke-ink"
            strokeWidth="3"
          />
          <circle cx="38" cy="32" r="10" className="fill-secondary" />
          <path
            d="M16 46c7 7 14 10 22 10s15-3 22-10"
            className="fill-none stroke-primary"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>
        <g transform="translate(120 36)">
          {[0, 16, 32].map((x) => (
            <g key={x}>
              <rect
                x={x}
                y="0"
                width="13"
                height="56"
                rx="6.5"
                className="fill-surface stroke-ink"
                strokeWidth="2.5"
              />
              <rect x={x + 2.5} y="3" width="8" height="11" rx="4" className="fill-primary" opacity="0.75" />
            </g>
          ))}
        </g>
        <g transform="translate(76 112)">
          <path
            d="M14 76V44L7 30c-2-4 3-6 5-3l7 9V10c0-4 6-4 6 0v22V6c0-4 6-4 6 0v26V8c0-4 6-4 6 0v24V14c0-4 6-4 6 0v32c0 14-7 22-9 30Z"
            className="fill-surface stroke-ink"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <circle cx="31" cy="52" r="8" className="fill-primary" opacity="0.55" />
        </g>
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="110" cy="110" r="100" className="fill-primary-light" />
      <path
        d="M110 34l58 22v44c0 40-26 68-58 82-32-14-58-42-58-82V56Z"
        className="fill-surface stroke-secondary"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path d="M110 70v36" className="stroke-primary" strokeWidth="10" strokeLinecap="round" />
      <circle cx="110" cy="130" r="6.5" className="fill-primary" />
      <rect
        x="138"
        y="136"
        width="44"
        height="54"
        rx="8"
        className="fill-surface stroke-ink"
        strokeWidth="3"
      />
      <path
        d="M160 148v12m-6-6h12"
        className="stroke-severity-severe"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M148 172h24M148 180h16" className="stroke-line" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
