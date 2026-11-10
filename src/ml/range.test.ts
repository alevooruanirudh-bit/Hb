import { describe, expect, it } from 'vitest';
import { fuseEstimates, regionHalfWidth } from './fusion';
import { SeverityClassifier } from './severityClassifier';
import type { RegionEstimate } from './types';
import { judgedHb, rangeText } from '@/utils/hbDisplay';

const est = (p: Partial<RegionEstimate>): RegionEstimate => ({
  region: 'eye',
  hb: 11.5,
  model: 'xgboost',
  fallbackReasons: [],
  qualityScore: 1,
  qualityStatus: 'pass',
  detectionConfidence: 1,
  detectionMethod: 'landmarks',
  ...p,
});

describe('likely range (uncertainty)', () => {
  it('every estimate gets a range around it', () => {
    const r = fuseEstimates([est({ hb: 11.5, lower: 11.0, upper: 12.0 })]);
    expect(r.low).toBeLessThan(r.hb);
    expect(r.high).toBeGreaterThan(r.hb);
  });

  it('is never narrower than ±0.6 g/dL (photos cannot be that precise)', () => {
    const r = fuseEstimates([est({ hb: 11.5, lower: 11.45, upper: 11.55 })]);
    expect(r.high - r.low).toBeGreaterThanOrEqual(1.2 - 1e-9);
  });

  it('uses a default width when the backup model gives no interval', () => {
    expect(regionHalfWidth(est({ model: 'randomForest' }))).toBeCloseTo(1.2, 5);
  });

  it('widens for poor photo quality, weak detection and confounders', () => {
    const good = regionHalfWidth(est({ lower: 11, upper: 12 }));
    expect(regionHalfWidth(est({ lower: 11, upper: 12, qualityScore: 0.5 }))).toBeGreaterThan(good);
    expect(regionHalfWidth(est({ lower: 11, upper: 12, detectionConfidence: 0.4 }))).toBeGreaterThan(good);
    expect(regionHalfWidth(est({ lower: 11, upper: 12, confounderFactor: 0.3 }))).toBeGreaterThan(good);
  });

  it('widens when regions disagree', () => {
    const agree = fuseEstimates([est({ region: 'eye', hb: 11.5 }), est({ region: 'nails', hb: 11.6 })]);
    const disagree = fuseEstimates([est({ region: 'eye', hb: 10.5 }), est({ region: 'nails', hb: 12.5 })]);
    expect(disagree.high - disagree.low).toBeGreaterThan(agree.high - agree.low);
  });

  it('is capped at ±4 g/dL', () => {
    const r = fuseEstimates([est({ hb: 11, qualityScore: 0.05, detectionConfidence: 0.1, lower: 2, upper: 20 })]);
    expect(r.high - r.low).toBeLessThanOrEqual(8 + 1e-9);
  });

  it('widens and down-weights a region whose training population does not match the person', () => {
    expect(regionHalfWidth(est({ lower: 11, upper: 12, populationMismatch: true }))).toBeGreaterThan(
      regionHalfWidth(est({ lower: 11, upper: 12 })),
    );
    const r = fuseEstimates([est({ region: 'eye', hb: 10, populationMismatch: true }), est({ region: 'nails', hb: 13 })]);
    const r0 = fuseEstimates([est({ region: 'eye', hb: 10 }), est({ region: 'nails', hb: 13 })]);
    expect(r.hb).toBeGreaterThan(r0.hb);
  });

  it('gives per-region ± values', () => {
    const r = fuseEstimates([est({ lower: 11, upper: 12 })]);
    expect(r.regions[0].halfWidth).toBeGreaterThanOrEqual(0.6);
  });
});

describe('healthy range (min and max)', () => {
  const c = new SeverityClassifier();
  it.each([
    [{ ageYears: 30, sex: 'female' as const, pregnant: false }, 12.0, 15.5],
    [{ ageYears: 30, sex: 'male' as const, pregnant: false }, 13.0, 17.0],
    [{ ageYears: 28, sex: 'female' as const, pregnant: true }, 11.0, 14.5],
    [{ ageYears: 3, sex: 'male' as const, pregnant: false }, 11.0, 13.5],
  ])('%o → %s – %s g/dL', (subject, min, max) => {
    const g = c.selectGroup(subject).group;
    expect(g.normal).toBe(min);
    expect(g.upper).toBe(max);
  });
});

describe('judged value display', () => {
  it('applies the altitude adjustment to value and range', () => {
    const j = judgedHb({ hb: 13.8, hbLow: 13.0, hbHigh: 14.6, hbAdjusted: 11.1, altitudeAdjustment: 2.7 });
    expect(j).toEqual({ value: 11.1, low: 10.3, high: 11.9 });
    expect(rangeText({ hb: 11.5, hbLow: 11.2, hbHigh: 11.8 })).toBe('11.2 – 11.8');
  });

  it('works for older saved scans without a range', () => {
    expect(judgedHb({ hb: 12.4 })).toEqual({ value: 12.4 });
    expect(rangeText({ hb: 12.4 })).toBe('');
  });
});
