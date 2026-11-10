import { useTranslation } from 'react-i18next';
import { AlertTriangle, Mountain, Palette, SlidersHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { ScanOutcome } from '@/ml/types';
import { SKIN_TONE_SWATCHES } from '@/imageProcessing/skinTone';

/**
 * "What we took into account": altitude adjustment, skin tone and every
 * confounder (reported or detected) that lowered or removed a region's
 * weight. Renders nothing when no adjustment applied.
 */
export function AdjustmentsCard({ outcome }: { outcome: ScanOutcome }) {
  const { t } = useTranslation();
  const alt = outcome.altitudeAdjustment ?? 0;
  const affected = outcome.regions.filter((r) => (r.confounderFactor ?? 1) < 1);
  const mismatched = outcome.regions.filter((r) => r.populationMismatch);
  const outOfRange = outcome.regions.filter((r) => r.outOfRange && !r.likelihoodOnly);
  const cal = outcome.personalCalibration;
  const dev = outcome.deviceCorrection;
  const palm = outcome.regions.find((r) => r.region === 'palm');
  const palmSkin = palm && (palm.skinFactor ?? 1) < 1;

  if (!alt && !affected.length && !mismatched.length && !outOfRange.length && !cal && !dev && !outcome.skinTone && !outcome.allRegionsAffected)
    return null;

  return (
    <Card>
      <h2 className="flex items-center gap-2 text-h3">
        <SlidersHorizontal className="text-secondary" size={22} aria-hidden />
        {t('adjustments.title')}
      </h2>
      <ul className="mt-3 space-y-3">
        {outcome.allRegionsAffected && (
          <li className="flex gap-3 rounded-2xl bg-severity-severe/10 p-3 font-semibold" role="alert">
            <AlertTriangle className="mt-0.5 shrink-0 text-severity-severe" size={20} aria-hidden />
            {t('adjustments.allAffected')}
          </li>
        )}
        {alt > 0 && (
          <li className="flex gap-3">
            <Mountain className="mt-0.5 shrink-0 text-secondary" size={20} aria-hidden />
            <span>
              {t('adjustments.altitude', {
                adj: alt.toFixed(1),
                hb: outcome.hb.toFixed(1),
                adjusted: (outcome.hbAdjusted ?? outcome.hb).toFixed(1),
              })}
            </span>
          </li>
        )}
        {outcome.skinTone && (
          <li className="flex gap-3">
            <Palette className="mt-0.5 shrink-0 text-secondary" size={20} aria-hidden />
            <span className="flex flex-wrap items-center gap-2">
              <span className="inline-block h-4 w-4 rounded-full ring-1 ring-line" style={{ background: SKIN_TONE_SWATCHES[outcome.skinTone.category] }} aria-hidden />
              {t('adjustments.skinTone', {
                tone: t(`skinTone.${outcome.skinTone.category}`),
                source: t(`profile.skinToneSource.${outcome.skinTone.source}`),
              })}
              {palmSkin && <span className="text-ink-muted">— {t('adjustments.palmLessWeight')}</span>}
            </span>
          </li>
        )}
        {cal && (
          <li className="rounded-2xl bg-severity-normal/10 p-3 text-sm">
            {t('calibration.applied', {
              offset: (cal.offset >= 0 ? '+' : '') + cal.offset.toFixed(1),
              n: cal.tests,
              raw: (outcome.hbUncalibrated ?? outcome.hb).toFixed(1),
            })}
          </li>
        )}
        {dev && (
          <li className="rounded-2xl bg-severity-normal/10 p-3 text-sm">
            {t('learning.applied', {
              offset: (dev.offset >= 0 ? '+' : '') + dev.offset.toFixed(1),
              n: dev.pairs,
              raw: (outcome.hbUncalibrated ?? outcome.hb).toFixed(1),
            })}
          </li>
        )}
        {outOfRange.map((r) => (
          <li key={`oor-${r.region}`} className="rounded-2xl bg-severity-mild/15 p-3 text-sm">
            <span className="font-semibold">{t(`regions.${r.region}.short`)}:</span> {t('adjustments.outOfRange')}
          </li>
        ))}
        {mismatched.map((r) => (
          <li key={`pop-${r.region}`} className="rounded-2xl bg-secondary-light p-3 text-sm">
            <span className="font-semibold">{t(`regions.${r.region}.short`)}:</span> {t(`adjustments.population.${r.region}`)}
          </li>
        ))}
        {affected.map((r) => (
          <li key={r.region} className="rounded-2xl bg-severity-mild/15 p-3">
            <p className="font-semibold">
              {t(`regions.${r.region}.short`)}: {r.confounderFactor === 0 ? t('adjustments.excluded') : t('adjustments.lessWeight')}
            </p>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {(r.conditions ?? []).map((c) => (
                <li key={c}>{t(`conditions.effects.${c}`)}</li>
              ))}
              {(r.imageFlags ?? []).map((f) => (
                <li key={f}>{t(`conditions.imageFlags.${f}`)}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Card>
  );
}
