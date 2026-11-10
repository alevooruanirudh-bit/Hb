import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { PulsingDroplet } from '@/components/ui/PulsingDroplet';
import { Button } from '@/components/ui/Button';
import { PIPELINE_STEPS, runScanPipeline, type StepEvent } from '@/features/scan/runPipeline';
import { resolveUseMock } from '@/features/scan/useCaptureFlow';
import { useScanSession } from '@/store/scanStore';
import { useProfiles } from '@/store/useActiveProfile';
import { toSubject } from '@/db/repositories';
import { personalOffset } from '@/ml/personalCalibration';
import { loadDeviceModel } from '@/features/learning/learningData';
import { cn } from '@/utils/cn';

/**
 * Runs the on-device pipeline with visible steps:
 * Checking image quality → Adjusting lighting → Finding region → Analyzing color → Estimating hemoglobin.
 */
export function ProcessingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { active } = useProfiles();
  const { queue, captures } = useScanSession();
  const [event, setEvent] = useState<StepEvent | null>(null);
  const [error, setError] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current || !queue.length) return;
    started.current = true;
    const s = useScanSession.getState();
    loadDeviceModel()
      .catch(() => null)
      .then((deviceModel) =>
        runScanPipeline({
          captures: s.captures,
          order: s.queue,
          subject: toSubject(active),
          isDemo: s.isDemo,
          useMock: resolveUseMock(),
          conditions: s.conditions,
          profileSkinTone: active.skinTone,
          personalOffset: personalOffset(active.calibrations),
          deviceModel,
          onStep: setEvent,
        }),
      )
      .then((r) => {
        if (r.kind === 'retake') {
          const cap = s.captures[r.retake.region];
          s.setRetake({ ...r.retake, source: cap?.source ?? 'camera' });
          navigate('/scan/retake', { replace: true });
        } else {
          s.setOutcome(r.outcome, r.samples);
          navigate('/scan/results', { replace: true });
        }
      })
      .catch((e) => {
        console.error(e);
        setError(true);
      });
  }, [active, queue.length, navigate]);

  if (!queue.length || Object.keys(captures).length === 0) return <Navigate to="/scan" replace />;

  const current = event ? PIPELINE_STEPS.indexOf(event.step) : -1;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-primary-light/70 to-background px-6 py-10">
      <PulsingDroplet size={96} />
      <h1 className="mt-6 text-center">{t('processing.title')}</h1>
      {event && event.regionCount > 1 && (
        <p className="mt-1 text-ink-muted">
          {t(`regions.${event.region}.name`)} ·{' '}
          {t('common.stepOf', { current: event.regionIndex + 1, total: event.regionCount })}
        </p>
      )}

      <ol className="mt-8 w-full max-w-sm space-y-3" aria-live="polite">
        {PIPELINE_STEPS.map((step, i) => {
          const done = i < current;
          const doing = i === current;
          return (
            <motion.li
              key={step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3 transition',
                doing ? 'bg-surface shadow-soft' : 'bg-transparent',
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  done
                    ? 'bg-severity-normal text-white'
                    : doing
                      ? 'bg-primary text-primary-on'
                      : 'bg-line text-ink-muted',
                )}
                aria-hidden
              >
                {done ? <Check size={20} /> : doing ? <Loader2 size={20} className="animate-spin" /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-lg',
                  doing ? 'font-semibold text-ink' : done ? 'text-ink' : 'text-ink-muted',
                )}
              >
                {t(`processing.steps.${step}`)}
              </span>
            </motion.li>
          );
        })}
      </ol>

      {error && (
        <div className="mt-8 flex max-w-sm flex-col items-center gap-3 text-center" role="alert">
          <AlertTriangle className="text-severity-severe" size={32} aria-hidden />
          <p>{t('processing.error')}</p>
          <Button onClick={() => navigate('/scan', { replace: true })}>{t('common.retry')}</Button>
        </div>
      )}
    </div>
  );
}
