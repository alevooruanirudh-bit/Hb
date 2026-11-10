import { describe, expect, it } from 'vitest';
import { isValidCalibration, personalOffset } from './personalCalibration';
import { fuseEstimates, regionHalfWidth } from './fusion';
import type { RegionEstimate } from './types';

const DAY = 86_400_000;
const now = Date.UTC(2026, 8, 30);

describe('personal calibration', () => {
  it('returns null without blood tests', () => {
    expect(personalOffset(undefined, now)).toBeNull();
    expect(personalOffset([], now)).toBeNull();
  });

  it('shrinks a single test towards zero (one test is not fully trusted)', () => {
    // lab 14.5, photo 11.9 → raw +2.6; n=1 → ×1/1.5 ≈ +1.7
    const r = personalOffset([{ labHb: 14.5, labDate: now, estimateHb: 11.9, createdAt: now }], now)!;
    expect(r.tests).toBe(1);
    expect(r.offset).toBeCloseTo(1.7, 1);
  });

  it('trusts more tests more and averages them', () => {
    const pts = [0, 1, 2].map((i) => ({ labHb: 14.5, labDate: now - i * DAY, estimateHb: 12.0, createdAt: now }));
    const r = personalOffset(pts, now)!;
    expect(r.offset).toBeCloseTo(2.5 * (3 / 3.5), 1);
  });

  it('caps the offset and ignores tests older than a year', () => {
    expect(personalOffset([{ labHb: 20, labDate: now, estimateHb: 8, createdAt: now }], now)!.offset).toBe(4);
    expect(personalOffset([{ labHb: 14, labDate: now - 400 * DAY, estimateHb: 11, createdAt: now }], now)).toBeNull();
  });

  it('only accepts blood tests within 7 days of the scan and plausible values', () => {
    expect(isValidCalibration(14.5, now, now + 3 * DAY)).toBe('ok');
    expect(isValidCalibration(14.5, now, now + 10 * DAY)).toBe('tooFarApart');
    expect(isValidCalibration(45, now, now)).toBe('hbRange');
  });
});

describe('out-of-range photos', () => {
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

  it('widens the range and forces lower confidence', () => {
    expect(regionHalfWidth(est({ lower: 11, upper: 13, outOfRange: true }))).toBeGreaterThan(
      regionHalfWidth(est({ lower: 11, upper: 13 })),
    );
    expect(fuseEstimates([est({ outOfRange: true })]).reliability).toBe('low');
  });

  it('counts less than an in-range region', () => {
    const r = fuseEstimates([est({ region: 'eye', hb: 10, outOfRange: true }), est({ region: 'nails', hb: 13 })]);
    expect(r.hb).toBeGreaterThan(11.5);
  });
});
