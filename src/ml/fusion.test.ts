import { describe, expect, it } from 'vitest';
import { fuseEstimates } from './fusion';
import type { RegionEstimate } from './types';

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

describe('fuseEstimates', () => {
  it('returns the single estimate unchanged', () => {
    const r = fuseEstimates([est({ hb: 11.4 })]);
    expect(r.hb).toBe(11.4);
    expect(r.reliability).toBe('high');
  });

  it('weights eye/nails above palm', () => {
    const r = fuseEstimates([est({ region: 'eye', hb: 10 }), est({ region: 'palm', hb: 14 })]);
    expect(r.hb).toBeLessThan(12);
  });

  it('down-weights low-quality and fallback estimates', () => {
    const r = fuseEstimates([
      est({ region: 'eye', hb: 10, qualityScore: 0.3, model: 'randomForest' }),
      est({ region: 'nails', hb: 12 }),
    ]);
    expect(r.hb).toBeGreaterThan(11.3);
  });

  it('reports low reliability when regions disagree strongly', () => {
    const r = fuseEstimates([est({ region: 'eye', hb: 8 }), est({ region: 'nails', hb: 13 })]);
    expect(r.reliability).toBe('low');
  });

  it('reports low reliability with weak detections', () => {
    const r = fuseEstimates([est({ detectionConfidence: 0.3, qualityScore: 0.7 })]);
    expect(r.reliability).toBe('low');
  });
});
