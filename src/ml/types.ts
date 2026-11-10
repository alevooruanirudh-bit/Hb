/**
 * Shared domain types for the HemoScan screening pipeline.
 *
 * These types are used by the Web Worker, the main-thread orchestrator, the
 * UI and the database, so they must stay free of DOM / React imports.
 */

/** Body region that can be scanned. */
export type Region = 'eye' | 'nails' | 'palm';

/** All regions in the recommended "Scan All" order (most reliable first). */
export const ALL_REGIONS: Region[] = ['eye', 'nails', 'palm'];

/** WHO anemia severity levels. */
export type Severity = 'normal' | 'mild' | 'moderate' | 'severe';

export type Sex = 'female' | 'male';

/** Which tree model produced an estimate. */
export type ModelKind = 'xgboost' | 'randomForest';

/** Overall reliability shown to the user. */
export type Reliability = 'high' | 'low';

/** Result of the image quality gate. */
export type QualityStatus = 'pass' | 'borderline' | 'fail';

/** Machine-readable reasons; the UI maps them to localized text. */
export type QualityReason =
  'blurry' | 'slightlyBlurry' | 'tooDark' | 'tooBright' | 'unevenLight' | 'tooSmall';

export interface QualityMetrics {
  /** Variance of the Laplacian of the grayscale image (higher = sharper). */
  blurVariance: number;
  /** Mean luminance, 0–255. */
  meanBrightness: number;
  /** Fraction (0–1) of pixels with luminance ≥ overexposed threshold. */
  overexposedFraction: number;
  /** Fraction (0–1) of pixels with luminance ≤ underexposed threshold. */
  underexposedFraction: number;
}

export interface QualityReport {
  /** Combined quality score in [0, 1]. */
  score: number;
  status: QualityStatus;
  reasons: QualityReason[];
  metrics: QualityMetrics;
}

/** Axis-aligned crop rectangle in pixel coordinates of the source image. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** How the region of interest was located. */
export type DetectionMethod = 'landmarks' | 'colorHeuristic' | 'guideBox';

export interface RegionDetection {
  /**
   * One or more crop boxes. Nails yield one box per fingernail, the eye one per
   * visible lower eyelid; they are tiled into a single ROI mosaic for analysis.
   */
  boxes: Box[];
  /** Detection confidence in [0, 1]. */
  confidence: number;
  method: DetectionMethod;
}

/** Reasons the FallbackDecider can switch from XGBoost to Random Forest. */
export type FallbackReason = 'cnnFailed' | 'borderlineQuality' | 'implausibleValue' | 'wideInterval';

/** Per-region estimate produced by the worker. */
export interface RegionEstimate {
  region: Region;
  hb: number;
  /** Lower / upper prediction interval bounds (g/dL) if available. */
  lower?: number;
  upper?: number;
  model: ModelKind;
  fallbackReasons: FallbackReason[];
  qualityScore: number;
  qualityStatus: QualityStatus;
  detectionConfidence: number;
  detectionMethod: DetectionMethod;
  /** Fusion weight actually applied (filled by fusion step). */
  weight?: number;
  /** Conditions the person reported before this region's scan (pre-scan checklist). */
  conditions?: ReportedCondition[];
  /** Problems detected automatically in the image (red sclera, polish/henna, bruise). */
  imageFlags?: ImageFlag[];
  /** Combined confounder multiplier (1 = unaffected, 0 = excluded). Filled by fusion. */
  confounderFactor?: number;
  /** Skin-tone multiplier applied to this region (palm only). Filled by fusion. */
  skinFactor?: number;
  /** ± uncertainty of this region's estimate in g/dL (lower/upper are hb ∓ halfWidth after fusion). */
  halfWidth?: number;
  /** The person is outside the age range this region's model was trained on (e.g. adult vs child data). */
  populationMismatch?: boolean;
  /** Colour features outside what the model saw in training (different camera / lighting). */
  outOfRange?: boolean;
  outOfRangeFeatures?: string[];
  /**
   * Classifier-only region (currently the palm with trained models): there is no hemoglobin
   * value (`hb` is NaN) — only the probability that the tissue looks anemic.
   */
  likelihoodOnly?: boolean;
  anemiaProbability?: number;
  looksAnemic?: boolean;
}

