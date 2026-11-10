import thresholdsJson from '@/config/severityThresholds.json';
import type { ClassificationSubject, Severity } from './types';
import { altitudeAdjustment } from './altitude';

/** Band lower bounds (g/dL) for one WHO population group. */
export interface ThresholdGroup {
  minAge: number;
  maxAge: number;
  sex?: 'female' | 'male';
  pregnant?: boolean;
  normal: number;
  mild: number;
  moderate: number;
  /** Typical upper limit of the healthy range (lab reference), optional. */
  upper?: number;
}

export interface ThresholdConfig {
  version: string;
  groups: Record<string, ThresholdGroup>;
}

export interface Classification {
  severity: Severity;
  /** Hb actually compared with the cutoffs (after altitude adjustment). */
  adjustedHb: number;
  altitudeAdjustment: number;
  anemia: boolean;
  groupKey: string;
  group: ThresholdGroup;
}

/**
 * Classifies a hemoglobin value into WHO anemia severity for a given person.
 * Thresholds live in `src/config/severityThresholds.json` so they can be
 * updated without code changes.
 */
export class SeverityClassifier {
  constructor(private readonly config: ThresholdConfig = thresholdsJson as ThresholdConfig) {}

  /** Picks the WHO group for a subject. Pregnancy takes priority for females. */
  selectGroup(subject: ClassificationSubject): { key: string; group: ThresholdGroup } {
    const { ageYears, sex, pregnant } = subject;
    const entries = Object.entries(this.config.groups);

    if (pregnant && sex === 'female') {
      const preg = entries.find(([, g]) => g.pregnant);
      if (preg) return { key: preg[0], group: preg[1] };
    }

    const match = entries.find(
      ([, g]) =>
        !g.pregnant && ageYears >= g.minAge && ageYears < g.maxAge && (g.sex === undefined || g.sex === sex),
    );
    if (!match) throw new Error(`No WHO threshold group for age=${ageYears} sex=${sex}`);
    return { key: match[0], group: match[1] };
  }

  /** Classifies after applying the WHO altitude adjustment for where the person lives. */
  classify(hb: number, subject: ClassificationSubject): Classification {
    const { key, group } = this.selectGroup(subject);
    const adj = altitudeAdjustment(subject.altitudeM);
    const adjustedHb = Math.round((hb - adj) * 10) / 10;
    const severity = SeverityClassifier.bandFor(adjustedHb, group);
    return { severity, anemia: severity !== 'normal', adjustedHb, altitudeAdjustment: adj, groupKey: key, group };
  }

  /** Maps an Hb value to a band given lower bounds. Values are compared after rounding to 0.1 g/dL. */
  static bandFor(hb: number, g: Pick<ThresholdGroup, 'normal' | 'mild' | 'moderate'>): Severity {
    const v = Math.round(hb * 10) / 10;
    if (v >= g.normal) return 'normal';
    if (v >= g.mild) return 'mild';
    if (v >= g.moderate) return 'moderate';
    return 'severe';
  }
}

export const severityClassifier = new SeverityClassifier();
