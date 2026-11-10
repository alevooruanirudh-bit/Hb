import { featureConfig } from '@/config/pipelineConfig';
import { COLOR_FEATURE_COUNT, COLOR_FEATURE_NAMES } from '@/imageProcessing/colorFeatures';
import type { RGBAImage } from '@/imageProcessing/types';
import { REGION_ORDER, type ModelProvider, type TreePrediction } from './modelProvider';
import type { Region } from './types';

/**
 * Per-region linear calibration used by the mock: Hb ≈ intercept + slope × redness,
 * where redness mixes the median CIE-Lab a* (red–green axis) of the
 * white-balanced ROI with the erythema index. Paler tissue → lower simulated Hb.
 * Fitted by `scripts/calibrate-demo.ts` so the bundled demo samples land in
 * their intended severity bands.
 */
export const MOCK_CALIBRATION: Record<Region, { intercept: number; slope: number }> = {
  eye: { intercept: 6.108, slope: 0.2068 },
  nails: { intercept: 4.278, slope: 1.1884 },
  palm: { intercept: 2.256, slope: 0.9258 },
};

const idx = (name: string) => COLOR_FEATURE_NAMES.indexOf(name);
const I_A_P50 = idx('a_p50');
const I_A_STD = idx('a_std');
const I_EI = idx('erythema_index');

function regionFromOneHot(features: number[]): Region {
  const oh = features.slice(-3);
  return REGION_ORDER[Math.max(0, oh.indexOf(1))];
}

/** Deterministic small jitter from feature values (model-like but repeatable). */
function jitter(seed: number, amp: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 2 * amp;
}

/**
 * Simulated models for demos / development while trained models are not
 * available. The estimate is derived from real color features of the image
 * (redness of the white-balanced ROI), so paler images give lower values —
 * but it is NOT a validated model and results are labelled accordingly.
 */
export class MockModelProvider implements ModelProvider {
  readonly source = 'mock' as const;
  readonly version = 'mock-1.0';
  readonly usesCnn = true;
  readonly regions: Region[] = ['eye', 'nails', 'palm'];

  async init(): Promise<void> {}

  async extractCnnFeatures(roi: RGBAImage): Promise<Float32Array> {
    // Simulate inference latency on a mid-range phone.
    await new Promise((r) => setTimeout(r, 120));
    const out = new Float32Array(featureConfig.cnnEmbeddingSize);
    const g = 8;
    const cells: number[] = [];
    for (let gy = 0; gy < g; gy++) {
      for (let gx = 0; gx < g; gx++) {
        const x = Math.floor(((gx + 0.5) / g) * roi.width);
        const y = Math.floor(((gy + 0.5) / g) * roi.height);
        const i = (y * roi.width + x) * 4;
        cells.push(roi.data[i] / 255, roi.data[i + 1] / 255, roi.data[i + 2] / 255);
      }
    }
    for (let i = 0; i < out.length; i++)
      out[i] = Math.max(0, cells[i % cells.length] * (1 + 0.1 * Math.sin(i)));
    return out;
  }

  /** Redness score of a ROI from its color features (exposed for calibration). */
  static redness(color: number[]): number {
    return 0.8 * color[I_A_P50] * 128 + 0.2 * color[I_EI] * 100;
  }

  estimate(color: number[], region: Region): { hb: number; spread: number } {
    const c = MOCK_CALIBRATION[region];
    const hb = c.intercept + c.slope * MockModelProvider.redness(color);
    const texture = color[I_A_STD] * 128;
    // 10–90 % interval width similar to published photo-based estimators (~±0.8–1.4 g/dL).
    return { hb: Math.max(4.5, Math.min(17.5, hb)), spread: 1.6 + Math.min(1.2, texture / 12) };
  }

  predictXgboost(features: number[]): TreePrediction {
    const region = regionFromOneHot(features);
    const color = features.slice(features.length - 3 - COLOR_FEATURE_COUNT, features.length - 3);
    const { hb, spread } = this.estimate(color, region);
    const v = hb + jitter(color[0] + color[3], 0.15);
    return { hb: v, lower: v - spread / 2, upper: v + spread / 2 };
  }

  predictRandomForest(features: number[]): TreePrediction {
    const region = regionFromOneHot(features);
    const color = features.slice(0, COLOR_FEATURE_COUNT);
    const { hb } = this.estimate(color, region);
    // RF on color only: a bit coarser than XGBoost.
    return { hb: Math.round((hb + jitter(color[1], 0.3)) * 4) / 4 };
  }
}
