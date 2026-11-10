import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Camera as CameraIcon,
  FlashlightOff,
  Flashlight,
  ImageUp,
  Loader2,
  SwitchCamera,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useCamera } from '@/features/camera/useCamera';
import { useLiveQuality } from '@/features/camera/useLiveQuality';
import { useVoice } from '@/features/voice/useVoice';
import { pickImage, useCaptureFlow } from '@/features/scan/useCaptureFlow';
import { useScanSession } from '@/store/scanStore';
import { useSettings } from '@/store/settingsStore';
import { StatusPill } from '@/components/ui/StatusPill';
import { StepProgress } from '@/components/ui/StepProgress';
import { Button } from '@/components/ui/Button';
import { guideBoxes } from '@/config/guideConfig';
import type { Region } from '@/ml/types';
import { cn } from '@/utils/cn';

/** Semi-transparent guide overlay shaped for the region (eye / nails / palm). */
function GuideOverlay({ region, ok }: { region: Region; ok: boolean }) {
  const g = guideBoxes[region];
  const x = g.x * 100;
  const y = g.y * 100;
  const w = g.width * 100;
  const h = g.height * 100;
  const stroke = ok ? 'stroke-severity-normal' : 'stroke-white';
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <mask id="guide-cut">
          <rect width="100" height="100" fill="white" />
          {region === 'eye' && <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} fill="black" />}
          {region === 'nails' && <rect x={x} y={y} width={w} height={h} rx="6" fill="black" />}
          {region === 'palm' && <rect x={x} y={y} width={w} height={h} rx="10" fill="black" />}
        </mask>
      </defs>
      <rect width="100" height="100" fill="black" opacity="0.45" mask="url(#guide-cut)" />
      {region === 'eye' && (
        <>
          <ellipse
            cx={x + w / 2}
            cy={y + h / 2}
            rx={w / 2}
            ry={h / 2}
            className={cn('fill-none transition-colors', stroke)}
            strokeWidth="0.6"
            vectorEffect="non-scaling-stroke"
            style={{ strokeWidth: 3 }}
          />
          <path
            d={`M ${x + w * 0.2} ${y + h * 0.72} Q ${x + w / 2} ${y + h * 0.95} ${x + w * 0.8} ${y + h * 0.72}`}
            className="fill-none stroke-primary-light"
            style={{ strokeWidth: 3, strokeDasharray: '6 5' }}
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
      {region === 'nails' && (
        <>
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            rx="6"
            className={cn('fill-none transition-colors', stroke)}
            style={{ strokeWidth: 3 }}
            vectorEffect="non-scaling-stroke"
          />
          {[0.2, 0.4, 0.6, 0.8].map((f) => (
            <rect
              key={f}
              x={x + w * f - w * 0.06}
              y={y + h * 0.1}
              width={w * 0.12}
              height={h * 0.3}
              rx="3"
              className="fill-none stroke-primary-light"
              style={{ strokeWidth: 2, strokeDasharray: '5 4' }}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </>
      )}
      {region === 'palm' && (
        <>
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            rx="10"
            className={cn('fill-none transition-colors', stroke)}
            style={{ strokeWidth: 3 }}
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={x + w / 2}
            cy={y + h * 0.55}
            r={Math.min(w, h) * 0.18}
            className="fill-none stroke-primary-light"
            style={{ strokeWidth: 2, strokeDasharray: '5 4' }}
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
    </svg>
  );
}

/**
 * Live capture: full-screen preview, guide overlay, torch, live
 * Focus / Lighting / Position pills, voice instruction. The capture button is
 * enabled only when all three checks pass.
 */
export default function CapturePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { queue, index } = useScanSession();
  const region = queue[index];
  const cam = useCamera();
  const live = useLiveQuality(cam.videoRef, region ?? 'eye', cam.ready);
  const voice = useVoice();
  const setSettings = useSettings((s) => s.set);
  const { submit, busy } = useCaptureFlow();
  const [capturing, setCapturing] = useState(false);
  const lastHint = useRef<string | null>(null);

  // Speak the instruction when the region changes.
  useEffect(() => {
    if (region && cam.ready) void voice.speakKey(`regions.${region}.instruction`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, cam.ready]);

  // Speak short corrective hints (not more than once per change).
  useEffect(() => {
    if (live.hint && live.hint !== lastHint.current) {
      lastHint.current = live.hint;
      void voice.speakKey(`capture.hints.${live.hint}`);
    }
    if (!live.hint) lastHint.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live.hint]);

  if (!region) return <Navigate to="/scan" replace />;

  const doCapture = async () => {
    setCapturing(true);
    const blob = await cam.capture();
    setCapturing(false);
    if (blob) {
      cam.stop();
      await submit(region, blob, 'camera');
    }
  };

  const upload = async () => {
    const blob = await pickImage();
    if (blob) {
      cam.stop();
      await submit(region, blob, 'upload');
    }
  };

  const errorKey = cam.error ? `capture.errors.${cam.error}` : null;

  return (
    <div className="fixed inset-0 flex flex-col bg-black text-white">
      {/* Preview */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={cam.videoRef}
          playsInline
          muted
          className={cn(
            'absolute inset-0 h-full w-full object-cover',
            cam.facing === 'user' && '-scale-x-100',
          )}
          aria-label={t('capture.previewAria')}
        />
        {cam.ready && <GuideOverlay region={region} ok={live.allOk} />}

        {/* Top bar */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent p-4 safe-top">
          <button
            type="button"
            onClick={() => navigate('/scan/method')}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40"
            aria-label={t('common.close')}
          >
            <X size={26} aria-hidden />
          </button>
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-lg font-semibold">{t(`regions.${region}.name`)}</span>
            {queue.length > 1 && (
              <StepProgress current={index + 1} total={queue.length} className="[&_span]:text-white" />
            )}
          </div>
          <button
            type="button"
            onClick={() => setSettings({ voiceEnabled: !voice.enabled })}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40"
            aria-label={voice.enabled ? t('capture.voiceOff') : t('capture.voiceOn')}
            aria-pressed={voice.enabled}
          >
            {voice.enabled ? <Volume2 size={24} aria-hidden /> : <VolumeX size={24} aria-hidden />}
          </button>
        </div>

        {/* Quality pills */}
        {cam.ready && (
          <div className="absolute inset-x-0 top-28 flex justify-center gap-2 px-4" aria-live="polite">
            <StatusPill label={t('capture.focus')} state={live.focus} />
            <StatusPill label={t('capture.lighting')} state={live.lighting} />
            <StatusPill label={t('capture.position')} state={live.position} />
          </div>
        )}

        {/* Camera error */}
        {errorKey && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/85 p-8 text-center"
            role="alert"
          >
            <CameraIcon size={48} aria-hidden />
            <p className="max-w-sm text-lg">{t(errorKey)}</p>
            <Button icon={ImageUp} onClick={upload}>
              {t('capture.useUpload')}
            </Button>
          </div>
        )}
        {!cam.ready && !cam.error && (
          <div className="absolute inset-0 flex items-center justify-center" role="status">
            <Loader2 className="animate-spin" size={40} aria-label={t('common.loading')} />
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="space-y-4 bg-black px-5 pb-6 pt-4 safe-bottom">
        <p className="mx-auto max-w-md text-center text-lg" aria-live="polite">
          {live.hint ? t(`capture.hints.${live.hint}`) : t(`regions.${region}.instruction`)}
        </p>
        {!voice.voiceAvailable && voice.enabled && (
          <p className="text-center text-sm text-white/60">{t('capture.noVoice')}</p>
        )}
        <div className="mx-auto flex max-w-md items-center justify-between">
          <button
            type="button"
            onClick={() => cam.setTorch(!cam.torchOn)}
            disabled={!cam.torchSupported}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 disabled:opacity-30"
            aria-label={cam.torchSupported ? t('capture.torch') : t('capture.torchUnsupported')}
            aria-pressed={cam.torchOn}
          >
            {cam.torchOn ? <Flashlight size={26} aria-hidden /> : <FlashlightOff size={26} aria-hidden />}
          </button>
          <button
            type="button"
            onClick={doCapture}
            disabled={!live.allOk || busy || capturing}
            className={cn(
              'flex h-20 w-20 items-center justify-center rounded-full border-4 transition',
              live.allOk
                ? 'border-white bg-primary shadow-[0_0_0_6px_rgba(255,255,255,0.25)]'
                : 'border-white/40 bg-white/10',
            )}
            aria-label={live.allOk ? t('capture.capture') : t('capture.waitForChecks')}
          >
            {busy || capturing ? (
              <Loader2 className="animate-spin" size={32} aria-hidden />
            ) : (
              <CameraIcon size={32} aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={cam.switchCamera}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15"
            aria-label={t('capture.switchCamera')}
          >
            <SwitchCamera size={26} aria-hidden />
          </button>
        </div>
        <button
          type="button"
          onClick={upload}
          className="mx-auto flex min-h-touch items-center gap-2 text-white/80 underline-offset-4 hover:underline"
        >
          <ImageUp size={20} aria-hidden /> {t('capture.useUpload')}
        </button>
      </div>
    </div>
  );
}
