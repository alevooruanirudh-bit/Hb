import { fusionConfig, outOfRangeConfig, uncertaintyConfig } from '@/config/pipelineConfig';
import { palmWeightFactor } from '@/imageProcessing/skinTone';
import { confounderFactor } from './confounders';
import type { RegionEstimate, Reliability, SkinToneCategory } from './types';

export interface FusionResult {
  hb: number;
  /** Likely range of the estimate (g/dL). */
  low: number;
  high: number;
  reliability: Reliability;
  /** Combined confidence in [0, 1]. */
  confidence: number;
  regions: RegionEstimate[];
  /** Every region was affected by a confounder (e.g. polish + crying): result is only indicative. */
  allRegionsAffected: boolean;
}

type FusionConfig = typeof fusionConfig;

export interface FusionOptions {
  /** Skin tone of the person; darker skin lowers trust in palm pallor. */
  skinTone?: SkinToneCategory;
  config?: FusionConfig;
}

/**
 * Weighted fusion of per-region estimates.
 *
 * weight = regionBaseWeight × qualityScore × detectionConfidence
 *          × 1/uncertainty² (inverse-variance, relative) × populationMismatchPenalty
 *          × fallbackPenalty (if Random Forest was used)
 *          × confounderFactor (crying, polish/henna, injury, short nails … — 0 excludes)
 *          × skinFactor (palm only: lower on darker skin)
 *
 * Eye and nails have higher base weights than palm because palm pallor is less
 * reliable across darker skin tones.
 */
export function fuseEstimates(estimates: RegionEstimate[], opts: FusionOptions = {}): FusionResult {
  const config = opts.config ?? fusionConfig;
  if (estimates.length === 0) throw new Error('No region estimates to fuse');

  const weighted = estimates.map((e) => {
    const base = config.regionWeights[e.region];
    const penalty = e.model === 'randomForest' ? config.fallbackPenalty : 1;
    const cf = confounderFactor(e.region, e.conditions, e.imageFlags);
    const sf = e.region === 'palm' ? palmWeightFactor(opts.skinTone) : 1;
    const pm = e.populationMismatch ? config.populationMismatchPenalty : 1;
    // Inverse-variance factor, normalised to the minimum half-width so it stays ≤ 1.
    const h = regionHalfWidth({ ...e, confounderFactor: cf });
    const iv = config.inverseVarianceWeighting ? (uncertaintyConfig.minHalfWidth / h) ** 2 : 1;
    // `trust` measures how usable the region is (drives confidence); `weight` adds the relative
    // inverse-variance factor, which only decides how regions are mixed.
    const oor = e.outOfRange ? outOfRangeConfig.weightPenalty : 1;
    const trust = base * e.qualityScore * e.detectionConfidence * penalty * cf * sf * pm * oor;
    return { ...e, weight: trust * iv, trust, base, confounderFactor: cf, skinFactor: sf };
  });

  const usable = weighted.filter((e) => e.weight > 1e-6);
  const allRegionsAffected = usable.length === 0;
  // If every region is excluded we still show an estimate (plain average), clearly marked unreliable.
  const pool = allRegionsAffected ? weighted.map((e) => ({ ...e, weight: 1 })) : usable;

  const sumW = pool.reduce((s, e) => s + e.weight, 0);
  const hb = pool.reduce((s, e) => s + e.hb * e.weight, 0) / sumW;

  // Confidence: realised weight relative to the ideal (base) weight of all scanned regions.
  const sumBase = weighted.reduce((s, e) => s + e.base, 0);
  const sumTrust = usable.reduce((s, e) => s + e.trust, 0);
  let confidence = allRegionsAffected ? 0 : sumTrust / sumBase;

  const values = pool.map((e) => e.hb);
  const spread = Math.max(...values) - Math.min(...values);
  // Regions that disagree strongly cannot both be right — never call that "high confidence".
  const disagree = pool.length > 1 && spread > config.maxRegionSpread;
  if (disagree) confidence *= 0.7;
  if (pool.every((e) => e.model === 'randomForest')) confidence *= 0.9;

  confidence = Math.min(1, Math.max(0, confidence));
  const anyOutOfRange = pool.some((e) => e.outOfRange);
  const reliability: Reliability =
    !disagree && !allRegionsAffected && !anyOutOfRange && confidence >= config.highReliabilityMin ? 'high' : 'low';

  // Likely range: weighted region half-widths (each already widened for its own quality,
  // detection and confounders), stretched if needed so it covers every region's estimate.
  const u = uncertaintyConfig;
  const halfWidths = pool.map((e) => regionHalfWidth(e));
  let half = pool.reduce((s, e, i) => s + halfWidths[i] * e.weight, 0) / sumW;
  if (pool.length > 1) half = Math.max(half, spread / 2);
  half = Math.min(u.maxHalfWidth, Math.max(u.minHalfWidth, half));
  const round1 = (v: number) => Math.round(v * 10) / 10;
  const hbR = round1(hb);

  return {
    hb: hbR,
    low: round1(hbR - half),
    high: round1(hbR + half),
    reliability,
    confidence,
    allRegionsAffected,
    regions: weighted.map(({ base: _base, trust: _trust, ...e }) => {
      const h = regionHalfWidth(e);
      return { ...e, lower: round1(e.hb - h), upper: round1(e.hb + h), halfWidth: round1(h) };
    }),
  };
}

/**
 * Uncertainty (± g/dL) of one region's estimate: half the XGBoost 10–90 %
 * interval when available, else a default; wider for poor quality, weak
 * detection or confounders. Never below the configured minimum.
 */
export function regionHalfWidth(
  e: Pick<
    RegionEstimate,
    'lower' | 'upper' | 'qualityScore' | 'detectionConfidence' | 'confounderFactor' | 'populationMismatch' | 'outOfRange'
  >,
): number {
  const u = uncertaintyConfig;
  const base = e.lower !== undefined && e.upper !== undefined && e.upper > e.lower ? (e.upper - e.lower) / 2 : u.defaultHalfWidth;
  const trust = Math.max(0.15, e.qualityScore * e.detectionConfidence * (e.confounderFactor ?? 1));
  let widened = base * (1 + u.lowConfidenceWiden * (1 - Math.min(1, trust)));
  if (e.populationMismatch) widened *= u.populationMismatchWiden;
  if (e.outOfRange) widened *= outOfRangeConfig.widen;
  return Math.min(u.maxHalfWidth, Math.max(u.minHalfWidth, widened));
}
