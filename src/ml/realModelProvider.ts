/* eslint-disable @typescript-eslint/no-explicit-any */
import { featureConfig } from '@/config/pipelineConfig';
import { COLOR_FEATURE_NAMES } from '@/imageProcessing/colorFeatures';
import type { RGBAImage } from '@/imageProcessing/types';
import type { ModelProvider, TreePrediction } from './modelProvider';
import type { Region, TrainingPopulation } from './types';
import * as xgb from './models/xgboostModel';
import * as rf from './models/randomForestModel';
import * as palm from './models/palmClassifier';

/** Contents of `public/models/model-info.json` (written by training/export.py). */
export interface ModelScores {
  n: number;
  accuracy: number;
  precision: number;
  recall: number;
  specificity: number;
  f1: number;
  balancedAccuracy: number;
  auc: number | null;
  severityAccuracy: number;
  mae: number;
  rmse: number;
  r2: number;
  pearsonR: number;
  within1: number;
  within2: number;
  rangeCoverage: number | null;
  confusion: { tp: number; fp: number; tn: number; fn: number };
}

export interface ModelEvaluation {
  method: string;
  groups: Partial<Record<'overall' | 'eye' | 'nails' | 'indianAdults', ModelScores>>;
  palm?: { auc?: number; sensitivity?: number; specificity?: number };
}

export interface ModelInfo {
  version: string;
  /** null when the trained models use colour features only. */
  cnn: {
    inputSize: number;
    /** How pixels are scaled before the CNN. */
    normalization: '0_255' | '0_1' | '-1_1';
    embeddingSize: number;
  } | null;
  regions?: Region[];
  /** Per region and age group: feature → [p1, p99] of the training photos. */
  featureRanges?: Partial<Record<Region, Partial<Record<'adult' | 'child', Record<string, [number, number]>>>>>;
  metrics?: {
    per_region_mae?: Record<string, number>;
    per_region_n?: Record<string, number>;
    palm_classifier?: { auc: number; sensitivity: number; specificity: number; threshold: number };
  };
  /** Out-of-fold scorecard from training/model_metrics.py (Settings → Model performance). */
  evaluation?: ModelEvaluation;
  datasets?: Array<{
    region: string;
    name: string;
    doi: string;
    license: string;
    population: string;
    n: number;
    minAge?: number;
    maxAge?: number;
    kind?: 'classifier';
  }>;
}

/**
 * Loads and runs the trained models:
 *  - CNN feature extractor: TF.js graph model at `public/models/cnn/model.json`
 *  - XGBoost / Random Forest: m2cgen-exported TypeScript in `src/ml/models/`
 *
 * TF.js is imported lazily so it is not part of the main bundle and is only
 * downloaded / parsed when real models are enabled.
 */
export class RealModelProvider implements ModelProvider {
  readonly source = 'real' as const;
  version = 'unknown';
  readonly usesCnn = xgb.USES_CNN;
  readonly usesDemographics = xgb.USES_DEMOGRAPHICS;
  readonly regions: Region[] = [...(xgb.REGIONS as Region[]), ...(palm.IS_PLACEHOLDER ? [] : (['palm'] as Region[]))];
  readonly likelihoodRegions: Region[] = palm.IS_PLACEHOLDER ? [] : ['palm'];
  private tf: any = null;
  private model: any = null;
  private info: ModelInfo | null = null;
  populations: Partial<Record<Region, TrainingPopulation>> = {};

  constructor(
    private readonly cnnModelUrl: string,
    private readonly modelInfoUrl: string,
  ) {}

