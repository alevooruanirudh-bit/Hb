import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, ImageUp, Lightbulb, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RegionIllustration } from '@/components/illustrations/RegionIllustration';
import { useScanSession } from '@/store/scanStore';
import { pickImage, useCaptureFlow } from '@/features/scan/useCaptureFlow';

/**
 * Friendly explanation of why an image was rejected (blurry, too dark…) with
 * Retake / Re-upload. We never try to "fix" a heavily blurred image.
 */
export function RetakePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const retake = useScanSession((s) => s.retake);
  const { submit, busy } = useCaptureFlow();

  // Make sure the session points at the region being retaken.
  useEffect(() => {
    if (!retake) return;
    const s = useScanSession.getState();
    const idx = s.queue.indexOf(retake.region);
    if (idx >= 0 && idx !== s.index) useScanSession.setState({ index: idx });
  }, [retake]);

  if (!retake) return <Navigate to="/scan" replace />;

  const reasons = retake.noRegion
    ? ['noRegion']
    : (retake.quality?.reasons ?? []).filter((r) => r !== 'slightlyBlurry');
  const primary = reasons[0] ?? 'blurry';

  const reupload = async () => {
    const blob = await pickImage();
    if (blob) await submit(retake.region, blob, 'upload');
  };

  return (
    <div className="mx-auto max-w-xl">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center text-center"
      >
        <div className="relative">
          <RegionIllustration kind={retake.region} size={120} />
          <span className="absolute -bottom-1 -right-1 flex h-12 w-12 items-center justify-center rounded-full bg-severity-mild text-black shadow-soft">
            <RefreshCcw size={24} aria-hidden />
          </span>
        </div>
        <h1 className="mt-6">{t(`retake.titles.${primary}`)}</h1>
        <p className="mt-2 text-lg text-ink-muted">{t(`retake.messages.${primary}`)}</p>
      </motion.div>

      {reasons.length > 1 && (
        <ul className="mt-5 space-y-2">
          {reasons.slice(1).map((r) => (
            <li key={r} className="rounded-2xl bg-surface-muted px-4 py-3">
              {t(`retake.messages.${r}`)}
            </li>
          ))}
        </ul>
      )}

      <Card tone="secondary" className="mt-6">
        <h2 className="flex items-center gap-2 text-h3 text-secondary">
          <Lightbulb aria-hidden /> {t('retake.tipsTitle')}
        </h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-6">
          <li>{t('retake.tip1')}</li>
          <li>{t('retake.tip2')}</li>
          <li>{t(`regions.${retake.region}.instruction`)}</li>
        </ul>
      </Card>

      <div className="mt-6 flex flex-col gap-3">
        {retake.source !== 'upload' && (
          <Button
            fullWidth
            icon={Camera}
            onClick={() => navigate('/scan/capture', { replace: true })}
            disabled={busy}
          >
            {t('retake.retake')}
          </Button>
        )}
        <Button
          fullWidth
          variant={retake.source === 'upload' ? 'primary' : 'outline'}
          icon={ImageUp}
          onClick={reupload}
          disabled={busy}
        >
          {t('retake.reupload')}
        </Button>
        {retake.source === 'upload' && (
          <Button
            fullWidth
            variant="outline"
            icon={Camera}
            onClick={() => navigate('/scan/capture', { replace: true })}
          >
            {t('retake.useCamera')}
          </Button>
        )}
      </div>
    </div>
  );
}
