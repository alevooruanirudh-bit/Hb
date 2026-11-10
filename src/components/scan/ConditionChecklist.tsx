import { useTranslation } from 'react-i18next';
import { Check, ClipboardCheck } from 'lucide-react';
import { REGION_CONDITIONS } from '@/ml/confounders';
import type { Region, ReportedCondition } from '@/ml/types';
import { useScanSession } from '@/store/scanStore';
import { cn } from '@/utils/cn';

/**
 * "Before you scan" checklist: things that make the eyelid / nails / palm
 * look redder or paler than the blood really is (crying, polish or mehndi,
 * injury, freshly cut nails, cold hands …). Ticked items lower — or remove —
 * that region's weight in the combined result, and are explained on Results.
 */
export function ConditionChecklist({ region }: { region: Region }) {
  const { t } = useTranslation();
  const selected = useScanSession((s) => s.conditions[region] ?? []);
  const setConditions = useScanSession((s) => s.setConditions);

  const toggle = (c: ReportedCondition) =>
    setConditions(region, selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c]);

  return (
    <section className="mb-5 rounded-card bg-surface p-4 shadow-soft" aria-labelledby={`chk-${region}`}>
      <h2 id={`chk-${region}`} className="flex items-center gap-2 text-lg font-semibold">
        <ClipboardCheck className="text-secondary" size={22} aria-hidden />
        {t('conditions.title')}
      </h2>
      <p className="mb-3 text-sm text-ink-muted">{t('conditions.subtitle')}</p>
      <div className="flex flex-col gap-2">
        {REGION_CONDITIONS[region].map((c) => {
          const on = selected.includes(c);
          return (
            <button
              key={c}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => toggle(c)}
              className={cn(
                'flex min-h-touch items-center gap-3 rounded-xl border-2 px-3 py-2 text-left transition',
                on ? 'border-severity-mild bg-severity-mild/15' : 'border-line hover:border-primary/40',
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2',
                  on ? 'border-severity-mild bg-severity-mild text-black' : 'border-ink-muted',
                )}
                aria-hidden
              >
                {on && <Check size={16} strokeWidth={3} />}
              </span>
              <span>{t(`conditions.items.${c}`)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
