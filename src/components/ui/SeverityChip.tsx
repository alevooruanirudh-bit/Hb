import { useTranslation } from 'react-i18next';
import type { Severity } from '@/ml/types';
import { severityStyles } from '@/utils/severity';
import { cn } from '@/utils/cn';

interface SeverityChipProps {
  severity: Severity;
  size?: 'sm' | 'md';
  className?: string;
}

/** Colored pill showing a severity level, with a dot so it is not color-only. */
export function SeverityChip({ severity, size = 'md', className }: SeverityChipProps) {
  const { t } = useTranslation();
  const s = severityStyles[severity];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill font-semibold',
        s.soft,
        s.text,
        size === 'sm' ? 'px-2.5 py-0.5 text-sm' : 'px-3 py-1 text-base',
        className,
      )}
    >
      <span className={cn('h-2.5 w-2.5 rounded-full', s.bg)} aria-hidden />
      {t(`severity.${severity}`)}
    </span>
  );
}