/**
 * Things that change how red/pale a region LOOKS without changing hemoglobin.
 * Reported by the person on the pre-scan checklist.
 */
export type ReportedCondition =
  | 'criedOrRubbed'
  | 'eyeIrritation'
  | 'nailPolishOrHenna'
  | 'fingerInjury'
  | 'nailsCutShort'
  | 'coldHands'
  | 'hennaOnPalm'
  | 'hotWaterOrExercise';

/** Confounders detected automatically from the image. */
export type ImageFlag = 'scleraRed' | 'nailCoating' | 'nailDarkSpot' | 'hennaDetected';

/** Skin tone category from the Individual Typology Angle (ITA°). */
export type SkinToneCategory = 'veryLight' | 'light' | 'intermediate' | 'tan' | 'brown' | 'dark';

export interface SkinTone {
  /** Individual Typology Angle in degrees (lower = darker). Undefined when self-reported only. */
  ita?: number;
  category: SkinToneCategory;
  source: 'photo' | 'selfReported' | 'scan';
}

/** Age range of the people a region's trained model learned from. */
export interface TrainingPopulation {
  minAge: number;
  maxAge: number;
  description: string;
}

/** Profile fields needed for WHO severity classification. */
export interface ClassificationSubject {
  ageYears: number;
  sex: Sex;
  pregnant: boolean;
  /** Elevation of residence in metres (WHO altitude adjustment). Defaults to 0. */
  altitudeM?: number;
}

/** Final combined outcome of a scan. */
export interface ScanOutcome {
  /** Estimated hemoglobin from the images (g/dL), after personal calibration if any. */
  hb: number;
  /** Photo estimate before personal calibration (used to create new calibrations). */
  hbUncalibrated?: number;
  /** Personal calibration applied from this person's own blood tests. */
  personalCalibration?: { offset: number; tests: number };
  /** Correction learned from blood tests entered on this device (used when the person has none of their own). */
  deviceCorrection?: { offset: number; pairs: number };
  /** Likely range of the photo estimate (g/dL). Missing on scans saved before v1.2. */
  hbLow?: number;
  hbHigh?: number;
  /** Value compared with WHO cutoffs = hb − altitude adjustment. Missing on scans saved before v1.1. */
  hbAdjusted?: number;
  /** Severity at the low and high end of the (altitude-adjusted) range; differ when the range crosses a cutoff. */
  severityRange?: [Severity, Severity];
  /** Top of the typical healthy range for this person (lab reference; WHO defines only the lower cutoff). */
  upperNormal?: number;
  /** Estimate is above the typical healthy range. */
  aboveNormal?: boolean;
  /** g/dL subtracted for living at altitude (0 below 1000 m). */
  altitudeAdjustment?: number;
  /** Skin tone used for weighting (profile photo / self-report, or measured during the scan). */
  skinTone?: SkinTone;
  /** Palm pallor check (trained classifier): does not change `hb`; flags disagreement. */
  palmCheck?: { probability: number; looksAnemic: boolean; disagrees: boolean; excluded: boolean };
  severity: Severity;
  anemia: boolean;
  reliability: Reliability;
  /** Every scanned region was affected by a confounder (result only indicative). */
  allRegionsAffected?: boolean;
  usedFallback: boolean;
  regions: RegionEstimate[];
  /** WHO group key used for thresholds (see severityThresholds.json). */
  thresholdGroup: string;
  /** Lower bound of the "normal" band for this subject. */
  normalThreshold: number;
  isDemo: boolean;
  modelSource: 'mock' | 'real';
  modelVersion: string;
  durationMs: number;
}
