import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Check, Loader2 } from 'lucide-react';
import type { SkinTone, SkinToneCategory } from '@/ml/types';
import { SKIN_TONE_SWATCHES, itaCategory, measureIta } from '@/imageProcessing/skinTone';
import { decodeImage } from '@/utils/image';
import { cn } from '@/utils/cn';

const CATEGORIES: SkinToneCategory[] = ['veryLight', 'light', 'intermediate', 'tan', 'brown', 'dark'];

function takePhoto(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment');
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}

/**
 * Skin tone: measured from a photo of the inner forearm / back of the hand
 * (ITA°, a standard dermatology measure) or picked from swatches. Used only to
 * decide how much the palm reading can be trusted. The photo is analysed on
 * the device and immediately discarded.
 */
export function SkinTonePicker({ value, onChange }: { value?: SkinTone; onChange: (v: SkinTone | undefined) => void }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const measure = async () => {
    const file = await takePhoto();
    if (!file) return;
    setBusy(true);
    setError(false);
    try {
      const { pixels } = await decodeImage(file, 480);
      // Centre 60 % of the photo, where the arm / hand should be.
      const box = { x: pixels.width * 0.2, y: pixels.height * 0.2, width: pixels.width * 0.6, height: pixels.height * 0.6 };
      const ita = measureIta(pixels, box);
      if (ita === null) setError(true);
      else onChange({ ita: Math.round(ita * 10) / 10, category: itaCategory(ita), source: 'photo' });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={measure}
        disabled={busy}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary/60 px-4 font-semibold text-primary hover:bg-primary/5 disabled:opacity-50"
      >
        {busy ? <Loader2 className="animate-spin" size={22} aria-hidden /> : <Camera size={22} aria-hidden />}
        {t('profile.skinToneMeasure')}
      </button>
      <p className="mt-1.5 text-sm text-ink-muted">{t('profile.skinTonePhotoHint')}</p>
      {error && (
        <p role="alert" className="mt-1 text-sm font-semibold text-severity-severe">
          {t('profile.skinToneError')}
        </p>
      )}

      <p className="mb-2 mt-4 text-sm font-semibold">{t('profile.skinTonePick')}</p>
      <div role="radiogroup" aria-label={t('profile.skinTone')} className="grid grid-cols-6 gap-2">
        {CATEGORIES.map((c) => {
          const on = value?.category === c;
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={t(`skinTone.${c}`)}
              title={t(`skinTone.${c}`)}
              onClick={() => onChange(on ? undefined : { category: c, source: 'selfReported' })}
              className={cn('flex aspect-square items-center justify-center rounded-full ring-offset-2 ring-offset-surface transition', on ? 'ring-4 ring-primary' : 'ring-1 ring-line')}
              style={{ background: SKIN_TONE_SWATCHES[c] }}
            >
              {on && <Check className="text-white drop-shadow" size={20} strokeWidth={3} aria-hidden />}
            </button>
          );
        })}
      </div>
      {value && (
        <p className="mt-2 text-sm text-ink-muted" aria-live="polite">
          {t(`skinTone.${value.category}`)}
          {value.source === 'photo' && value.ita !== undefined && ` · ITA ${value.ita}°`}
          {' · '}
          {t(`profile.skinToneSource.${value.source}`)}
        </p>
      )}
      {!value && <p className="mt-2 text-sm text-ink-muted">{t('profile.skinToneSkip')}</p>}
    </div>
  );
}
