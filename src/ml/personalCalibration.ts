import { personalCalibrationConfig } from '@/config/pipelineConfig';

/** One blood test paired with a photo scan of the same person (within a few days). */
export interface CalibrationPoint {
  /** Lab hemoglobin (g/dL) from a blood test (CBC / HemoCue). */
  labHb: number;
  labDate: number;
  /** The app's photo estimate BEFORE personal calibration, from a scan close to labDate. */
  estimateHb: number;
  scanId?: number;
  createdAt: number;
}

const DAY = 86_400_000;

/**
 * Personal calibration: photo colour depends a lot on the person's phone camera, lighting and
 * tissue, so a person's own blood test tells us how far off the photo estimate is for them.
 *
 *   offset = mean(labHb − estimateHb) × n / (n + k)      (shrunk towards 0 for few tests)
 *
 * Uses tests from the last `maxAgeDays`, capped at ±`maxOffset` g/dL.
 */
export function personalOffset(points: CalibrationPoint[] | undefined, now = Date.now()): { offset: number; tests: number } | null {
  const c = personalCalibrationConfig;
  const recent = (points ?? []).filter((p) => now - p.labDate <= c.maxAgeDays * DAY);
  if (!recent.length) return null;
  const mean = recent.reduce((s, p) => s + (p.labHb - p.estimateHb), 0) / recent.length;
  const shrunk = (mean * recent.length) / (recent.length + c.shrinkK);
  const offset = Math.max(-c.maxOffset, Math.min(c.maxOffset, shrunk));
  return { offset: Math.round(offset * 10) / 10, tests: recent.length };
}

/** A blood test can calibrate a scan only if both were taken within `maxDaysApart` days. */
export function isValidCalibration(labHb: number, labDate: number, scanTime: number): 'ok' | 'hbRange' | 'tooFarApart' {
  if (!Number.isFinite(labHb) || labHb < 3 || labHb > 22) return 'hbRange';
  if (Math.abs(scanTime - labDate) > personalCalibrationConfig.maxDaysApart * DAY) return 'tooFarApart';
  return 'ok';
}