  async init(): Promise<void> {
    if (xgb.IS_PLACEHOLDER || rf.IS_PLACEHOLDER) {
      throw new Error('Trained tree models are not installed (src/ml/models/*.ts are placeholders).');
    }
    this.version = `${xgb.MODEL_VERSION}`;
    try {
      const res = await fetch(this.modelInfoUrl);
      if (res.ok) this.info = (await res.json()) as ModelInfo;
    } catch {
      /* optional */
    }
    if (this.info?.version) this.version = this.info.version;
    if (!palm.IS_PLACEHOLDER) {
      this.populations.palm = { minAge: palm.POPULATION.minAge, maxAge: palm.POPULATION.maxAge, description: palm.POPULATION.description };
    }
    for (const ds of this.info?.datasets ?? []) {
      if (ds.minAge !== undefined && ds.maxAge !== undefined) {
        // Several datasets can train one region (e.g. eye: Ghana children + Indian/Italian adults).
        const prev = this.populations[ds.region as Region];
        this.populations[ds.region as Region] = prev
          ? { minAge: Math.min(prev.minAge, ds.minAge), maxAge: Math.max(prev.maxAge, ds.maxAge), description: `${prev.description}; ${ds.population}` }
          : { minAge: ds.minAge, maxAge: ds.maxAge, description: ds.population };
      }
    }
    if (!this.usesCnn) return; // colour-only models: TF.js is not needed (and not bundled)
    // The CNN may legitimately be missing — then every region uses the RF fallback.
    try {
      this.tf = await import('@tensorflow/tfjs');
      await this.tf.ready();
      this.model = await this.tf.loadGraphModel(this.cnnModelUrl);
      if (this.info?.version) this.version = this.info.version;
    } catch (e) {
      console.warn('[RealModelProvider] CNN not available, RF fallback will be used:', e);
      this.model = null;
    }
  }

  async extractCnnFeatures(roi: RGBAImage): Promise<Float32Array> {
    if (!this.model || !this.tf) throw new Error('CNN model not loaded');
    const tf = this.tf;
    const size = this.info?.cnn?.inputSize ?? 224;
    const norm = this.info?.cnn?.normalization ?? '0_255';
    const out = tf.tidy(() => {
      let x = tf.browser.fromPixels(roi as ImageData, 3).toFloat();
      if (roi.width !== size || roi.height !== size) x = tf.image.resizeBilinear(x, [size, size]);
      if (norm === '0_1') x = x.div(255);
      else if (norm === '-1_1') x = x.div(127.5).sub(1);
      return this.model.predict(x.expandDims(0)).flatten();
    });
    const data = (await out.data()) as Float32Array;
    out.dispose();
    const expected = this.info?.cnn?.embeddingSize ?? featureConfig.cnnEmbeddingSize;
    if (data.length !== expected || data.some((v) => !Number.isFinite(v))) {
      throw new Error(`Invalid CNN embedding (length ${data.length}, expected ${expected})`);
    }
    return data;
  }

  predictXgboost(features: number[]): TreePrediction {
    if (xgb.FEATURE_COUNT && features.length !== xgb.FEATURE_COUNT) {
      throw new Error(`XGBoost expects ${xgb.FEATURE_COUNT} features, got ${features.length}`);
    }
    return xgb.predict(features);
  }

  featuresOutOfRange(region: Region, colorFeatures: number[], ageYears = 30): string[] {
    const byGroup = this.info?.featureRanges?.[region];
    const ranges = byGroup?.[ageYears >= 15 ? 'adult' : 'child'] ?? byGroup?.adult ?? byGroup?.child;
    if (!ranges) return [];
    return Object.entries(ranges)
      .filter(([name, [lo, hi]]) => {
        const v = colorFeatures[COLOR_FEATURE_NAMES.indexOf(name)];
        return v !== undefined && (v < lo || v > hi);
      })
      .map(([name]) => name);
  }

  predictAnemiaProbability(region: Region, colorFeatures: number[]): { probability: number; looksAnemic: boolean } {
    if (region !== 'palm' || palm.IS_PLACEHOLDER) throw new Error(`No classifier for ${region}`);
    const probability = palm.predictProbability(colorFeatures);
    return { probability, looksAnemic: probability >= palm.THRESHOLD };
  }

  predictRandomForest(features: number[]): TreePrediction {
    if (rf.FEATURE_COUNT && features.length !== rf.FEATURE_COUNT) {
      throw new Error(`Random Forest expects ${rf.FEATURE_COUNT} features, got ${features.length}`);
    }
    return { hb: rf.predict(features) };
  }
}
