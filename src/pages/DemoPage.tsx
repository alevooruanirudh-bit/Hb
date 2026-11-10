import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, PlayCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { SeverityChip } from '@/components/ui/SeverityChip';
import { Toggle } from '@/components/ui/Toggle';
import { DEMO_SETS, loadDemoImage } from '@/features/demo/demoSamples';
import { useScanSession } from '@/store/scanStore';
import { useSettings } from '@/store/settingsStore';
import { ALL_REGIONS } from '@/ml/types';
import { assetUrl } from '@/utils/assetUrl';

/**
 * Demo mode: pick a bundled sample set and run the FULL pipeline (quality →
 * preprocessing → region → features → models → fusion → severity) on its
 * eye, nail and palm images — no camera needed. Results carry a "Demo" badge.
 */
export function DemoPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { demoMode, set } = useSettings();
  const [loading, setLoading] = useState<string | null>(null);

  const run = async (id: string) => {
    const d = DEMO_SETS.find((s) => s.id === id)!;
    setLoading(id);
    try {
      const session = useScanSession.getState();
      session.start(ALL_REGIONS, { demo: true });
      for (const r of ALL_REGIONS) {
        session.setCapture(r, { blob: await loadDemoImage(d.images[r]), source: 'demo', demoId: d.id });
      }
      navigate('/scan/processing');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <PageHeader title={t('demo.title')} subtitle={t('demo.subtitle')} back="/home" />
      <Card className="mb-6 !p-3">
        <Toggle
          checked={demoMode}
          onChange={(v) => set({ demoMode: v })}
          label={t('settings.demoMode')}
          description={t('settings.demoModeDesc')}
          icon={PlayCircle}
        />
      </Card>
      <div className="grid gap-5 md:grid-cols-2">
        {DEMO_SETS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => run(d.id)}
            disabled={!!loading}
            className="overflow-hidden rounded-card bg-surface text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-60"
          >
            <div className="grid grid-cols-3">
              {ALL_REGIONS.map((r) => (
                <img
                  key={r}
                  src={assetUrl(d.images[r])}
                  alt={t(`regions.${r}.name`)}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-h3">{t(`demo.sets.${d.id}`)}</p>
                <div className="mt-1">
                  <SeverityChip severity={d.level} size="sm" />
                </div>
              </div>
              {loading === d.id ? (
                <Loader2 className="animate-spin text-primary" size={32} aria-hidden />
              ) : (
                <PlayCircle className="text-primary" size={36} aria-hidden />
              )}
            </div>
          </button>
        ))}
      </div>
      <p className="mt-6 rounded-2xl bg-surface-muted p-4 text-sm text-ink-muted">{t('demo.note')}</p>
    </div>
  );
}
