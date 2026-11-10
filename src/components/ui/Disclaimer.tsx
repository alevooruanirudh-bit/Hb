import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

/** The screening disclaimer. Shown on results, guidance, reports and onboarding. */
export function Disclaimer({ className, compact }: { className?: string; compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <aside
      className={cn(
        'flex gap-3 rounded-2xl border border-line bg-surface-muted p-4 text-ink-muted',
        className,
      )}
      aria-label={t('app.disclaimerTitle')}
    >
      <ShieldAlert size={22} className="mt-0.5 shrink-0 text-secondary" aria-hidden />
      <p className={compact ? 'text-sm' : 'text-base'}>{t('app.disclaimer')}</p>
    </aside>
  );
}
