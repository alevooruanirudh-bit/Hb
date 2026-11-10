import { motion } from 'framer-motion';

interface LogoProps {
  size?: number;
  /** Gently pulses the droplet (splash / processing). */
  animated?: boolean;
  className?: string;
  title?: string;
}

/**
 * HemoScan logo: a rounded blood drop with a heartbeat line inside.
 * Uses `currentColor`-free explicit tokens so it adapts to the theme.
 */
export function Logo({ size = 48, animated = false, className, title = 'HemoScan' }: LogoProps) {
  return (
    <motion.svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={title}
      className={className}
      animate={animated ? { scale: [1, 1.06, 1] } : undefined}
      transition={animated ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      <path d="M32 4C32 4 12 27 12 41a20 20 0 0 0 40 0C52 27 32 4 32 4Z" className="fill-primary" />
      <motion.path
        d="M19 42h8l3-7 4 13 3-6h8"
        fill="none"
        className="stroke-primary-light"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : false}
        animate={animated ? { pathLength: [0, 1, 1] } : undefined}
        transition={animated ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />
    </motion.svg>
  );
}
