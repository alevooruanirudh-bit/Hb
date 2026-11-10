import { scanRepo } from '@/db/repositories';
import type { ScanResultRecord } from '@/db/db';
import { fitDeviceModel, type DeviceModel, type LearningPair } from '@/ml/deviceLearning';

/** Scans that can teach the app: real (trained) model, not a demo, with a blood test. */
export const isLearningScan = (r: ScanResultRecord) => !!r.bloodTest && r.modelSource === 'real' && !r.isDemo;

export function toPair(r: ScanResultRecord): LearningPair {
  return {
    estimate: r.hbUncalibrated ?? r.hb,
    labHb: r.bloodTest!.labHb,
    labDate: r.bloodTest!.labDate,
    personId: r.profileId,
    scanTime: r.timestamp,
  };
}

/** Fits the device-learning correction from every blood test entered on this device. */
export async function loadDeviceModel(): Promise<DeviceModel> {
  const scans = (await scanRepo.withBloodTests()).filter(isLearningScan);
  return fitDeviceModel(scans.map(toPair));
}
