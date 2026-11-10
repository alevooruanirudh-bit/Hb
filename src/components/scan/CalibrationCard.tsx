import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Droplet, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Profile, ScanResultRecord } from '@/db/db';
import { scanRepo } from '@/db/repositories';
import type { ScanOutcome } from '@/ml/types';
import { isValidCalibration } from '@/ml/personalCalibration';
import { formatDate } from '@/utils/profileText';

const toDateInput = (t: number) => new Date(t - new Date(t).getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

type BloodTest = NonNullable<ScanResultRecord['bloodTest']>;

/**
 * Optional: "Got your blood test result?" — the user types the lab hemoglobin, right after the
 * scan or any time later from History. The pair (this scan's photo measurements + the real value):
 *  - corrects FUTURE scans of this person (personal calibration),
 *  - teaches the app this phone's camera/lighting bias for everyone scanned on it (device learning),
 *  - can be exported (Settings) to retrain the main model.
 * This result itself is not changed — it stays an honest record of the photo estimate.
 */
export function CalibrationCard({
  outcome,
  profile,
  scanTime,
  ensureSaved,
  bloodTest: initial,
}: {
  outcome: ScanOutcome;
  profile: Profile;
  scanTime: number;
  /** Saves the scan if needed and returns its id. */
  ensureSaved: () => Promise<number | null>;
  /** Blood test already stored for this scan (History). */
  bloodTest?: BloodTest;
}) {
  const { t, i18n } = useTranslation();
  const [saved, setSaved] = useState<BloodTest | undefined>(initial);
  const [editing, setEditing] = useState(false);
  const [hb, setHb] = useState(initial ? String(initial.labHb) : '');
  const [date, setDate] = useState(toDateInput(initial?.labDate ?? scanTime));
  const [error, setError] = useState<string | null>(null);

  // The pair must use the photo estimate BEFORE any correction.
  const estimate = outcome.hbUncalibrated ?? outcome.hb;

  const submit = async () => {
    const labHb = Number(hb.replace(',', '.'));
    const labDate = new Date(date + 'T12:00:00').getTime();
    const v = isValidCalibration(labHb, labDate, scanTime);
    if (v !== 'ok') return setError(t(`calibration.errors.${v}`));
    const scanId = await ensureSaved();
    if (scanId === null) return;
    await scanRepo.setBloodTest(scanId, labHb, labDate);
    setSaved({ labHb, labDate, enteredAt: Date.now() });
    setEditing(false);
    setError(null);
  };

  const remove = async () => {
    if (!window.confirm(t('calibration.removeConfirm'))) return;
    const scanId = await ensureSaved();
    if (scanId !== null) await scanRepo.removeBloodTest(scanId);
    setSaved(undefined);
    setHb('');
  };

  if (outcome.isDemo || outcome.modelSource !== 'real' || !profile.id) return null;

  return (
    <Card>
      <h2 className="flex items-center gap-2 text-h3">
        <Droplet className="text-primary" size={22} aria-hidden />
        {t('calibration.title')}
      </h2>
      {saved && !editing ? (
        <>
          <p className="mt-3 flex gap-2 rounded-2xl bg-severity-normal/10 p-3 font-semibold" role="status">
            <CheckCircle2 className="mt-0.5 shrink-0 text-severity-normal" size={20} aria-hidden />
            <span>
              {t('calibration.stored', {
                lab: saved.labHb.toFixed(1),
                date: formatDate(saved.labDate, i18n.language),
                est: estimate.toFixed(1),
                diff: (saved.labHb - estimate >= 0 ? '+' : '') + (saved.labHb - estimate).toFixed(1),
              })}
              <span className="mt-1 block text-sm font-normal text-ink-muted">{t('calibration.storedHelp')}</span>
            </span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="md" variant="outline" icon={Pencil} onClick={() => setEditing(true)}>
              {t('calibration.edit')}
            </Button>
            <Button size="md" variant="ghost" icon={Trash2} onClick={remove}>
              {t('calibration.remove')}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-ink-muted">{t('calibration.intro')}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">{t('calibration.labHb')}</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min={3}
                max={22}
                value={hb}
                onChange={(e) => setHb(e.target.value)}
                placeholder="14.5"
                className="w-full min-h-touch rounded-xl border-2 border-line bg-surface px-3 text-lg focus:border-primary focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">{t('calibration.labDate')}</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-h-touch rounded-xl border-2 border-line bg-surface px-3 text-lg focus:border-primary focus:outline-none"
              />
            </label>
            <Button size="md" onClick={submit} disabled={!hb}>
              {t('calibration.submit')}
            </Button>
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-severity-severe">
          {error}
        </p>
      )}
    </Card>
  );
}
