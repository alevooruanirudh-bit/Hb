import { describe, expect, it } from 'vitest';
import { altitudeAdjustment } from './altitude';
import { SeverityClassifier } from './severityClassifier';
import { confounderFactor } from './confounders';
import { fuseEstimates } from './fusion';
import type { RegionEstimate } from './types';
import { itaCategory, measureIta, palmWeightFactor } from '@/imageProcessing/skinTone';
import { detectImageFlags, detectScleraRed } from '@/imageProcessing/confounderDetection';
import { solidImage } from '@/test/syntheticImages';
import { createImage } from '@/imageProcessing/types';

describe('altitude adjustment (WHO)', () => {
  it.each([
    [0, 0],
    [999, 0],
    [1000, 0.2],
    [1650, 0.5],
    [2200, 0.8],
    [3500, 2.7],
    [5000, 4.5],
  ])('%s m → −%s g/dL', (m, adj) => {
    expect(altitudeAdjustment(m)).toBe(adj);
  });

  it('classifies on the adjusted value: 12.3 g/dL is normal in the plains but mild anemia at 3500 m (woman)', () => {
    const c = new SeverityClassifier();
    const woman = { ageYears: 30, sex: 'female' as const, pregnant: false };
    expect(c.classify(12.3, woman).severity).toBe('normal');
    const high = c.classify(12.3, { ...woman, altitudeM: 3500 });
    expect(high.adjustedHb).toBe(9.6);
    expect(high.altitudeAdjustment).toBe(2.7);
    expect(high.severity).toBe('moderate');
  });

  it('keeps WHO cutoffs used by India: 12.0 g/dL is normal for a non-pregnant woman, mild for a man', () => {
    const c = new SeverityClassifier();
    expect(c.classify(12.0, { ageYears: 30, sex: 'female', pregnant: false }).severity).toBe('normal');
    expect(c.classify(12.0, { ageYears: 30, sex: 'male', pregnant: false }).severity).toBe('mild');
  });
});

describe('skin tone (ITA°)', () => {
  it('orders light → dark skin correctly', () => {
    const light = measureIta(solidImage(120, 120, 236, 200, 178))!;
    const medium = measureIta(solidImage(120, 120, 190, 135, 105))!;
    const dark = measureIta(solidImage(120, 120, 105, 68, 50))!;
    expect(light).toBeGreaterThan(medium);
    expect(medium).toBeGreaterThan(dark);
    expect(['veryLight', 'light']).toContain(itaCategory(light));
    expect(['brown', 'dark']).toContain(itaCategory(dark));
  });

  it('returns null when no skin is visible', () => {
    expect(measureIta(solidImage(120, 120, 40, 90, 200))).toBeNull();
  });

  it('trusts the palm less on darker skin', () => {
    expect(palmWeightFactor('light')).toBe(1);
    expect(palmWeightFactor('brown')).toBeLessThan(palmWeightFactor('tan'));
    expect(palmWeightFactor('dark')).toBeLessThan(palmWeightFactor('brown'));
    expect(palmWeightFactor(undefined)).toBe(1);
  });
});

describe('confounders', () => {
  it('reported conditions reduce or remove a region', () => {
    expect(confounderFactor('eye')).toBe(1);
    expect(confounderFactor('eye', ['criedOrRubbed'])).toBeLessThan(1);
    expect(confounderFactor('nails', ['nailPolishOrHenna'])).toBe(0);
    expect(confounderFactor('nails', ['nailsCutShort'])).toBe(0.5);
    expect(confounderFactor('palm', ['hennaOnPalm'])).toBe(0);
  });

  it('ignores conditions that belong to another region', () => {
    expect(confounderFactor('eye', ['nailsCutShort'])).toBe(1);
  });

  it('image flags compound with reported conditions', () => {
    expect(confounderFactor('eye', ['criedOrRubbed'], ['scleraRed'])).toBeCloseTo(0.09, 3);
  });
});

describe('confounder detection in images', () => {
  const eyeImage = (sclera: [number, number, number]) => {
    const img = createImage(200, 200);
    for (let y = 0; y < 200; y++)
      for (let x = 0; x < 200; x++) {
        const i = (y * 200 + x) * 4;
        const c = y < 100 ? sclera : [190, 70, 80];
        img.data.set([...c, 255], i);
      }
    return img;
  };
  const eyelid = [{ x: 20, y: 100, width: 160, height: 50 }];

  it('flags a red sclera (crying / irritation) but not a white one', () => {
    expect(detectScleraRed(eyeImage([235, 232, 228]), eyelid)).toBe(false);
    expect(detectScleraRed(eyeImage([238, 190, 190]), eyelid)).toBe(true);
  });

  it('flags nail polish / mehndi colours but not a normal nail bed', () => {
    expect(detectImageFlags('nails', solidImage(64, 64, 214, 140, 135))).toEqual([]);
    expect(detectImageFlags('nails', solidImage(64, 64, 40, 60, 200))).toContain('nailCoating'); // blue polish
    expect(detectImageFlags('nails', solidImage(64, 64, 170, 70, 25))).toContain('nailCoating'); // henna orange
    expect(detectImageFlags('palm', solidImage(64, 64, 160, 60, 20))).toContain('hennaDetected');
  });

  it('flags a dark spot (bruise) on nails', () => {
    const img = solidImage(64, 64, 214, 140, 135);
    for (let i = 0; i < img.data.length / 4 / 5; i++) img.data.set([30, 15, 25, 255], i * 4);
    expect(detectImageFlags('nails', img)).toContain('nailDarkSpot');
  });
});

describe('fusion with confounders and skin tone', () => {
  const est = (p: Partial<RegionEstimate>): RegionEstimate => ({
    region: 'eye',
    hb: 12,
    model: 'xgboost',
    fallbackReasons: [],
    qualityScore: 1,
    qualityStatus: 'pass',
    detectionConfidence: 1,
    detectionMethod: 'landmarks',
    ...p,
  });

  it('excludes a region with nail polish from the combined value', () => {
    const r = fuseEstimates([est({ region: 'eye', hb: 10 }), est({ region: 'nails', hb: 14, conditions: ['nailPolishOrHenna'] })]);
    expect(r.hb).toBe(10);
    expect(r.regions.find((x) => x.region === 'nails')!.confounderFactor).toBe(0);
  });

  it('reduces the palm weight on dark skin', () => {
    const light = fuseEstimates([est({ region: 'eye', hb: 10 }), est({ region: 'palm', hb: 14 })], { skinTone: 'light' });
    const dark = fuseEstimates([est({ region: 'eye', hb: 10 }), est({ region: 'palm', hb: 14 })], { skinTone: 'dark' });
    expect(dark.hb).toBeLessThan(light.hb);
  });

  it('marks the result unreliable when every region is affected', () => {
    const r = fuseEstimates([est({ region: 'nails', hb: 11, conditions: ['nailPolishOrHenna'] })]);
    expect(r.allRegionsAffected).toBe(true);
    expect(r.reliability).toBe('low');
    expect(r.hb).toBe(11);
  });
});
