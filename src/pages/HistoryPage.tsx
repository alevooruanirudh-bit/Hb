import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, Droplet, ScanLine } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SeverityChip } from '@/components/ui/SeverityChip';
import { Badge } from '@/components/ui/Badge';
import { HbTrendChart } from '@/components/ui/HbTrendChart';
import { useProfiles } from '@/store/useActiveProfile';
import { scanRepo, toSubject } from '@/db/repositories';
import type { ScanResultRecord } from '@/db/db';
import { severityClassifier } from '@/ml/severityClassifier';
import { formatDate, profileLabel } from '@/utils/profileText';
import { severityStyles } from '@/utils/severity';
import { cn } from '@/utils/cn';
import { judgedHb, rangeText } from '@/utils/hbDisplay';

/** Past scans for the active profile + Hb-over-time chart with the normal band shaded. */
export function HistoryPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { active, profiles } = useProfiles();
  const scans = useLiveQuery(
    () => (active?.id ? scanRepo.listForProfile(active.id) : Promise.resolve([] as ScanResultRecord[])),
    [active?.id],
  );
  const group = active ? severityClassifier.selectGroup(toSubject(active)).group : undefined;
  const normal = group?.normal ?? 12;
  const upper = group?.upper;
  const idx = profiles?.findIndex((p) => p.id === active?.id) ?? 0;

  return (
    <div>
      <PageHeader title={t('history.title')} subtitle={active ? profileLabel(active, idx, t) : undefined} />

      {scans && scans.length === 0 && (
        <Card className="flex flex-col items-center py-12 text-center">
          <p className="text-lg text-ink-muted">{t('history.empty')}</p>
          <Button className="mt-5" icon={ScanLine} onClick={() => navigate('/scan')}>
            {t('home.startScan')}
          </Button>
        </Card>
      )}

      {scans && scans.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <h2 className="text-h3">{t('history.chartTitle')}</h2>
            <p className="mb-3 flex items-center gap-2 text-sm text-ink-muted">
              <span className="inline-block h-3 w-6 rounded bg-severity-normal/20" aria-hidden />
              {upper !== undefined
                ? t('history.healthyBand', { min: normal.toFixed(1), max: upper.toFixed(1) })
                : t('history.normalBand', { value: normal.toFixed(1) })}
            </p>
            {scans.length >= 2 ? (
              <HbTrendChart scans={scans} normalThreshold={normal} upperNormal={upper} height={300} />
            ) : (
              <p className="text-ink-muted">{t('home.trendEmpty')}</p>
            )}
          </Card>

          <section className="lg:col-span-2" aria-label={t('history.listLabel')}>
            <ul className="space-y-3">
              {scans.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/history/${s.id}`)}
                    className="flex w-full items-center gap-4 rounded-card bg-surface p-4 text-left shadow-soft transition hover:shadow-lift"
                  >
                    <span className="w-24 shrink-0">
                      <span className={cn('block text-h2 tabular-nums', severityStyles[s.severity].text)}>
                        {judgedHb(s).value.toFixed(1)}
                      </span>
                      {rangeText(s) && <span className="block text-xs text-ink-muted tabular-nums">{rangeText(s)}</span>}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <SeverityChip severity={s.severity} size="sm" />
                        {s.isDemo && <Badge tone="demo">{t('demo.badge')}</Badge>}
                        {s.bloodTest && (
                          <Badge tone="info">{t('history.bloodTest', { value: s.bloodTest.labHb.toFixed(1) })}</Badge>
                        )}
                        {!s.isDemo && s.modelSource === 'mock' && <Badge tone="info">{t('simulated.badge')}</Badge>}
                      </span>
                      <span className="mt-1 block text-sm text-ink-muted">
                        {formatDate(s.timestamp, i18n.language, true)} ·{' '}
                        {s.regions.map((r) => t(`regions.${r.region}.short`)).join(', ')}
                      </span>
                    </span>
                    <ChevronRight className="text-ink-muted" aria-hidden />
                  </button>
                  {/* Optional real blood test value — only for trained-model scans of a real photo. */}
                  {s.modelSource === 'real' && !s.isDemo && !s.bloodTest && (
                    <button
                      type="button"
                      onClick={() => navigate(`/history/${s.id}?bloodtest=1`)}
                      className="mt-1 flex min-h-touch w-full items-center gap-2 rounded-xl px-4 text-left text-sm font-semibold text-primary hover:bg-primary-light"
                    >
                      <Droplet size={18} aria-hidden />
                      {t('history.addBloodTest')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
