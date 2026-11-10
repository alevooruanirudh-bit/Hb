import { cn } from '@/utils/cn';
import type { LucideIcon } from 'lucide-react';

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

/** Accessible switch row (role="switch") used in Settings. */
export function Toggle({ checked, onChange, label, description, icon: Icon, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-[56px] w-full items-center gap-4 rounded-2xl px-2 py-2 text-left hover:bg-ink/5 disabled:opacity-50"
    >
      {Icon && (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
          <Icon size={22} aria-hidden />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{label}</span>
        {description && <span className="block text-sm text-ink-muted">{description}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          'relative h-8 w-14 shrink-0 rounded-pill transition-colors',
          checked ? 'bg-secondary' : 'bg-line',
        )}
      >
        <span
          className={cn(
            'absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-7' : 'translate-x-1',
          )}
        />
      </span>
    </button>
  );
}
