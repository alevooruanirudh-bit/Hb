import { fallbackConfig } from '@/config/pipelineConfig';
import type { FallbackReason, ModelKind, QualityStatus } from './types';

export interface XgbPrediction {
  hb: number;
  lower?: number;
  upper?: number;
}

export interface FallbackInput {
  /** CNN feature extraction threw, returned invalid output, or timed out. */
  cnnFailed: boolean;
  qualityStatus: QualityStatus;
  /** XGBoost result, if it was run. */
  xgb?: XgbPrediction;
}

export interface FallbackDecision {
  model: ModelKind;
  reasons: FallbackReason[];
}

export type FallbackConfig = { minPlausibleHb: number; maxPlausibleHb: number; maxIntervalWidth: number };

/**
 * Decides whether to trust XGBoost (CNN + color features) or switch to the
 * color-only Random Forest. Fallback happens if ANY trigger fires:
 *
 *  1. CNN feature extraction failed / timed out
 *  2. image quality is "borderline"
 *  3. XGBoost prediction outside the plausible range
 *  4. XGBoost quantile interval wider than the configured limit
 *
 * Triggers 1–2 are known before XGBoost runs ({@link shouldSkipXgboost});
 * triggers 3–4 need its output ({@link decide}).
 */
export class FallbackDecider {
  constructor(private readonly config: FallbackConfig = fallbackConfig) {}

  /** Pre-inference reasons (no need to even run XGBoost when these fire). */
  preReasons(input: Pick<FallbackInput, 'cnnFailed' | 'qualityStatus'>): FallbackReason[] {
    const reasons: FallbackReason[] = [];
    if (input.cnnFailed) reasons.push('cnnFailed');
    if (input.qualityStatus === 'borderline') reasons.push('borderlineQuality');
    return reasons;
  }

  shouldSkipXgboost(input: Pick<FallbackInput, 'cnnFailed' | 'qualityStatus'>): boolean {
    return this.preReasons(input).length > 0;
  }

  decide(input: FallbackInput): FallbackDecision {
    const reasons = this.preReasons(input);
    const { xgb } = input;
    if (xgb) {
      if (
        !Number.isFinite(xgb.hb) ||
        xgb.hb < this.config.minPlausibleHb ||
        xgb.hb > this.config.maxPlausibleHb
      ) {
        reasons.push('implausibleValue');
      }
      if (
        xgb.lower !== undefined &&
        xgb.upper !== undefined &&
        xgb.upper - xgb.lower > this.config.maxIntervalWidth
      ) {
        reasons.push('wideInterval');
      }
    } else if (reasons.length === 0) {
      // Nothing to judge — without an XGBoost output we must use the fallback.
      reasons.push('cnnFailed');
    }
    return { model: reasons.length ? 'randomForest' : 'xgboost', reasons };
  }
}
