import { featureConfig } from '@/config/pipelineConfig';
import type { RGBAImage } from './types';
import { luma, rgbToHsv, rgbToLab } from './colorSpace';

const BINS = featureConfig.histogramBins;

/**
 * Ordered names of the color feature vector. `training/extract_features.py`
 * produces exactly the same layout — any change here must be mirrored there
 * and the models retrained.
 */
export const COLOR_FEATURE_NAMES: string[] = [
  ...['r', 'g', 'b'].flatMap((c) => [`${c}_mean`, `${c}_std`]),
  ...['h', 's', 'v'].flatMap((c) => [`${c}_mean`, `${c}_std`]),
  ...['L', 'a', 'bb'].flatMap((c) => [`${c}_mean`, `${c}_std`]),
  'rg_ratio',
  'a_p10',
  'a_p50',
  'a_p90',
  'erythema_index',
  ...['r', 'g', 'b', 'a'].flatMap((c) => Array.from({ length: BINS }, (_, i) => `hist_${c}_${i}`)),
];

export const COLOR_FEATURE_COUNT = COLOR_FEATURE_NAMES.length;

/** Pixels brighter than this (specular glare) or darker than this (shadow) are ignored. */
const GLARE_LUMA = featureConfig.glareLuma;
const SHADOW_LUMA = featureConfig.shadowLuma;
/** Range used for a* histogram bins. */
const A_MIN = featureConfig.aHistMin;
const A_MAX = featureConfig.aHistMax;

function percentile(sorted: Float32Array, p: number) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))));
  return sorted[idx];
}

/**
 * Computes hand-crafted color features on a preprocessed ROI crop:
 * mean/std in RGB, HSV and Lab; red/green ratio; a* percentiles; erythema
 * index; and compact normalised histograms (R, G, B, a*).
 */
export function extractColorFeatures(roi: RGBAImage): number[] {
  const { data } = roi;
  const acc = new Float64Array(18); // sums for 9 channels, then squares
  const aVals: number[] = [];
  const hist = new Float64Array(4 * BINS);
  let n = 0;
  let rSum = 0;
  let gSum = 0;
  let eiSum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const y = luma(r, g, b);
    if (y > GLARE_LUMA || y < SHADOW_LUMA) continue;
    const [h, s, v] = rgbToHsv(r, g, b);
    const [L, a, bb] = rgbToLab(r, g, b);
    const ch = [r / 255, g / 255, b / 255, h, s, v, L / 100, a / 128, bb / 128];
    for (let k = 0; k < 9; k++) {
      acc[k] += ch[k];
      acc[9 + k] += ch[k] * ch[k];
    }
    rSum += r;
    gSum += g;
    // Erythema index (Dawson): log10(1/G) - log10(1/R) = log10(R/G)
    eiSum += Math.log10((r + 1) / (g + 1));
    aVals.push(a);
    const bin = (v255: number) => Math.min(BINS - 1, Math.floor((v255 / 256) * BINS));
    hist[bin(r)]++;
    hist[BINS + bin(g)]++;
    hist[2 * BINS + bin(b)]++;
    hist[3 * BINS + Math.min(BINS - 1, Math.max(0, Math.floor(((a - A_MIN) / (A_MAX - A_MIN)) * BINS)))]++;
    n++;
  }

  if (n === 0) return new Array(COLOR_FEATURE_COUNT).fill(0);

  const feats: number[] = [];
  for (let k = 0; k < 9; k++) {
    const mean = acc[k] / n;
    const std = Math.sqrt(Math.max(0, acc[9 + k] / n - mean * mean));
    feats.push(mean, std);
  }
  feats.push(rSum / Math.max(1, gSum));
  const sortedA = Float32Array.from(aVals).sort();
  feats.push(percentile(sortedA, 0.1) / 128, percentile(sortedA, 0.5) / 128, percentile(sortedA, 0.9) / 128);
  feats.push(eiSum / n);
  for (let i = 0; i < hist.length; i++) feats.push(hist[i] / n);
  return feats;
}

/** Convenience accessor by feature name. */
export function featureValue(features: number[], name: string): number {
  return features[COLOR_FEATURE_NAMES.indexOf(name)];
}
