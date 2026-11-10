import { useEffect, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { Severity } from '@/ml/types';
import { severityStyles } from '@/utils/severity';
import { cn } from '@/utils/cn';

interface HbGaugeProps {
  hb: number;
  severity: Severity;
  /** Band lower bounds for the subject's WHO group. */
  thresholds: { normal: number; mild: number; moderate: number };
  /** Likely range [low, high] — drawn as a band on the outer ring and printed under the value. */
  range?: [number, number];
  size?: number;
}

const MIN = 4;
const MAX = 18;
const START = 225; // degrees clockwise from 12 o’clock; 270° arc with the gap at the bottom
const SWEEP = 270;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, from: number, to: number) {
  const a = polar(cx, cy, r, to);
  const b = polar(cx, cy, r, from);
  const large = to - from > 180 ? 1 : 0;
  return `M ${b.x} ${b.y} A ${r} ${r} 0 ${large} 1 ${a.x} ${a.y}`;
}

const toDeg = (v: number) => START + ((Math.min(MAX, Math.max(MIN, v)) - MIN) / (MAX - MIN)) * SWEEP;

/**
 * Animated circular gauge. The outer ring shows the WHO severity zones for the
 * subject; the inner arc fills up to the Hb value while the number counts up.
 * The likely range is shaded over the outer ring and printed under the value.
 */
export function HbGauge({ hb, severity, thresholds, range, size = 260 }: HbGaugeProps) {
  const { t } = useTranslation();
  const cx = 100;
  const cy = 100;
  const zones: Array<{ from: number; to: number; sev: Severity }> = [
    { from: MIN, to: thresholds.moderate, sev: 'severe' },
    { from: thresholds.moderate, to: thresholds.mild, sev: 'moderate' },
    { from: thresholds.mild, to: thresholds.normal, sev: 'mild' },
    { from: thresholds.normal, to: MAX, sev: 'normal' },
  ];

  const progress = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const fillPath = arcPath(cx, cy, 70, START, START + SWEEP - 0.01);
  const pathLength = useTransform(progress, (p) => p);

  useEffect(() => {
    const target = (Math.min(MAX, Math.max(MIN, hb)) - MIN) / (MAX - MIN);
    const c1 = animate(progress, target, { duration: 1.6, ease: [0.22, 1, 0.36, 1] });
    const c2 = animate(0, hb, { duration: 1.6, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setDisplay(v) });
    return () => {
      c1.stop();
      c2.stop();
    };
  }, [hb, progress]);

  const marker = polar(cx, cy, 86, toDeg(hb));

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size }}
      role="img"
      aria-label={
        t('results.gaugeAria', { value: hb.toFixed(1), severity: t(`severity.${severity}`) }) +
        (range ? `. ${t('results.likelyRange', { low: range[0].toFixed(1), high: range[1].toFixed(1) })}` : '')
      }
    >
      <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden>
        {range && (
          <motion.path
            d={arcPath(cx, cy, 86, toDeg(range[0]), Math.max(toDeg(range[0]) + 1.5, toDeg(range[1])))}
            className="fill-none stroke-ink"
            strokeWidth={18}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.18 }}
            transition={{ delay: 1.3, duration: 0.5 }}
          />
        )}
        {zones.map((z) => (
          <path
            key={z.sev}
            d={arcPath(cx, cy, 86, toDeg(z.from), toDeg(z.to))}
            className={cn('fill-none', severityStyles[z.sev].text)}
            stroke="currentColor"
            strokeWidth={8}
            opacity={0.85}
          />
        ))}
        <path d={fillPath} className="fill-none stroke-line" strokeWidth={16} strokeLinecap="round" />
        <motion.path
          d={fillPath}
          className={cn('fill-none', severityStyles[severity].text)}
          stroke="currentColor"
          strokeWidth={16}
          strokeLinecap="round"
          style={{ pathLength }}
        />
        <motion.circle
          cx={marker.x}
          cy={marker.y}
          r={6}
          className="fill-ink"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-hb tabular-nums', severityStyles[severity].text)}>
          {display.toFixed(1)}
        </span>
        <span className="text-lg font-semibold text-ink-muted">{t('common.gdl')}</span>
        {range && (
          <motion.span
            className="mt-1 text-sm font-semibold text-ink-muted tabular-nums"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
          >
            {range[0].toFixed(1)} – {range[1].toFixed(1)}
          </motion.span>
        )}
      </div>
    </div>
  );
}
