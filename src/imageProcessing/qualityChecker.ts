import { qualityConfig } from '@/config/pipelineConfig';
import type { QualityMetrics, QualityReason, QualityReport, QualityStatus } from '@/ml/types';
import type { ImageOps, RGBAImage } from './types';
import { luma } from './colorSpace';
import { sharpnessScore } from './sharpness';

export type QualityConfig = { -readonly [K in keyof typeof qualityConfig]: number };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Image quality gate.
 *
 *  - Blur: sharpnessScore() — Laplacian variance of the sharpest image tiles at 320 px
 *    (robust to smooth skin / walls and to JPEG softening)
 *  - Exposure: mean brightness + fraction of over/under-exposed pixels
 *
 * Returns a 0–1 score and pass / borderline / fail with machine-readable
 * reasons. Heavily blurred images FAIL — we never try to "fix" them.
 */
export class QualityChecker {
  private readonly cfg: QualityConfig;

  /** `_ops` is kept for API compatibility; sharpness is computed in JS on a small image. */
  constructor(
    _ops: ImageOps,
    config: Partial<QualityConfig> = {},
  ) {
    this.cfg = { ...qualityConfig, ...config };
  }

  /** Computes raw metrics without judging them. */
  measure(img: RGBAImage): QualityMetrics {
    const { data } = img;
    const n = data.length / 4;
    let sum = 0;
    let over = 0;
    let under = 0;
    for (let i = 0; i < data.length; i += 4) {
      const y = luma(data[i], data[i + 1], data[i + 2]);
      sum += y;
      if (y >= this.cfg.overexposedLevel) over++;
      else if (y <= this.cfg.underexposedLevel) under++;
    }
    return {
      blurVariance: sharpnessScore(img),
      meanBrightness: sum / n,
      overexposedFraction: over / n,
      underexposedFraction: under / n,
    };
  }

  check(img: RGBAImage): QualityReport {
    const c = this.cfg;
    const m = this.measure(img);
    const fails = new Set<QualityReason>();
    const warns = new Set<QualityReason>();

    if (Math.min(img.width, img.height) < c.minSide) fails.add('tooSmall');

    // Blur
    if (m.blurVariance < c.blurFailThreshold) fails.add('blurry');
    else if (m.blurVariance < c.blurGoodThreshold) warns.add('slightlyBlurry');
    const blurScore = clamp01(
      (m.blurVariance - c.blurFailThreshold) / (c.blurGoodThreshold - c.blurFailThreshold),
    );

    // Brightness
    if (m.meanBrightness < c.minMeanBrightness) fails.add('tooDark');
    else if (m.meanBrightness > c.maxMeanBrightness) fails.add('tooBright');
    else if (m.meanBrightness < c.goodMinMeanBrightness) warns.add('tooDark');
    else if (m.meanBrightness > c.goodMaxMeanBrightness) warns.add('tooBright');
    // 1 inside the comfortable range, falling linearly to 0 at the hard limits.
    const mb = m.meanBrightness;
    const brightnessScore =
      mb < c.goodMinMeanBrightness
        ? clamp01((mb - c.minMeanBrightness) / (c.goodMinMeanBrightness - c.minMeanBrightness))
        : mb > c.goodMaxMeanBrightness
          ? clamp01((c.maxMeanBrightness - mb) / (c.maxMeanBrightness - c.goodMaxMeanBrightness))
          : 1;

    // Clipping
    if (m.overexposedFraction > c.maxClippedFail) fails.add('tooBright');
    if (m.underexposedFraction > c.maxClippedFail) fails.add('tooDark');
    const clipped = m.overexposedFraction + m.underexposedFraction;
    if (clipped > c.maxClippedWarn && !fails.has('tooBright') && !fails.has('tooDark'))
      warns.add('unevenLight');
    const clipScore = clamp01(1 - clipped / c.maxClippedFail);

    const score = Math.round((0.5 * blurScore + 0.3 * brightnessScore + 0.2 * clipScore) * 1000) / 1000;

    let status: QualityStatus;
    if (fails.size > 0) status = 'fail';
    else if (warns.size > 0 || score < c.passScore) status = 'borderline';
    else status = 'pass';

    const reasons = [...fails, ...[...warns].filter((w) => !fails.has(w))];
    return { score: status === 'fail' ? Math.min(score, 0.39) : score, status, reasons, metrics: m };
  }
}
