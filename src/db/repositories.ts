import type { CalibrationPoint } from '@/ml/personalCalibration';
import {
  db,
  type ContributionRecord,
  type Profile,
  type QuestionnaireResponse,
  type ScanResultRecord,
} from './db';
import type { ClassificationSubject, ScanOutcome } from '@/ml/types';

/** Profile CRUD. */
export const profileRepo = {
  list: () => db.profiles.orderBy('createdAt').toArray(),
  get: (id: number) => db.profiles.get(id),
  add: (p: Omit<Profile, 'id' | 'createdAt'>) => db.profiles.add({ ...p, createdAt: Date.now() }),
  update: (id: number, p: Partial<Profile>) => db.profiles.update(id, p),
  /** Adds a blood-test calibration point to the profile. */
  async addCalibration(id: number, point: CalibrationPoint) {
    const p = await db.profiles.get(id);
    if (!p) return;
    await db.profiles.update(id, { calibrations: [...(p.calibrations ?? []), point] });
  },
  clearCalibrations: (id: number) => db.profiles.update(id, { calibrations: [] }),
  /** Deletes a profile and everything recorded for it. */
  async remove(id: number) {
    await db.transaction('rw', [db.profiles, db.scanResults, db.questionnaireResponses], async () => {
      await db.scanResults.where('profileId').equals(id).delete();
      await db.questionnaireResponses.where('profileId').equals(id).delete();
      await db.profiles.delete(id);
    });
  },
};

/** Converts a profile to the fields the SeverityClassifier needs. */
export function toSubject(p: Profile): ClassificationSubject {
  return {
    ageYears: p.ageYears + (p.ageMonths ?? 0) / 12,
    sex: p.sex,
    pregnant: p.sex === 'female' && p.pregnant,
    altitudeM: p.altitudeM ?? 0,
  };
}

/** Scan result persistence. */
export const scanRepo = {
  async save(
    profileId: number,
    outcome: ScanOutcome,
    extra: Pick<ScanResultRecord, 'features' | 'subject'> = {},
  ): Promise<number> {
    const q = outcome.regions.length
      ? outcome.regions.reduce((s, r) => s + r.qualityScore, 0) / outcome.regions.length
      : 0;
    const record: ScanResultRecord = {
      profileId,
      timestamp: Date.now(),
      hb: outcome.hb,
      hbLow: outcome.hbLow,
      hbHigh: outcome.hbHigh,
      severityRange: outcome.severityRange,
      upperNormal: outcome.upperNormal,
      aboveNormal: outcome.aboveNormal,
      hbAdjusted: outcome.hbAdjusted,
      hbUncalibrated: outcome.hbUncalibrated,
      personalCalibration: outcome.personalCalibration,
      altitudeAdjustment: outcome.altitudeAdjustment,
      skinTone: outcome.skinTone,
      allRegionsAffected: outcome.allRegionsAffected,
      severity: outcome.severity,
      anemia: outcome.anemia,
      reliability: outcome.reliability,
      usedFallback: outcome.usedFallback,
      regions: outcome.regions,
      qualityScore: q,
      qualityStatus: outcome.regions.some((r) => r.qualityStatus === 'borderline') ? 'borderline' : 'pass',
      thresholdGroup: outcome.thresholdGroup,
      normalThreshold: outcome.normalThreshold,
      modelSource: outcome.modelSource,
      modelVersion: outcome.modelVersion,
      isDemo: outcome.isDemo,
      durationMs: outcome.durationMs,
      deviceCorrection: outcome.deviceCorrection,
      ...extra,
    };
    return db.scanResults.add(record);
  },
  get: (id: number) => db.scanResults.get(id),
  /** Saves (or replaces) the blood test for a scan, and the matching personal calibration point. */
  async setBloodTest(scanId: number, labHb: number, labDate: number) {
    await db.transaction('rw', [db.scanResults, db.profiles], async () => {
      const r = await db.scanResults.get(scanId);
      if (!r) return;
      await db.scanResults.update(scanId, { bloodTest: { labHb, labDate, enteredAt: Date.now() } });
      const p = await db.profiles.get(r.profileId);
      if (!p) return;
      const point: CalibrationPoint = { labHb, labDate, estimateHb: r.hbUncalibrated ?? r.hb, scanId, createdAt: Date.now() };
      const others = (p.calibrations ?? []).filter((c) => c.scanId !== scanId);
      await db.profiles.update(r.profileId, { calibrations: [...others, point] });
    });
  },
  async removeBloodTest(scanId: number) {
    await db.transaction('rw', [db.scanResults, db.profiles], async () => {
      const r = await db.scanResults.get(scanId);
      if (!r) return;
      await db.scanResults.update(scanId, { bloodTest: undefined });
      const p = await db.profiles.get(r.profileId);
      if (p) await db.profiles.update(r.profileId, { calibrations: (p.calibrations ?? []).filter((c) => c.scanId !== scanId) });
    });
  },
  /** Every scan on this device that has a blood test (all profiles) — the device-learning data. */
  withBloodTests: () => db.scanResults.filter((r) => !!r.bloodTest).toArray(),
  /** Newest first. */
  listForProfile: (profileId: number) =>
    db.scanResults.where('profileId').equals(profileId).reverse().sortBy('timestamp'),
  remove: (id: number) =>
    db.transaction('rw', [db.scanResults, db.questionnaireResponses], async () => {
      await db.questionnaireResponses.where('scanId').equals(id).delete();
      await db.scanResults.delete(id);
    }),
};

/** Converts a stored record back into an outcome for display. */
export function recordToOutcome(r: ScanResultRecord): ScanOutcome {
  return {
    hb: r.hb,
    hbLow: r.hbLow,
    hbHigh: r.hbHigh,
    severityRange: r.severityRange,
    upperNormal: r.upperNormal,
    aboveNormal: r.aboveNormal,
    hbAdjusted: r.hbAdjusted,
    hbUncalibrated: r.hbUncalibrated,
    personalCalibration: r.personalCalibration,
    altitudeAdjustment: r.altitudeAdjustment,
    skinTone: r.skinTone,
    allRegionsAffected: r.allRegionsAffected,
    severity: r.severity,
    anemia: r.anemia,
    reliability: r.reliability,
    usedFallback: r.usedFallback,
    regions: r.regions,
    thresholdGroup: r.thresholdGroup,
    normalThreshold: r.normalThreshold,
    isDemo: r.isDemo,
    modelSource: r.modelSource,
    modelVersion: r.modelVersion,
    durationMs: r.durationMs,
    deviceCorrection: r.deviceCorrection,
  };
}

export const questionnaireRepo = {
  save: (r: Omit<QuestionnaireResponse, 'id'>) => db.questionnaireResponses.add(r),
  forScan: (scanId: number) => db.questionnaireResponses.where('scanId').equals(scanId).last(),
};

export const contributionRepo = {
  add: (r: Omit<ContributionRecord, 'id'>) => db.contributions.add(r),
  pending: () => db.contributions.filter((c) => !c.uploaded).toArray(),
  markUploaded: (ids: number[]) =>
    db.contributions.bulkUpdate(ids.map((key) => ({ key, changes: { uploaded: true } }))),
};

/** Deletes every record on this device (Settings → Delete all data). */
export async function deleteAllData() {
  await db.transaction(
    'rw',
    [db.profiles, db.scanResults, db.questionnaireResponses, db.contributions],
    async () => {
      await Promise.all([
        db.profiles.clear(),
        db.scanResults.clear(),
        db.questionnaireResponses.clear(),
        db.contributions.clear(),
      ]);
    },
  );
}
