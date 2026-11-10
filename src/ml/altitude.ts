import thresholds from '@/config/severityThresholds.json';

const BANDS = [...thresholds.altitudeAdjustments.bands].sort((a, b) => a.minM - b.minM);

/**
 * WHO altitude adjustment: people living at higher elevation have naturally
 * higher hemoglobin, so this amount (g/dL) is SUBTRACTED from the measured
 * value before comparing it with the anemia cutoffs.
 */
export function altitudeAdjustment(elevationM: number | undefined): number {
  if (!elevationM || elevationM < 0) return 0;
  let adj = 0;
  for (const b of BANDS) if (elevationM >= b.minM) adj = b.adjust;
  return adj;
}

/** Elevation bands offered in the profile form (lower bounds, metres). */
export const ALTITUDE_BANDS_M = BANDS.map((b) => b.minM);
