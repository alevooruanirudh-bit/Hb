import { useTranslation } from 'react-i18next';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import type { ScanResultRecord } from '@/db/db';
import { cssVarColor, severityStyles } from '@/utils/severity';
import { useSettings } from '@/store/settingsStore';
import { formatDate } from '@/utils/profileText';
import { cn } from '@/utils/cn';
import { judgedHb } from '@/utils/hbDisplay';

interface HbTrendChartProps {
  scans: ScanResultRecord[];
  /** Lower bound of the normal band for the profile (shaded). */
  normalThreshold: number;
  /** Top of the typical healthy range; the shaded band spans normalThreshold–upperNormal. */
  upperNormal?: number;
  height?: number;
  /** Sparkline mode for the home card: no axes. */
  compact?: boolean;
}

interface Point {
  ts: number;
  hb: number;
  severity: ScanResultRecord['severity'];
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  const { t, i18n } = useTranslation();
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as Point;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-lift">
      <div className="text-ink-muted">{formatDate(p.ts, i18n.language)}</div>
      <div className="text-lg font-bold text-ink">
        {p.hb.toFixed(1)} {t('common.gdl')}
      </div>
      <div className="flex items-center gap-1.5 font-semibold text-ink">
        <span className={cn('h-2.5 w-2.5 rounded-full', severityStyles[p.severity].bg)} aria-hidden />
        {t(`severity.${p.severity}`)}
      </div>
    </div>
  );
}

/**
 * Hb over time with the normal range shaded. Single series → no legend box;
 * markers are colored by severity (status) and the tooltip names it, so
 * meaning is never carried by color alone.
 */
export function HbTrendChart({ scans, normalThreshold, upperNormal, height = 260, compact }: HbTrendChartProps) {
  const { t, i18n } = useTranslation();
  // Recharts draws SVG with presentation attributes, so resolve theme tokens to colors
  // (re-read whenever the theme setting changes).
  useSettings((s) => s.theme);
  const colors = {
    line: cssVarColor('primary'),
    band: cssVarColor('sev-normal', 0.14),
    grid: cssVarColor('line'),
    axis: cssVarColor('ink-muted'),
    surface: cssVarColor('surface'),
  };
  const sevColor = (s: Point['severity']) => cssVarColor(`sev-${s}`);
  const data: Point[] = [...scans]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((s) => ({ ts: s.timestamp, hb: judgedHb(s).value, severity: s.severity }));
  const values = data.map((d) => d.hb);
  const yMin = Math.floor(Math.min(6, ...values) - 0.5);
  const yMax = Math.ceil(Math.max(16, ...values) + 0.5);

  const Dot = (props: { cx?: number; cy?: number; payload?: Point }) => {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined || !payload) return null;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={compact ? 4 : 5.5}
        fill={sevColor(payload.severity)}
        stroke={colors.surface}
        strokeWidth={2}
      />
    );
  };

  return (
    <div
      style={{ height }}
      role="img"
      aria-label={t('history.chartAria', { count: data.length, latest: values.at(-1)?.toFixed(1) ?? '-' })}
      className="w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={
            compact ? { top: 8, right: 8, bottom: 8, left: 8 } : { top: 12, right: 16, bottom: 4, left: -8 }
          }
        >
          <ReferenceArea
            y1={normalThreshold}
            y2={Math.min(yMax, upperNormal ?? yMax)}
            fill={colors.band}
            fillOpacity={1}
            ifOverflow="hidden"
          />
          {!compact && <CartesianGrid vertical={false} stroke={colors.grid} />}
          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            hide={compact}
            tickFormatter={(v: number) => formatDate(v, i18n.language).replace(/\s\d{4}$/, '')}
            tick={{ fill: colors.axis, fontSize: 14 }}
            axisLine={false}
            tickLine={false}
            padding={{ left: 16, right: 16 }}
          />
          <YAxis
            domain={[yMin, yMax]}
            hide={compact}
            tick={{ fill: colors.axis, fontSize: 14 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: colors.axis, strokeDasharray: '4 4' }} />
          <Line
            type="monotone"
            dataKey="hb"
            stroke={colors.line}
            strokeWidth={2}
            dot={<Dot />}
            activeDot={{ r: 7, fill: colors.line, stroke: colors.surface, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
