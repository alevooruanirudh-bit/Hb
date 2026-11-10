import type { TFunction } from 'i18next';
import { shareOrDownloadFile } from '@/utils/shareFile';
import type { Profile, QuestionAnswer, QuestionId } from '@/db/db';
import type { ScanOutcome } from '@/ml/types';
import { guidanceEngine } from '@/guidance/guidanceEngine';
import { toSubject } from '@/db/repositories';
import { severityClassifier } from '@/ml/severityClassifier';
import { severityHex } from '@/utils/severity';
import { judgedHb, rangeText } from '@/utils/hbDisplay';
import { formatDate, profileSummary } from '@/utils/profileText';

export interface ReportInput {
  profile: Profile;
  profileName: string;
  outcome: ScanOutcome;
  timestamp: number;
  answers: Partial<Record<QuestionId, QuestionAnswer>>;
  t: TFunction;
  lang: string;
}

// A4 at 150 dpi.
const W = 1240;
const H = 1754;
const M = 90;
const FONT = '"Noto Sans", "Noto Sans Telugu", "Noto Sans Devanagari", sans-serif';
const INK = '#2B2B2B';
const MUTED = '#6B6B6B';
const PRIMARY = '#B23A48';
const TEAL = '#2A7F7F';

/** Word-wraps text (works for Indic scripts too, which the browser shapes correctly). */
function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
  maxLines = 99,
): number {
  const lines: string[] = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    let last = lines[maxLines - 1];
    while (last.includes(' ') && ctx.measureText(`${last}…`).width > maxW)
      last = last.slice(0, last.lastIndexOf(' '));
    lines[maxLines - 1] = `${last}…`;
  }
  for (const l of lines) {
    ctx.fillText(l, x, y);
    y += lineH;
  }
  return y;
}

function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 64, s / 64);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill(new Path2D('M32 4C32 4 12 27 12 41a20 20 0 0 0 40 0C52 27 32 4 32 4Z'));
  ctx.strokeStyle = PRIMARY;
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(new Path2D('M19 42h8l3-7 4 13 3-6h8'));
  ctx.restore();
}

/**
 * Renders the one-page report onto a canvas. Canvas text uses the bundled Noto
 * fonts, so Telugu and Devanagari are shaped correctly (jsPDF's own text
 * engine cannot shape Indic scripts).
 */
