import Dexie, { type Table } from 'dexie';
import type { CalibrationPoint } from '@/ml/personalCalibration';
import type { QualityStatus, Region, RegionEstimate, Reliability, Severity, Sex, SkinTone } from '@/ml/types';

/** A person being screened. One device can hold many (family / health camp). */
export interface Profile {
  id?: number;
  name: string;
  /** Age in whole years. For children under 5, `ageMonths` adds precision. */
  ageYears: number;
  ageMonths?: number;
  sex: Sex;
  pregnant: boolean;
  /** ISO 3166-1 alpha-2 country code, e.g. "IN". */
  country?: string;
  /** State / union territory (free text for countries without a list). */
  state?: string;
  city?: string;
  /** Elevation of home in metres (band lower bound) — used for the WHO altitude adjustment. */
  altitudeM?: number;
  /** Asked directly (never inferred from appearance). */
  diet?: Diet;
  /** Measured from a hand/arm photo (ITA°) or self-reported. The photo itself is not stored. */
  skinTone?: SkinTone;
  /** Personal calibration: this person's blood tests paired with scans (see ml/personalCalibration). */
  calibrations?: CalibrationPoint[];
  createdAt: number;
}

export type Diet = 'vegetarian' | 'eggetarian' | 'nonVegetarian' | 'vegan';

/** A completed, saved screening. Images are never stored here. */
export interface ScanResultRecord {
  id?: number;
  profileId: number;
  timestamp: number;
  hb: number;
  hbLow?: number;
  hbHigh?: number;
  severityRange?: [Severity, Severity];
  upperNormal?: number;
  aboveNormal?: boolean;
  hbAdjusted?: number;
  hbUncalibrated?: number;
  personalCalibration?: { offset: number; tests: number };
  altitudeAdjustment?: number;
  skinTone?: SkinTone;
  allRegionsAffected?: boolean;
  severity: Severity;
  anemia: boolean;
  reliability: Reliability;
  usedFallback: boolean;
  /** Per-region estimates (value, model used, confidence, quality). */
  regions: RegionEstimate[];
  /** Mean quality score across regions (0–1). */
  qualityScore: number;
  qualityStatus: QualityStatus;
  thresholdGroup: string;
  normalThreshold: number;
  modelSource: 'mock' | 'real';
  modelVersion: string;
  isDemo: boolean;
  durationMs: number;
  /** Device-learning correction applied to this result (see ml/deviceLearning). */
  deviceCorrection?: { offset: number; pairs: number };
  /**
   * Colour measurements of each scanned area (numbers only — no image). Kept so a blood test
   * entered later can teach the app (device learning, and the optional export for retraining).
   */
  features?: Array<{ region: Region; colorFeatures: number[] }>;
  /** Person details at scan time (the profile may change later). No name. */
  subject?: { ageYears: number; sex: Sex; pregnant: boolean; state?: string; altitudeM?: number };
  /** Optional real blood test (CBC / HemoCue) for this scan, entered by the user — now or later from History. */
  bloodTest?: { labHb: number; labDate: number; enteredAt: number };
}

export type QuestionAnswer = 'yes' | 'no' | 'unsure';

export const QUESTION_IDS = [
  'tired',
  'dizzy',
  'heavyPeriods',
  'bloodLoss',
  'vegetarian',
  'teaWithMeals',
  'noRecentDeworming',
  'pregnant',
] as const;
export type QuestionId = (typeof QUESTION_IDS)[number];

export interface QuestionnaireResponse {
  id?: number;
  scanId?: number;
  profileId: number;
  timestamp: number;
  answers: Partial<Record<QuestionId, QuestionAnswer>>;
}

/**
 * Opt-in only: anonymized data kept for contribution to model improvement.
 * Nothing is written to this table unless the user enabled "Contribute data".
 */
export interface ContributionRecord {
  id?: number;
  scanId: number;
  region: Region;
  /** JPEG of the analysed ROI crop only (not the full photo). */
  image?: Blob;
  features: number[];
  hbEstimate: number;
  createdAt: number;
  uploaded: boolean;
}

/** Dexie (IndexedDB) database. All data stays on this device by default. */
export class HemoScanDB extends Dexie {
  profiles!: Table<Profile, number>;
  scanResults!: Table<ScanResultRecord, number>;
  questionnaireResponses!: Table<QuestionnaireResponse, number>;
  contributions!: Table<ContributionRecord, number>;

  constructor() {
    super('hemoscan');
    this.version(1).stores({
      profiles: '++id, name, createdAt',
      scanResults: '++id, profileId, timestamp, severity',
      questionnaireResponses: '++id, scanId, profileId, timestamp',
      contributions: '++id, scanId, uploaded, createdAt',
    });
  }
}

export const db = new HemoScanDB();
