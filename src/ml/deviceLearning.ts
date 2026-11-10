import { deviceLearningConfig, personalCalibrationConfig } from '@/config/pipelineConfig';

const DAY = 86_400_000;

/** A scan on this device with a real blood test entered for it. */
export interface LearningPair {
  /** Photo estimate before any correction (g/dL). */
  estimate: number;
  labHb: number;
  /** Who it belongs to — the error check leaves one person out at a time. */
  personId: number;
  scanTime: number;
  labDate: number;
}

export interface DeviceModel {
  /** Switched on only when it measurably lowers the error for people it was not fitted on. */
  active: boolean;
  pairs: number;
  people: number;
  /** correction(est) = a + c · (est − center) */
  a: number;
  c: number;
  center: number;
  /** Mean absolute error (g/dL) on held-out people: photo alone vs photo + correction. */
  maeBefore?: number;
  maeAfter?: number;
  /** Why it is not active yet. */
  reason?: 'fewPairs' | 'fewPeople' | 'noImprovement';
}

const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));

/** Keeps blood tests taken close to the scan, from real (non-demo) models, not too old. */
export function usablePairs(pairs: LearningPair[], now = Date.now()): LearningPair[] {
  return pairs.filter(
    (p) =>
      Number.isFinite(p.estimate) &&
      Math.abs(p.scanTime - p.labDate) <= personalCalibrationConfig.maxDaysApart * DAY &&
      now - p.labDate <= deviceLearningConfig.maxAgeDays * DAY,
  );
}

function fitRaw(pairs: LearningPair[]) {
  const c = deviceLearningConfig;
  const n = pairs.length;
  const center = pairs.reduce((s, p) => s + p.estimate, 0) / n;
  const res = pairs.map((p) => p.labHb - p.estimate);
  const meanRes = res.reduce((s, r) => s + r, 0) / n;
  // Shrink towards "no correction" when there are few blood tests.
  const a = clamp((meanRes * n) / (n + c.shrinkK), c.maxOffset);
  let sxy = 0;
  let sxx = 0;
  pairs.forEach((p, i) => {
    sxy += (p.estimate - center) * (res[i] - meanRes);
    sxx += (p.estimate - center) ** 2;
  });
  const slope = clamp(sxy / (sxx + c.slopeRidge), c.maxSlope);
  return { a, c: slope, center };
}

export function correctionFor(m: Pick<DeviceModel, 'a' | 'c' | 'center'>, estimate: number): number {
  return Math.round(clamp(m.a + m.c * (estimate - m.center), deviceLearningConfig.maxOffset) * 10) / 10;
}

/**
 * Device learning: the biggest error source is the phone camera + lighting, which every person
 * scanned on this phone shares. Each blood test entered (any profile) teaches the app that bias.
 */
export function fitDeviceModel(all: LearningPair[], now = Date.now()): DeviceModel {
  const cfg = deviceLearningConfig;
  const pairs = usablePairs(all, now);
  const people = new Set(pairs.map((p) => p.personId)).size;
  const base = { pairs: pairs.length, people, a: 0, c: 0, center: 0 };
  if (pairs.length < cfg.minPairs) return { ...base, active: false, reason: 'fewPairs' };
  if (people < cfg.minPeople) return { ...base, active: false, reason: 'fewPeople' };

  // Leave-one-person-out: would the correction have helped someone it never saw?
  let before = 0;
  let after = 0;
  for (const id of new Set(pairs.map((p) => p.personId))) {
    const train = pairs.filter((p) => p.personId !== id);
    const m = fitRaw(train);
    for (const p of pairs.filter((q) => q.personId === id)) {
      before += Math.abs(p.labHb - p.estimate);
      after += Math.abs(p.labHb - (p.estimate + correctionFor(m, p.estimate)));
    }
  }
  const maeBefore = Math.round((before / pairs.length) * 100) / 100;
  const maeAfter = Math.round((after / pairs.length) * 100) / 100;
  const m = fitRaw(pairs);
  const active = maeBefore - maeAfter >= cfg.minImprovement;
  return { ...base, ...m, active, maeBefore, maeAfter, reason: active ? undefined : 'noImprovement' };
}
