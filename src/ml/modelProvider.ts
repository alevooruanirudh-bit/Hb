import type { RGBAImage } from '@/imageProcessing/types';
import type { Region, TrainingPopulation } from './types';

/** Output of a tree model. Quantile bounds only exist for XGBoost. */
export interface TreePrediction {
  hb: number;
  lower?: number;
  upper?: number;
}

/**
 * Abstraction over the on-device models so the pipeline does not care whether
 * it is running trained models or simulated ones.
 *
 * Feature layout (must match `training/extract_features.py`):
 *   XGBoost input       = [ ...cnnEmbedding (only if usesCnn), ...colorFeatures, ...regionOneHot(eye, nails, palm) ]
 *   Random Forest input = [ ...colorFeatures, ...regionOneHot ]
 */
export interface ModelProvider {
  readonly source: 'mock' | 'real';
  readonly version: string;
  /** Whether XGBoost expects a CNN embedding before the colour features. */
  readonly usesCnn: boolean;
  /** Whether XGBoost expects [age, sex] after the region one-hot. */
  readonly usesDemographics?: boolean;
  /** Regions the models were trained for (the app only offers these). */
  readonly regions: Region[];
  /** Who each region's model was trained on (real models only). */
  readonly populations?: Partial<Record<Region, TrainingPopulation>>;
  /** Regions that only have an anemia classifier (no hemoglobin value), e.g. palm. */
  readonly likelihoodRegions?: Region[];
  /** Names of colour features outside the training range for this region / age group (real models). */
  featuresOutOfRange?(region: Region, colorFeatures: number[], ageYears?: number): string[];
  /** Probability that the region looks anemic (classifier regions only). */
  predictAnemiaProbability?(region: Region, colorFeatures: number[]): { probability: number; looksAnemic: boolean };
  /** Loads models. Throws if they are unavailable. */
  init(): Promise<void>;
  /** Runs the CNN on a square ROI (224×224). Throws on failure. */
  extractCnnFeatures(roi: RGBAImage): Promise<Float32Array>;
  /** XGBoost median + 10%/90% quantile predictions. */
  predictXgboost(features: number[]): TreePrediction;
  /** Random Forest on color features only. */
  predictRandomForest(features: number[]): TreePrediction;
}

export const REGION_ORDER: Region[] = ['eye', 'nails', 'palm'];

export function regionOneHot(region: Region): number[] {
  return REGION_ORDER.map((r) => (r === region ? 1 : 0));
}

export function buildXgbInput(cnn: Float32Array | null, color: number[], region: Region, demo?: number[]): number[] {
  return [...(cnn ? Array.from(cnn) : []), ...color, ...regionOneHot(region), ...(demo ?? [])];
}

/** [age in years, sex (male 1, female 0, unknown 0.5)] — same as training/common.py demographics(). */
export function demographicFeatures(subject?: { ageYears: number; sex?: string }): number[] {
  if (!subject) return [30, 0.5];
  return [subject.ageYears, subject.sex === 'male' ? 1 : subject.sex === 'female' ? 0 : 0.5];
}

export function buildRfInput(color: number[], region: Region): number[] {
  return [...color, ...regionOneHot(region)];
}
