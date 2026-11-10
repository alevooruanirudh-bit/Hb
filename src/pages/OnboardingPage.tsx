import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { OnboardingIllustration } from '@/components/illustrations/OnboardingIllustration';
import { useSettings } from '@/store/settingsStore';
import { cn } from '@/utils/cn';

const STEPS = 3;

/** Three swipeable / clickable onboarding steps. */
export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const set = useSettings((s) => s.set);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const go = (next: number) => {
    if (next < 0) return;
    if (next >= STEPS) {
      set({ onboardingDone: true });
      navigate('/consent');
      return;
    }
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60) go(step + 1);
    else if (info.offset.x > 60) go(step - 1);
  };

  return (
    <div
      className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 py-8"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(step + 1);
        if (e.key === 'ArrowLeft') go(step - 1);
      }}
    >
      <div className="flex justify-end">
        <Button variant="ghost" size="md" onClick={() => go(STEPS)}>
          {t('common.skip')}
        </Button>
      </div>

      <div className="relative flex flex-1 items-center overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.section
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -60 }}
            transition={{ duration: 0.28 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={onDragEnd}
            className="flex w-full cursor-grab flex-col items-center text-center active:cursor-grabbing"
            aria-roledescription="slide"
            aria-label={t('common.stepOf', { current: step + 1, total: STEPS })}
          >
            <OnboardingIllustration step={step} />
            <h1 className="mt-8">{t(`onboarding.step${step + 1}Title`)}</h1>
            <p className="mt-3 text-lg text-ink-muted">{t(`onboarding.step${step + 1}Body`)}</p>
          </motion.section>
        </AnimatePresence>
      </div>

      <div className="mb-6 flex justify-center gap-2" aria-hidden>
        {Array.from({ length: STEPS }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-2.5 rounded-pill transition-all',
              i === step ? 'w-8 bg-primary' : 'w-2.5 bg-line',
            )}
          />
        ))}
      </div>

      <div className="flex gap-3">
        {step > 0 && (
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => go(step - 1)}
            aria-label={t('common.back')}
          >
            {t('common.back')}
          </Button>
        )}
        <Button
          fullWidth
          icon={step === STEPS - 1 ? Check : undefined}
          iconRight={step < STEPS - 1 ? ArrowRight : undefined}
          onClick={() => go(step + 1)}
        >
          {step === STEPS - 1 ? t('onboarding.getStarted') : t('common.next')}
        </Button>
      </div>
    </div>
  );
}
