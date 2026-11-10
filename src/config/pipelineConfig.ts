import type { Region } from '@/ml/types';
import cfg from './pipeline.json';

/**
 * Tunable thresholds for the on-device pipeline.
 *
 * Values live in `pipeline.json`, which is ALSO read by the Python training
 * code (`training/common.py`) — so preprocessing, features, quality gating,
 * fallback and fusion are guaranteed to use identical constants in the app
 * and in training. Recalibrate there, not here.
 */

/** Image quality gate (QualityChecker). */
export const qualityConfig = {
  /** Images are downscaled so the longest side is at most this before analysis. */
  analysisMaxSide: cfg.preprocessing.analysisMaxSide,
  /** Laplacian variance below this → "fail: blurry"; below `blurGoodThreshold` → borderline. */
  blurFailThreshold: cfg.quality.blurFailThreshold,
  blurGoodThreshold: cfg.quality.blurGoodThreshold,
  /** Luminance ≥ / ≤ these counts as over- / under-exposed. */
  overexposedLevel: cfg.quality.overexposedLevel,
  underexposedLevel: cfg.quality.underexposedLevel,
  /** Mean brightness hard limits and comfortable range (outside comfortable → borderline). */
  minMeanBrightness: cfg.quality.minMeanBrightness,
  maxMeanBrightness: cfg.quality.maxMeanBrightness,
  goodMinMeanBrightness: cfg.quality.goodMinMeanBrightness,
  goodMaxMeanBrightness: cfg.quality.goodMaxMeanBrightness,
  /** Max fraction of clipped pixels before failing / warning. */
  maxClippedFail: cfg.quality.maxClippedFail,
  maxClippedWarn: cfg.quality.maxClippedWarn,
  /** Score ≥ this with no warnings → "pass", otherwise "borderline". */
  passScore: cfg.quality.passScore,
  /** Minimum image side in pixels. */
  minSide: cfg.quality.minSide,
  /** Sharpness is measured at this size, on a grid of tiles, using this percentile tile. */
  sharpnessSide: cfg.quality.sharpnessSide,
  sharpnessGrid: cfg.quality.sharpnessGrid,
  sharpnessPercentile: cfg.quality.sharpnessPercentile,
} as const;

/** Preprocessor (gray-world → CLAHE on L → light denoise). */
export const preprocessConfig = {
  claheClipLimit: cfg.preprocessing.claheClipLimit,
  claheTileGrid: cfg.preprocessing.claheTileGrid,
  /** Gray-world gain is clamped to avoid extreme corrections. */
  maxWhiteBalanceGain: cfg.preprocessing.maxWhiteBalanceGain,
  /** Noise sigma range in which light denoising is applied (above max: never "fix" — leave to QC/fallback). */
  denoiseNoiseThreshold: cfg.preprocessing.denoiseNoiseThreshold,
  denoiseMaxNoise: cfg.preprocessing.denoiseMaxNoise,
  /** Side length the ROI mosaic is resized to before feature extraction. */
  roiSize: cfg.preprocessing.roiSize,
  /** Gentle unsharp mask applied ONLY to slightly-soft (borderline) photos — "auto-enhance". */
  unsharpAmount: cfg.preprocessing.unsharpAmount,
  unsharpSigma: cfg.preprocessing.unsharpSigma,
} as const;

/** FeatureExtractor. */
export const featureConfig = {
  histogramBins: cfg.features.histogramBins,
  /** Expected CNN embedding length (MobileNetV3-Small global pool = 576, EfficientNet-Lite0 = 1280). */
  cnnEmbeddingSize: cfg.features.cnnEmbeddingSize,
  cnnTimeoutMs: cfg.features.cnnTimeoutMs,
  glareLuma: cfg.features.glareLuma,
  shadowLuma: cfg.features.shadowLuma,
  aHistMin: cfg.features.aHistMin,
  aHistMax: cfg.features.aHistMax,
} as const;

/** FallbackDecider. */
export const fallbackConfig = {
  minPlausibleHb: cfg.fallback.minPlausibleHb,
  maxPlausibleHb: cfg.fallback.maxPlausibleHb,
  /** If the XGBoost 10–90% quantile interval is wider than this (g/dL), fall back. */
  maxIntervalWidth: cfg.fallback.maxIntervalWidth,
} as const;

/** Multi-region fusion. Eye and nails outweigh palm (more reliable across skin tones). */
export const fusionConfig = {
  regionWeights: cfg.fusion.regionWeights satisfies Record<Region, number>,
  fallbackPenalty: cfg.fusion.fallbackPenalty,
  highReliabilityMin: cfg.fusion.highReliabilityMin,
  maxRegionSpread: cfg.fusion.maxRegionSpread,
  /** Weight multiplier when the person is outside the age range the region's model was trained on. */
  populationMismatchPenalty: cfg.fusion.populationMismatchPenalty,
  /** Also weight each region by 1 / (its ± uncertainty)² — less precise regions count less. */
  inverseVarianceWeighting: cfg.fusion.inverseVarianceWeighting,
} as const;

/** Skin tone (ITA°) categories and how much the palm is trusted for each. */
export const skinToneConfig = cfg.skinTone;

/** Confounder weights (reported conditions + image flags) and detector thresholds. */
export const confounderConfig = cfg.confounders;

/** Likely-range (uncertainty) settings shown with every estimate. */
export const uncertaintyConfig = cfg.uncertainty;

/** "Photo looks different from the training photos" check. */
export const outOfRangeConfig = cfg.outOfRange;

/** Personal calibration from the person's own blood tests. */
export const personalCalibrationConfig = cfg.personalCalibration;
export const deviceLearningConfig = cfg.deviceLearning;
