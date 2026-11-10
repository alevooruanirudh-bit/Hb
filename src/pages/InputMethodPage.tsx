import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, ImageUp, Loader2, PlayCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StepProgress } from '@/components/ui/StepProgress';
import { RegionIllustration } from '@/components/illustrations/RegionIllustration';
import { useScanSession } from '@/store/scanStore';
import { useSettings } from '@/store/settingsStore';
import { pickImage, useCaptureFlow } from '@/features/scan/useCaptureFlow';
import { DEMO_SETS, loadDemoImage } from '@/features/demo/demoSamples';
import { ConditionChecklist } from '@/components/scan/ConditionChecklist';

function OptionCard({
  icon: Icon,
  title,
  sub,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  title: string;
  sub: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-[96px] w-full items-center gap-4 rounded-card bg-surface p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-50"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary">
        <Icon size={28} aria-hidden />
      </span>
      <span>
        <span className="block text-h3">{title}</span>
        <span className="block text-ink-muted">{sub}</span>
      </span>
    </button>
  );
}

/** For the current region: Use Camera, Upload Image, or (demo mode) a bundled sample. */
export function InputMethodPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { queue, index } = useScanSession();
  const demoMode = useSettings((s) => s.demoMode);
  const { submit, busy, error } = useCaptureFlow();
  const region = queue[index];

  if (!region) return <Navigate to="/scan" replace />;

  const upload = async () => {
    const blob = await pickImage();
    if (blob) await submit(region, blob, 'upload');
  };

  const pickSample = async (setId: string) => {
    const s = DEMO_SETS.find((d) => d.id === setId)!;
    useScanSession.setState({ isDemo: true });
    await submit(region, await loadDemoImage(s.images[region]), 'demo', s.id);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t('inputMethod.title', { region: t(`regions.${region}.name`) })}
        subtitle={t('inputMethod.subtitle')}
        back="/scan"
      />
      {queue.length > 1 && <StepProgress current={index + 1} total={queue.length} className="mb-5" />}

      <div className="mb-5 flex items-center gap-4 rounded-card bg-primary-light p-4">
        <RegionIllustration kind={region} size={64} />
        <p className="font-medium">{t(`regions.${region}.instruction`)}</p>
      </div>

      <ConditionChecklist region={region} />

      <div className="space-y-4">
        <OptionCard
          icon={Camera}
          title={t('inputMethod.camera')}
          sub={t('inputMethod.cameraSub')}
          onClick={() => navigate('/scan/capture')}
          disabled={busy}
        />
        <OptionCard
          icon={ImageUp}
          title={t('inputMethod.upload')}
          sub={t('inputMethod.uploadSub')}
          onClick={upload}
          disabled={busy}
        />
      </div>

      {demoMode && (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-h3">
            <PlayCircle className="text-secondary" aria-hidden /> {t('inputMethod.demoSample')}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DEMO_SETS.map((d) => (
              <button
                key={d.id}
                type="button"
                disabled={busy}
                onClick={() => pickSample(d.id)}
                className="overflow-hidden rounded-2xl bg-surface text-left shadow-soft transition hover:shadow-lift disabled:opacity-50"
              >
                <img src={d.images[region]} alt="" className="aspect-square w-full object-cover" />
                <span className="block p-2 text-sm font-semibold">{t(`demo.sets.${d.id}`)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {busy && (
        <p className="mt-6 flex items-center gap-2 text-ink-muted" role="status">
          <Loader2 className="animate-spin" size={20} aria-hidden /> {t('inputMethod.checking')}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 font-semibold text-severity-severe">
          {t('common.errorGeneric')}
        </p>
      )}
    </div>
  );
}
