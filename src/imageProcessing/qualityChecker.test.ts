import { describe, expect, it } from 'vitest';
import { QualityChecker } from './qualityChecker';
import { JsOps } from './jsOps';
import { blurryImage, sharpImage, solidImage } from '@/test/syntheticImages';

const checker = new QualityChecker(new JsOps());

describe('QualityChecker', () => {
  it('passes a sharp, well-exposed image', () => {
    const r = checker.check(sharpImage());
    expect(r.status).toBe('pass');
    expect(r.reasons).toEqual([]);
    expect(r.score).toBeGreaterThanOrEqual(0.7);
    expect(r.metrics.blurVariance).toBeGreaterThan(110);
  });

  it('fails a blurry image with reason "blurry"', () => {
    const r = checker.check(blurryImage());
    expect(r.status).toBe('fail');
    expect(r.reasons).toContain('blurry');
    expect(r.score).toBeLessThan(0.4);
  });

  it('fails a very dark image', () => {
    const r = checker.check(sharpImage(200, 200, 25, 20));
    expect(r.status).toBe('fail');
    expect(r.reasons).toContain('tooDark');
  });

  it('fails an over-exposed image', () => {
    const r = checker.check(solidImage(200, 200, 252, 252, 252));
    expect(r.status).toBe('fail');
    expect(r.reasons).toContain('tooBright');
    expect(r.metrics.overexposedFraction).toBeGreaterThan(0.9);
  });

  it('marks slightly soft images as borderline', () => {
    // Custom thresholds make the sharp image fall in the borderline band.
    const strict = new QualityChecker(new JsOps(), { blurFailThreshold: 10, blurGoodThreshold: 1e6 });
    const r = strict.check(sharpImage());
    expect(r.status).toBe('borderline');
    expect(r.reasons).toContain('slightlyBlurry');
  });

  it('marks dim-but-usable lighting as borderline', () => {
    const r = checker.check(sharpImage(200, 200, 68, 40));
    expect(r.status).toBe('borderline');
    expect(r.reasons).toContain('tooDark');
  });

  it('fails images that are too small', () => {
    const r = checker.check(sharpImage(60, 60));
    expect(r.status).toBe('fail');
    expect(r.reasons).toContain('tooSmall');
  });

  it('returns a score in [0,1]', () => {
    for (const img of [sharpImage(), blurryImage(), solidImage(120, 120, 0, 0, 0)]) {
      const { score } = checker.check(img);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });
});
