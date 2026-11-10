import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface StatusPillProps {
  label: string;
  state: 'ok' | 'warn' | 'pending';
}

/** Small live-quality indicator (Focus / Lighting / Position) on the capture screen. */
export function StatusPill({ label, state }: StatusPillProps) {
  const Icon = state === 'ok' ? CheckCircle2 : state === 'warn' ? AlertTriangle : Loader2;
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-semibold backdrop-blur-md transition-colors',
        state === 'ok' && 'bg-severity-normal/90 text-white',
        state === 'warn' && 'bg-severity-mild/95 text-black',
        state === 'pending' && 'bg-black/50 text-white',
      )}
    >
      <Icon size={16} aria-hidden className={state === 'pending' ? 'animate-spin' : undefined} />
      {label}
    </span>
  );
}
