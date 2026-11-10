import { useTranslation } from 'react-i18next';
import { ScanLine } from 'lucide-react';

/**
 * Shown only on old scans saved by an earlier test build (MockModelProvider). Every new result
 * comes from the trained models; this asks the person to scan again for a full result.
 */
export function SimulatedBanner({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <section role="note" className={`flex gap-3 rounded-card border border-line bg-secondary-light p-4 md:p-5 ${className}`}>
      <ScanLine className="mt-0.5 shrink-0 text-secondary" size={26} aria-hidden />
      <div>
        <h2 className="text-lg font-bold">{t('simulated.title')}</h2>
        <p className="mt-1">{t('simulated.body')}</p>
      </div>
    </section>
  );
}
