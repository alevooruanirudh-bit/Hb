import { featureConfig, outOfRangeConfig, preprocessConfig } from '@/config/pipelineConfig';
import { extractColorFeatures } from '@/imageProcessing/colorFeatures';
import { dropScleraPixels } from '@/imageProcessing/conjunctiva';
import { crop, resize } from '@/imageProcessing/imageUtils';
import { createImage, type RGBAImage } from '@/imageProcessing/types';
import { FallbackDecider } from './fallbackDecider';
import { buildRfInput, buildXgbInput, demographicFeatures, type ModelProvider, type TreePrediction } from './modelProvider';
import type { Box, QualityReport, Region, RegionDetection, RegionEstimate } from './types';

export interface AnalyzeInput {
  region: Region;
  /** Preprocessed (white-balanced, CLAHE) full image. */
  image: RGBAImage;
  detection: RegionDetection;
  quality: QualityReport;
  /** Age / sex from the profile — model inputs when the trained model uses demographics. */
  subject?: { ageYears: number; sex?: string };
}

export interface AnalyzeOutput {
  estimate: RegionEstimate;
  /** Square ROI used for features (for optional, opt-in data contribution). */
  roi: RGBAImage;
  colorFeatures: number[];
  cnnMs: number;
}

/**
 * Tiles several crops (e.g. four fingernails or two eyelids) into one square
 * mosaic so a single ROI image goes through feature extraction.
 */
export function buildRoiMosaic(image: RGBAImage, boxes: Box[], size: number): RGBAImage {
  if (boxes.length === 1) return resize(crop(image, boxes[0]), size, size);
  const n = Math.ceil(Math.sqrt(boxes.length));
  const cell = Math.floor(size / n);
  const out = createImage(size, size);
  // Fill with the first crop resized, so empty cells don't add black pixels.
  out.data.set(resize(crop(image, boxes[0]), size, size).data);
  boxes.forEach((b, k) => {
    const tile = resize(crop(image, b), cell, cell);
    const ox = (k % n) * cell;
    const oy = Math.floor(k / n) * cell;
    for (let y = 0; y < cell; y++) {
      out.data.set(tile.data.subarray(y * cell * 4, (y + 1) * cell * 4), ((oy + y) * size + ox) * 4);
    }
  });
  return out;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/**
 * Runs ROI → features → FallbackDecider → XGBoost / Random Forest for ONE
 * region. Pure logic (no worker / DOM), so it can be unit tested.
 */
export async function analyzeRegion(
  input: AnalyzeInput,
  provider: ModelProvider,
  decider = new FallbackDecider(),
): Promise<AnalyzeOutput> {
  const roi = buildRoiMosaic(input.image, input.detection.boxes, preprocessConfig.roiSize);
  // The trained eye model learned from pure conjunctiva cut-outs: drop white-of-the-eye pixels.
  const color = extractColorFeatures(
    input.region === 'eye' && provider.source === 'real' ? dropScleraPixels(roi) : roi,
  );

  // Classifier-only regions (palm with trained models): anemia probability, no Hb value.
  if (provider.likelihoodRegions?.includes(input.region) && provider.predictAnemiaProbability) {
    const { probability, looksAnemic } = provider.predictAnemiaProbability(input.region, color);
    console.info(`[HemoScan] ${input.region}: anemia probability ${probability.toFixed(2)}`);
    return {
      estimate: {
        region: input.region,
        hb: Number.NaN,
        model: 'xgboost',
        fallbackReasons: [],
        qualityScore: input.quality.score,
        qualityStatus: input.quality.status,
        detectionConfidence: input.detection.confidence,
        detectionMethod: input.detection.method,
        likelihoodOnly: true,
        anemiaProbability: Math.round(probability * 1000) / 1000,
        looksAnemic,
      },
      roi,
      colorFeatures: color,
      cnnMs: 0,
    };
  }

  let cnn: Float32Array | null = null;
  const t0 = performance.now();
  if (provider.usesCnn) {
    try {
      cnn = await withTimeout(provider.extractCnnFeatures(roi), featureConfig.cnnTimeoutMs);
    } catch (e) {
      console.warn('[analyzeRegion] CNN feature extraction failed:', e);
    }
  }
  const cnnMs = performance.now() - t0;

  // Colour-only models have no CNN step, so "CNN failed" can never trigger the fallback.
  const pre = { cnnFailed: provider.usesCnn && cnn === null, qualityStatus: input.quality.status };
  let xgbPred: TreePrediction | undefined;
  if (!decider.shouldSkipXgboost(pre)) {
    try {
      const demo = provider.usesDemographics ? demographicFeatures(input.subject) : undefined;
      const x = buildXgbInput(provider.usesCnn ? cnn : null, color, input.region, demo);
      xgbPred = provider.predictXgboost(x);
    } catch (e) {
      console.warn('[analyzeRegion] XGBoost failed:', e);
    }
  }

  const decision = decider.decide({ ...pre, xgb: xgbPred });
  const pred: TreePrediction =
    decision.model === 'xgboost' && xgbPred
      ? xgbPred
      : provider.predictRandomForest(buildRfInput(color, input.region));

  console.info(`[HemoScan] ${input.region}: model=${decision.model}`, decision.reasons);
  const oor = provider.featuresOutOfRange?.(input.region, color, input.subject?.ageYears) ?? [];
  const outOfRange = oor.length >= outOfRangeConfig.minFeaturesOutside;

  return {
    estimate: {
      region: input.region,
      hb: Math.round(pred.hb * 10) / 10,
      lower: pred.lower,
      upper: pred.upper,
      model: decision.model,
      fallbackReasons: decision.reasons,
      qualityScore: input.quality.score,
      qualityStatus: input.quality.status,
      detectionConfidence: input.detection.confidence,
      detectionMethod: input.detection.method,
      outOfRange,
      outOfRangeFeatures: oor,
    },
    roi,
    colorFeatures: color,
    cnnMs,
  };
}
