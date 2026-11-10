import { describe, expect, it } from 'vitest';
import { analyzeRegion } from './regionAnalyzer';
import type { ModelProvider } from './modelProvider';
import * as palm from './models/palmClassifier';
import { COLOR_FEATURE_COUNT } from '@/imageProcessing/colorFeatures';
import { solidImage } from '@/test/syntheticImages';

const quality = { score: 1, status: 'pass' as const, reasons: [], metrics: { blurVariance: 200, meanBrightness: 130, overexposedFraction: 0, underexposedFraction: 0 } };

describe('palm anemia check', () => {
  it('trained palm classifier returns a probability in [0, 1] with the app feature layout', () => {
    if (palm.IS_PLACEHOLDER) return;
    expect(palm.FEATURE_COUNT).toBe(COLOR_FEATURE_COUNT);
    for (const v of [0, 0.3, 0.6]) {
      const p = palm.predictProbability(new Array(COLOR_FEATURE_COUNT).fill(v));
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it('classifier-only regions produce a likelihood and no hemoglobin value', async () => {
    const provider: ModelProvider = {
      source: 'real',
      version: 't',
      usesCnn: false,
      regions: ['eye', 'palm'],
      likelihoodRegions: ['palm'],
      init: async () => {},
      extractCnnFeatures: async () => new Float32Array(),
      predictXgboost: () => ({ hb: 12 }),
      predictRandomForest: () => ({ hb: 12 }),
      predictAnemiaProbability: () => ({ probability: 0.8, looksAnemic: true }),
    };
    const img = solidImage(200, 200, 200, 140, 120);
    const out = await analyzeRegion(
      { region: 'palm', image: img, detection: { boxes: [{ x: 50, y: 50, width: 100, height: 100 }], confidence: 0.8, method: 'landmarks' }, quality },
      provider,
    );
    expect(out.estimate.likelihoodOnly).toBe(true);
    expect(Number.isNaN(out.estimate.hb)).toBe(true);
    expect(out.estimate.anemiaProbability).toBe(0.8);
    expect(out.estimate.looksAnemic).toBe(true);
  });
});
