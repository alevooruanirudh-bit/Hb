/** Fields shared by ScanOutcome and ScanResultRecord that describe the estimate. */
interface HbFields {
  hb: number;
  hbAdjusted?: number;
  hbLow?: number;
  hbHigh?: number;
  altitudeAdjustment?: number;
}

const r1 = (v: number) => Math.round(v * 10) / 10;

/**
 * The value that is compared with the anemia cutoffs (altitude-adjusted) and
 * its likely range — what the gauge, history, trend chart and report show.
 * Older saved scans without a range return only `value`.
 */
export function judgedHb(s: HbFields): { value: number; low?: number; high?: number } {
  const adj = s.altitudeAdjustment ?? 0;
  const value = s.hbAdjusted ?? r1(s.hb - adj);
  if (s.hbLow === undefined || s.hbHigh === undefined) return { value };
  return { value, low: r1(s.hbLow - adj), high: r1(s.hbHigh - adj) };
}

/** "11.2 – 11.8" or "" when no range is known. */
export function rangeText(s: HbFields): string {
  const j = judgedHb(s);
  return j.low !== undefined && j.high !== undefined ? `${j.low.toFixed(1)} – ${j.high.toFixed(1)}` : '';
}
