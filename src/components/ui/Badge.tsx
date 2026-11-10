import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

const tones = {
  success: 'bg-severity-normal/10 text-severity-normal',
  warning: 'bg-severity-mild/15 text-ink',
  info: 'bg-secondary-light text-secondary',
  primary: 'bg-primary-light text-primary',
  demo: 'bg-secondary text-secondary-on',
};

/** Small labeled badge (reliability, demo, model used). */
export function Badge({
  tone,
  icon: Icon,
  children,
  className,
}: {
  tone: keyof typeof tones;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-sm font-semibold',
        tones[tone],
        className,
      )}
    >
      {Icon && <Icon size={16} aria-hidden />}
      {children}
    </span>
  );
}
