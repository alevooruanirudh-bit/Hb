import { db } from '@/db/db';
import { appConfig } from '@/config/appConfig';
import { COLOR_FEATURE_NAMES } from '@/imageProcessing/colorFeatures';
import { isLearningScan } from './learningData';

const DAY = 86_400_000;

/**
 * Anonymous learning data: for every scan with a blood test, the colour measurements of each
 * scanned area + the real hemoglobin + age/sex/state. No names, no photos, no profile ids
 * (people are numbered p1, p2… for this file only). Read by training/merge_app_exports.py.
 */
export async function buildLearningExport() {
  const scans = (await db.scanResults.toArray()).filter((r) => isLearningScan(r) && r.features?.length);
  const people = new Map<number, string>();
  const person = (id: number) => {
    if (!people.has(id)) people.set(id, `p${people.size + 1}`);
    return people.get(id)!;
  };
  const samples = scans.flatMap((r) =>
    r.features!.map((f) => {
      const est = r.regions.find((e) => e.region === f.region);
      return {
        person: person(r.profileId),
        scanDate: new Date(r.timestamp).toISOString().slice(0, 10),
        daysBetweenScanAndTest: Math.round(Math.abs(r.timestamp - r.bloodTest!.labDate) / DAY),
        labHb: r.bloodTest!.labHb,
        region: f.region,
        regionEstimate: est && Number.isFinite(est.hb) ? Math.round(est.hb * 100) / 100 : null,
        estimate: r.hbUncalibrated ?? r.hb,
        anemiaProbability: est?.anemiaProbability ?? null,
        quality: est?.qualityScore ?? null,
        ageYears: r.subject ? Math.round(r.subject.ageYears * 10) / 10 : null,
        sex: r.subject?.sex ?? null,
        pregnant: r.subject?.pregnant ?? null,
        state: r.subject?.state ?? null,
        altitudeM: r.subject?.altitudeM ?? null,
        skinTone: r.skinTone?.category ?? null,
        modelVersion: r.modelVersion,
        colorFeatures: f.colorFeatures,
      };
    }),
  );
  return {
    format: 'hemoscan-learning-v1',
    exportedAt: new Date().toISOString(),
    appVersion: appConfig.appVersion,
    device: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    colorFeatureNames: COLOR_FEATURE_NAMES,
    people: people.size,
    samples,
  };
}

export async function learningExportBlob(): Promise<{ blob: Blob; count: number }> {
  const data = await buildLearningExport();
  return { blob: new Blob([JSON.stringify(data)], { type: 'application/json' }), count: data.samples.length };
}