async function renderReportCanvas({
  profile,
  profileName,
  outcome,
  timestamp,
  answers,
  t,
  lang,
}: ReportInput): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'top';

  // Header
  ctx.fillStyle = PRIMARY;
  ctx.fillRect(0, 0, W, 170);
  drawLogo(ctx, M, 40, 90);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 48px ${FONT}`;
  ctx.fillText(t('app.name'), M + 115, 45);
  ctx.font = `400 28px ${FONT}`;
  ctx.fillText(t('report.title'), M + 115, 105);
  if (outcome.isDemo) {
    ctx.font = `700 26px ${FONT}`;
    const label = t('demo.badge');
    const w = ctx.measureText(label).width + 40;
    ctx.fillStyle = TEAL;
    ctx.beginPath();
    ctx.roundRect(W - M - w, 62, w, 46, 23);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(label, W - M - w + 20, 71);
  }

  // Old scans from an earlier test build are labelled as such.
  if (outcome.modelSource === 'mock') {
    ctx.fillStyle = '#E8EEF6';
    ctx.fillRect(0, 170, W, 46);
    ctx.fillStyle = '#2B2B2B';
    ctx.font = `700 24px ${FONT}`;
    ctx.fillText(t('simulated.title'), M, 180);
  }

  // Profile line
  let y = outcome.modelSource === 'mock' ? 232 : 210;
  ctx.fillStyle = INK;
  ctx.font = `700 34px ${FONT}`;
  ctx.fillText(profileName, M, y);
  ctx.font = `400 26px ${FONT}`;
  ctx.fillStyle = MUTED;
  ctx.fillText(`${profileSummary(profile, t)}   ·   ${formatDate(timestamp, lang, true)}`, M, y + 48);

  // Result block
  y = 320;
  ctx.fillStyle = '#FCE4E6';
  ctx.beginPath();
  ctx.roundRect(M, y, W - 2 * M, 250, 28);
  ctx.fill();
  const col = severityHex[outcome.severity];
  ctx.fillStyle = col;
  ctx.font = `800 120px ${FONT}`;
  const judged = judgedHb(outcome);
  const hbText = judged.value.toFixed(1);
  ctx.fillText(hbText, M + 40, y + 45);
  const hbW = ctx.measureText(hbText).width;
  ctx.fillStyle = MUTED;
  ctx.font = `600 34px ${FONT}`;
  ctx.fillText(t('common.gdl'), M + 50 + hbW, y + 120);
  if (judged.low !== undefined && judged.high !== undefined) {
    ctx.font = `600 26px ${FONT}`;
    ctx.fillStyle = INK;
    ctx.fillText(t('results.likelyRangeShort', { range: rangeText(outcome) }), M + 40, y + 190);
  }
  const rx = M + 470;
  ctx.fillStyle = col;
  ctx.font = `700 40px ${FONT}`;
  ctx.fillText(t(`severityLong.${outcome.severity}`), rx, y + 45);
  ctx.fillStyle = INK;
  ctx.font = `600 28px ${FONT}`;
  ctx.fillText(outcome.anemia ? t('results.anemiaDetected') : t('results.anemiaNotDetected'), rx, y + 105);
  ctx.font = `400 24px ${FONT}`;
  ctx.fillStyle = MUTED;
  const group = severityClassifier.selectGroup(toSubject(profile)).group;
  ctx.fillText(
    group.upper !== undefined
      ? t('results.healthyRange', { min: group.normal.toFixed(1), max: group.upper.toFixed(1) })
      : t('results.normalRange', { value: group.normal.toFixed(1) }),
    rx,
    y + 150,
  );
  ctx.fillText(
    outcome.reliability === 'high' ? t('results.highConfidence') : t('results.lowConfidenceShort'),
    rx,
    y + 188,
  );

  // Region breakdown
  y = 610;
  ctx.fillStyle = INK;
  ctx.font = `700 32px ${FONT}`;
  ctx.fillText(t('results.regionBreakdown'), M, y);
  y += 56;
  ctx.font = `400 26px ${FONT}`;
  for (const r of outcome.regions) {
    ctx.fillStyle = INK;
    ctx.fillText(t(`regions.${r.region}.name`), M, y);
    ctx.fillStyle = MUTED;
    // Palm check rows have a long right-hand label, so they skip the model/quality column.
    if (!r.likelihoodOnly) {
      ctx.fillText(
        `${t(`results.model.${r.model}`)} · ${t('results.quality', { value: Math.round(r.qualityScore * 100) })}`,
        M + 420,
        y,
      );
    }
    ctx.fillStyle = INK;
    ctx.font = `700 28px ${FONT}`;
    const v = r.likelihoodOnly
      ? `${r.looksAnemic ? t('results.looksAnemic') : t('results.looksHealthy')} (${t('results.anemiaChance', { pct: Math.round((r.anemiaProbability ?? 0) * 100) })})`
      : `${r.hb.toFixed(1)} ${t('common.gdl')}`;
    ctx.fillText(v, W - M - ctx.measureText(v).width, y);
    ctx.font = `400 26px ${FONT}`;
    y += 46;
  }
  // Adjustments: altitude, skin tone, regions given less weight / excluded
  const notes: string[] = [];
  if ((outcome.altitudeAdjustment ?? 0) > 0) {
    notes.push(
      t('adjustments.altitude', {
        adj: (outcome.altitudeAdjustment ?? 0).toFixed(1),
        hb: outcome.hb.toFixed(1),
        adjusted: (outcome.hbAdjusted ?? outcome.hb).toFixed(1),
      }),
    );
  }
  for (const r of outcome.regions) {
    if ((r.confounderFactor ?? 1) < 1) {
      const why = [...(r.conditions ?? []).map((c) => t(`conditions.effects.${c}`)), ...(r.imageFlags ?? []).map((f) => t(`conditions.imageFlags.${f}`))];
      notes.push(`${t(`regions.${r.region}.short`)}: ${r.confounderFactor === 0 ? t('adjustments.excluded') : t('adjustments.lessWeight')} — ${why.join('; ')}`);
    }
  }
  if (notes.length) {
    ctx.fillStyle = MUTED;
    ctx.font = `400 21px ${FONT}`;
    for (const n of notes.slice(0, 3)) y = wrap(ctx, `• ${n}`, M, y + 4, W - 2 * M, 28, 2);
  }
  if (outcome.usedFallback) {
    ctx.fillStyle = TEAL;
    ctx.font = `400 22px ${FONT}`;
    y = wrap(ctx, t('results.fallbackNote'), M, y + 6, W - 2 * M, 30);
  }

  // Guidance
  const plan = guidanceEngine.build(outcome.severity, answers, toSubject(profile));
  y += 30;
  const refColor =
    plan.referral === 'urgent'
      ? severityHex.severe
      : plan.referral === 'soon'
        ? severityHex.moderate
        : plan.referral === 'routine'
          ? '#9A7400'
          : severityHex.normal;
  ctx.fillStyle = refColor;
  ctx.font = `700 30px ${FONT}`;
  ctx.fillText(t(`guidance:referral.${plan.referral}.title`), M, y);
  y += 46;
  ctx.fillStyle = INK;
  ctx.font = `400 24px ${FONT}`;
  y = wrap(ctx, t(`guidance:referral.${plan.referral}.body`), M, y, W - 2 * M, 34, 4);

  if (plan.causes.length) {
    y += 18;
    ctx.font = `700 28px ${FONT}`;
    ctx.fillText(t('guidance.causesTitle'), M, y);
    y += 44;
    ctx.font = `400 24px ${FONT}`;
    y = wrap(
      ctx,
      plan.causes
        .slice(0, 5)
        .map((k) => t(`guidance:causes.${k}.title`))
        .join(' · '),
      M,
      y,
      W - 2 * M,
      34,
      3,
    );
  }

  y += 18;
  ctx.font = `700 28px ${FONT}`;
  ctx.fillText(t('guidance.actionsTitle'), M, y);
  y += 44;
  for (const a of plan.actions.slice(0, 5)) {
    if (y > H - 250) break;
    ctx.font = `600 24px ${FONT}`;
    ctx.fillStyle = INK;
    ctx.fillText(`•  ${t(`guidance:actions.${a}.title`)}`, M, y);
    y += 34;
    ctx.font = `400 22px ${FONT}`;
    ctx.fillStyle = MUTED;
    y = wrap(ctx, t(`guidance:actions.${a}.body`), M + 30, y, W - 2 * M - 30, 30, 3) + 8;
  }

  // Disclaimer footer
  ctx.fillStyle = '#F3ECE9';
  ctx.fillRect(0, H - 190, W, 190);
  ctx.fillStyle = INK;
  ctx.font = `700 24px ${FONT}`;
  ctx.fillText(t('app.disclaimerTitle'), M, H - 165);
  ctx.font = `400 21px ${FONT}`;
  ctx.fillStyle = MUTED;
  wrap(ctx, t('app.disclaimer'), M, H - 128, W - 2 * M, 29, 3);
  ctx.font = `400 18px ${FONT}`;
  ctx.fillText(`${t('settings.modelVersion')}: ${outcome.modelVersion} (${outcome.modelSource})`, M, H - 38);

  return c;
}

/** Builds the PDF as a Blob. jsPDF is loaded lazily to keep the initial bundle small. */
export async function buildReportPdf(input: ReportInput): Promise<Blob> {
  const [{ jsPDF }, canvas] = await Promise.all([import('jspdf'), renderReportCanvas(input)]);
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  pdf.setProperties({ title: input.t('report.title'), creator: 'HemoScan' });
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 210, 297);
  return pdf.output('blob');
}


/** Builds the PDF and shares it (Android share sheet / Web Share) or downloads it. */
export async function shareOrDownloadReport(input: ReportInput): Promise<void> {
  const blob = await buildReportPdf(input);
  const date = new Date(input.timestamp).toISOString().slice(0, 10);
  await shareOrDownloadFile(blob, `HemoScan_${date}.pdf`, input.t('report.title'), input.t('results.share'));
}
