import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useModelInfo } from '@/features/scan/useModelInfo';
import type { ModelScores } from '@/ml/realModelProvider';
import { useSettings } from '@/store/settingsStore';
import { cssVarColor } from '@/utils/severity';
import { cn } from '@/utils/cn';

type GroupKey = 'overall' | 'eye' | 'nails' | 'indianAdults';
const GROUPS: GroupKey[] = ['overall', 'eye', 'nails', 'indianAdults'];

/** Metrics on a 0–1 scale, in chart order. `pct` = shown as a percentage, otherwise as 0.00. */
const CHART_METRICS: Array<{ key: keyof ModelScores; pct: boolean }> = [
  { key: 'accuracy', pct: true },
  { key: 'precision', pct: true },
  { key: 'recall', pct: true },
  { key: 'specificity', pct: true },
  { key: 'f1', pct: false },
  { key: 'auc', pct: false },
  { key: 'r2', pct: false },
];

/** Table rows: chart metrics + error and agreement measures. */
const TABLE_METRICS: Array<{ key: keyof ModelScores; fmt: (v: number) => string }> = [
  ...CHART_METRICS.map((m) => ({ key: m.key, fmt: m.pct ? pct : dec })),
  { key: 'balancedAccuracy', fmt: pct },
  { key: 'severityAccuracy', fmt: pct },
  { key: 'pearsonR', fmt: dec },
  { key: 'mae', fmt: (v) => `${v.toFixed(2)} g/dL` },
  { key: 'rmse', fmt: (v) => `${v.toFixed(2)} g/dL` },
  { key: 'within1', fmt: pct },
  { key: 'within2', fmt: pct },
  { key: 'rangeCoverage', fmt: pct },
  { key: 'n', fmt: (v) => String(v) },
];

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}
function dec(v: number) {
  return v.toFixed(2);
}

interface Row {
  key: string;
  label: string;
  value: number;
  text: string;
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  const r = payload[0].payload as Row;
  return (
    <div className="max-w-64 rounded-xl border border-line bg-surface p-3 text-sm shadow-lift">
      <p className="font-semibold">
        {r.label}: {r.text}
      </p>
      <p className="mt-1 text-ink-muted">{t(`performance.help.${r.key}`)}</p>
    </div>
  );
}

/**
 * Settings → "Model performance": how the trained models scored on people they never saw
 * (person-grouped cross-validation). Bar chart of the main scores + full table for all groups.
 */
export function ModelPerformanceCard() {
  const { t } = useTranslation();
  const info = useModelInfo();
  const theme = useSettings((s) => s.theme);
  const [group, setGroup] = useState<GroupKey>('overall');
  // Re-read the theme colours when light/dark changes.
  const colors = useMemo(
    () => ({ bar: cssVarColor('primary'), grid: cssVarColor('line'), axis: cssVarColor('ink-muted'), ink: cssVarColor('ink') }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme],
  );
  const ev = info?.evaluation;
  if (!ev?.groups.overall) return null;
  const groups = GROUPS.filter((g) => ev.groups[g]);
  const s = ev.groups[group] ?? ev.groups.overall;

  const rows: Row[] = CHART_METRICS.filter((m) => s[m.key] !== null).map((m) => {
    const v = s[m.key] as number;
    return { key: m.key, label: t(`performance.metric.${m.key}`), value: Math.max(0, v), text: m.pct ? pct(v) : dec(v) };
  });

  return (
    <Card>
      <h2 className="flex items-center gap-2 text-h3">
        <BarChart3 className="text-primary" size={22} aria-hidden />
        {t('performance.title')}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">{t('performance.intro', { n: ev.groups.overall.n })}</p>

      <div role="radiogroup" aria-label={t('performance.groupLabel')} className="mt-4 flex flex-wrap gap-2">
        {groups.map((g) => (
          <button
            key={g}
            type="button"
            role="radio"
            aria-checked={group === g}
            onClick={() => setGroup(g)}
            className={cn(
              'min-h-touch rounded-xl border-2 px-3 text-sm font-semibold transition',
              group === g ? 'border-primary bg-primary-light text-primary' : 'border-line hover:border-primary/40',
            )}
          >
            {t(`performance.group.${g}`)}
          </button>
        ))}
      </div>

      <p className="mt-4 text-h2 font-bold tabular-nums">
        {pct(s.accuracy)} <span className="text-base font-semibold text-ink-muted">{t('performance.accuracyHeadline', { n: s.n })}</span>
      </p>

      <div className="mt-2 h-[300px]" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 4 }} barCategoryGap={10}>
            <CartesianGrid horizontal={false} stroke={colors.grid} />
            <XAxis
              type="number"
              domain={[0, 1]}
              ticks={[0, 0.25, 0.5, 0.75, 1]}
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
              tick={{ fill: colors.axis, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis type="category" dataKey="label" width={96} tick={{ fill: colors.ink, fontSize: 13 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: colors.grid, fillOpacity: 0.4 }} />
            <Bar dataKey="value" fill={colors.bar} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
              <LabelList dataKey="text" position="right" fill={colors.ink} fontSize={13} fontWeight={600} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[520px] text-sm">
          <caption className="sr-only">{t('performance.tableCaption')}</caption>
          <thead className="bg-surface-muted text-left">
            <tr>
              <th scope="col" className="p-2 font-semibold">
                {t('performance.metricCol')}
              </th>
              {groups.map((g) => (
                <th key={g} scope="col" className={cn('p-2 text-right font-semibold', g === group && 'text-primary')}>
                  {t(`performance.group.${g}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TABLE_METRICS.map((m) => (
              <tr key={m.key} className="border-t border-line">
                <th scope="row" className="p-2 text-left font-normal">
                  {t(`performance.metric.${m.key}`)}
                </th>
                {groups.map((g) => {
                  const v = ev.groups[g]?.[m.key] as number | null | undefined;
                  return (
                    <td key={g} className={cn('whitespace-nowrap p-2 text-right tabular-nums', g === group && 'font-semibold')}>
                      {v === null || v === undefined ? '—' : m.fmt(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ev.palm?.auc !== undefined && (
        <p className="mt-3 text-sm">
          {t('performance.palm', {
            auc: ev.palm.auc.toFixed(2),
            sens: Math.round((ev.palm.sensitivity ?? 0) * 100),
            spec: Math.round((ev.palm.specificity ?? 0) * 100),
          })}
        </p>
      )}
      <p className="mt-2 text-xs text-ink-muted">{t('performance.method')}</p>
    </Card>
  );
}
