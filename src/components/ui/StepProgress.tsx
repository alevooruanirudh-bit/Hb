import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

/** "1 of 3" progress indicator used in multi-region (Scan All) flows. */
export function StepProgress({
  current,
  total,
  className,
}: {
  current: number;
  total: number;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn('h-2 rounded-pill transition-all', i < current ? 'w-8 bg-primary' : 'w-4 bg-line')}
          />
        ))}
      </div>
      <span className="text-sm font-semibold" aria-live="polite">
        {t('common.stepOf', { current, total })}
      </span>
    </div>
  );
}
