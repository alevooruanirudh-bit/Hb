import { contributionRepo, profileRepo, questionnaireRepo, scanRepo } from '@/db/repositories';
import { useScanSession } from '@/store/scanStore';
import { useSettings } from '@/store/settingsStore';
import { toJpegBlob } from '@/utils/image';

/**
 * Persists the current session's result (once), its questionnaire answers and
 * — ONLY if the user opted into data contribution — the anonymized ROI crops
 * and features. Full photos are never stored.
 */
export async function saveCurrentScan(profileId: number): Promise<number | null> {
  const s = useScanSession.getState();
  if (!s.outcome) return null;
  let id = s.savedScanId;
  if (id === null) {
    const p = await profileRepo.get(profileId);
    id = await scanRepo.save(profileId, s.outcome, {
      // Numbers only (no image): lets a blood test entered later teach the app.
      features: s.samples.map((x) => ({ region: x.region, colorFeatures: Array.from(x.colorFeatures) })),
      subject: p && {
        ageYears: p.ageYears + (p.ageMonths ?? 0) / 12,
        sex: p.sex,
        pregnant: p.pregnant,
        state: p.state,
        altitudeM: p.altitudeM,
      },
    });
    useScanSession.getState().setSavedScanId(id);

    if (useSettings.getState().dataContribution && !s.outcome.isDemo) {
      for (const sample of s.samples) {
        await contributionRepo.add({
          scanId: id,
          region: sample.region,
          image: await toJpegBlob(sample.roi),
          features: sample.colorFeatures,
          hbEstimate: sample.hb,
          createdAt: Date.now(),
          uploaded: false,
        });
      }
    }
  }
  if (Object.keys(s.answers).length) {
    const existing = await questionnaireRepo.forScan(id);
    if (!existing)
      await questionnaireRepo.save({ scanId: id, profileId, timestamp: Date.now(), answers: s.answers });
  }
  return id;
}
