import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronRight, Info, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { RegionIllustration } from '@/components/illustrations/RegionIllustration';
import { Badge } from '@/components/ui/Badge';
import { useScanSession } from '@/store/scanStore';
import type { Region } from '@/ml/types';
import { useSupportedRegions } from '@/features/scan/useSupportedRegions';
import { cn } from '@/utils/cn';

type Choice = Region | 'all';

/** Choose Eye / Nails / Palm, or Scan All (recommended). */
export function RegionSelectPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const start = useScanSession((s) => s.start);
  const { regions: supported, likelihoodRegions } = useSupportedRegions();
  // A region with only an anemia check (palm) cannot give a hemoglobin number on its own.
  const selectable = (c: Choice) => c === 'all' || (supported.includes(c) && !likelihoodRegions.includes(c));

  const choose = (c: Choice) => {
    if (!selectable(c)) return;
    start(c === 'all' ? supported : [c]);
    navigate('/scan/method');
  };

  const cards: Choice[] = ['all', 'eye', 'nails', 'palm'];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t('regionSelect.title')} subtitle={t('regionSelect.subtitle')} back="/home" />
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((c, i) => (
          <motion.button
            key={c}
            type="button"
            onClick={() => choose(c)}
            disabled={!selectable(c)}
            aria-disabled={!selectable(c)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={cn(
              'group flex items-center gap-4 rounded-card bg-surface p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0',
              c === 'all' && 'ring-2 ring-secondary/60 md:col-span-2',
            )}
          >
            <RegionIllustration kind={c} size={c === 'all' ? 84 : 72} />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-h3">{t(`regions.${c}.name`)}</span>
                {c === 'all' && (
                  <Badge tone="info" icon={Sparkles}>
                    {t('regionSelect.recommended')}
                  </Badge>
                )}
              </span>
              <span className="mt-1 block text-ink-muted">
                {c !== 'all' && likelihoodRegions.includes(c)
                  ? t('regionSelect.checkOnly')
                  : c !== 'all' && !supported.includes(c)
                  ? t('regionSelect.notTrained')
                  : c === 'all'
                    ? t('regionSelect.scanAllIncludes', { list: supported.map((r) => t(`regions.${r}.short`)).join(', ') })
                    : t(`regions.${c}.tip`)}
              </span>
            </span>
            <ChevronRight
              className="shrink-0 text-ink-muted transition group-hover:translate-x-1"
              aria-hidden
            />
          </motion.button>
        ))}
      </div>
      <p className="mt-6 flex gap-3 rounded-2xl bg-secondary-light p-4 text-secondary">
        <Info className="mt-0.5 shrink-0" size={22} aria-hidden />
        <span className="font-medium">{t('regionSelect.reliabilityNote')}</span>
      </p>
    </div>
  );
}
