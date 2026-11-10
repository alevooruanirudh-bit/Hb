import { describe, expect, it } from 'vitest';
import { FallbackDecider } from './fallbackDecider';

const decider = new FallbackDecider({ minPlausibleHb: 4, maxPlausibleHb: 20, maxIntervalWidth: 3.5 });
const good = { hb: 12.1, lower: 11.3, upper: 12.9 };

describe('FallbackDecider', () => {
  it('uses XGBoost when nothing triggers', () => {
    const d = decider.decide({ cnnFailed: false, qualityStatus: 'pass', xgb: good });
    expect(d).toEqual({ model: 'xgboost', reasons: [] });
  });

  it('falls back when CNN extraction failed', () => {
    expect(decider.shouldSkipXgboost({ cnnFailed: true, qualityStatus: 'pass' })).toBe(true);
    const d = decider.decide({ cnnFailed: true, qualityStatus: 'pass' });
    expect(d.model).toBe('randomForest');
    expect(d.reasons).toEqual(['cnnFailed']);
  });

  it('falls back on borderline quality', () => {
    const d = decider.decide({ cnnFailed: false, qualityStatus: 'borderline', xgb: good });
    expect(d.model).toBe('randomForest');
    expect(d.reasons).toContain('borderlineQuality');
  });

  it.each([3.9, 20.1, Number.NaN])('falls back on implausible value %s', (hb) => {
    const d = decider.decide({ cnnFailed: false, qualityStatus: 'pass', xgb: { hb } });
    expect(d.model).toBe('randomForest');
    expect(d.reasons).toEqual(['implausibleValue']);
  });

  it('accepts boundary values 4 and 20', () => {
    expect(decider.decide({ cnnFailed: false, qualityStatus: 'pass', xgb: { hb: 4 } }).model).toBe('xgboost');
    expect(decider.decide({ cnnFailed: false, qualityStatus: 'pass', xgb: { hb: 20 } }).model).toBe(
      'xgboost',
    );
  });

  it('falls back when the quantile interval is too wide', () => {
    const d = decider.decide({
      cnnFailed: false,
      qualityStatus: 'pass',
      xgb: { hb: 11, lower: 8.5, upper: 12.5 },
    });
    expect(d.model).toBe('randomForest');
    expect(d.reasons).toEqual(['wideInterval']);
  });

  it('keeps XGBoost when the interval equals the limit', () => {
    const d = decider.decide({
      cnnFailed: false,
      qualityStatus: 'pass',
      xgb: { hb: 11, lower: 9.25, upper: 12.75 },
    });
    expect(d.model).toBe('xgboost');
  });

  it('collects multiple reasons', () => {
    const d = decider.decide({
      cnnFailed: true,
      qualityStatus: 'borderline',
      xgb: { hb: 25, lower: 10, upper: 30 },
    });
    expect(d.reasons).toEqual(['cnnFailed', 'borderlineQuality', 'implausibleValue', 'wideInterval']);
  });

  it('falls back if XGBoost produced no output', () => {
    const d = decider.decide({ cnnFailed: false, qualityStatus: 'pass' });
    expect(d.model).toBe('randomForest');
  });
});
