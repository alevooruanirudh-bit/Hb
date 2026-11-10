import { useTranslation } from 'react-i18next';
import { Database } from 'lucide-react';
import { useModelInfo } from '@/features/scan/useModelInfo';

/**
 * "What this estimate is based on": which public datasets trained each
 * region's model and its measured typical error — shown with every result
 * from trained models so users can judge how much to trust it.
 */
export function ModelInfoNote({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  const info = useModelInfo();
  if (!info?.datasets?.length) return null;
  const mae = info.metrics?.per_region_mae ?? {};
  const pc = info.metrics?.palm_classifier;
  return (
    <section className={`rounded-card border border-line bg-surface-muted p-4 md:p-5 ${className}`}>
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Database className="text-secondary" size={22} aria-hidden />
        {t('modelNote.title')}
      </h2>
      <ul className="mt-2 space-y-1.5 text-sm">
        {info.datasets.map((d) => (
          <li key={d.region}>
            <span className="font-semibold">{t(`regions.${d.region}.short`)}:</span>{' '}
            {d.kind === 'classifier'
              ? t('modelNote.trainedOnPhotos', { population: d.population, n: d.n })
              : t('modelNote.trainedOn', { population: d.population, n: d.n })}
            {mae[d.region] !== undefined && <> · {t('modelNote.typicalError', { mae: mae[d.region].toFixed(1) })}</>}
            {d.kind === 'classifier' && pc && (
              <> · {t('modelNote.classifierMetrics', { sens: Math.round(pc.sensitivity * 100), spec: Math.round(pc.specificity * 100) })}</>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-ink-muted">{t('modelNote.caveat')}</p>
    </section>
  );
}
