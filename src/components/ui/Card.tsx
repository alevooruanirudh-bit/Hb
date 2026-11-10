import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Renders as a focusable, pressable card. */
  interactive?: boolean;
  tone?: 'default' | 'primary' | 'secondary' | 'muted';
}

const tones = {
  default: 'bg-surface',
  primary: 'bg-primary-light',
  secondary: 'bg-secondary-light',
  muted: 'bg-surface-muted',
};

/** Rounded (20px) surface with soft elevation — the basic layout block of the app. */
export function Card({ children, interactive, tone = 'default', className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card p-5 shadow-soft md:p-6',
        tones[tone],
        interactive && 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-lift',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
