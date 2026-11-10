import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronRight,
  CloudUpload,
  Cpu,
  Gauge,
  Info,
  Languages,
  Moon,
  PlayCircle,
  Share2,
  Trash2,
  Users,
  Volume2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { useSettings, type ThemeMode } from '@/store/settingsStore';
import { deleteAllData } from '@/db/repositories';
import { LANGUAGES } from '@/config/languages';
import { pipelineWorker } from '@/workers/workerClient';
import { resolveUseMock } from '@/features/scan/useCaptureFlow';
import type { InitResult } from '@/workers/protocol';
import { appConfig } from '@/config/appConfig';
import { LearningCard } from '@/components/scan/LearningCard';
import { ModelPerformanceCard } from '@/components/scan/ModelPerformanceCard';
import { loadVoices, useVoice } from '@/features/voice/useVoice';
import { pickVoice, voicesFor } from '@/features/voice/voiceSelect';
import { Capacitor } from '@capacitor/core';
import thresholds from '@/config/severityThresholds.json';
import { cn } from '@/utils/cn';

function Row({
  icon: Icon,
  label,
  onClick,
  value,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  value?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[56px] w-full items-center gap-4 rounded-2xl px-2 py-2 text-left hover:bg-ink/5"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
        <Icon size={22} aria-hidden />
      </span>
      <span className="flex-1 font-semibold">{label}</span>
      {value && <span className="text-ink-muted">{value}</span>}
      <ChevronRight className="text-ink-muted" aria-hidden />
    </button>
  );
}

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: T;
  options: Array<{ v: T; label: string }>;
  onChange: (v: T) => void;
  icon: LucideIcon;
}) {
  return (
    <div className="px-2 py-2">
      <div className="mb-2 flex items-center gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
          <Icon size={22} aria-hidden />
        </span>
        <span className="font-semibold">{label}</span>
      </div>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2 sm:ml-[60px]">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={value === o.v}
            onClick={() => onChange(o.v)}
            className={cn(
              'min-h-touch rounded-xl border-2 px-2 font-semibold transition',
              value === o.v
                ? 'border-primary bg-primary-light text-primary'
                : 'border-line hover:border-primary/40',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Language, theme, voice, profiles, sync, demo, model info, delete data, about. */
export function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const s = useSettings();
  const voice = useVoice();
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  // Browser voices for the app language (the APK uses the phone's own text-to-speech voice).
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (Capacitor.isNativePlatform() || typeof speechSynthesis === 'undefined') return;
    let alive = true;
    void loadVoices().then((v) => alive && setVoices(v));
    return () => {
      alive = false;
    };
  }, []);
  const langVoices = voicesFor(voices, s.language);
  const bestVoice = pickVoice(voices, s.language);
  const [info, setInfo] = useState<InitResult | null>(null);

  useEffect(() => {
    let alive = true;
    pipelineWorker
      .init(resolveUseMock())
      .then((r) => alive && setInfo(r))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const wipe = async () => {
    if (!window.confirm(t('settings.deleteConfirm'))) return;
    await deleteAllData();
    s.set({ activeProfileId: null });
    navigate('/profile/new', { replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t('settings.title')} />

      <div className="space-y-5">
        <Card className="!p-3">
          <Choice
            icon={Languages}
            label={t('settings.language')}
            value={s.language}
            onChange={(v) => s.set({ language: v })}
            options={LANGUAGES.map((l) => ({ v: l.code, label: l.native }))}
          />
          <Choice<ThemeMode>
            icon={Moon}
            label={t('settings.theme')}
            value={s.theme}
            onChange={(v) => s.set({ theme: v })}
            options={[
              { v: 'system', label: t('settings.themeSystem') },
              { v: 'light', label: t('settings.themeLight') },
              { v: 'dark', label: t('settings.themeDark') },
            ]}
          />
          <Toggle
            icon={Volume2}
            checked={s.voiceEnabled}
            onChange={(v) => s.set({ voiceEnabled: v })}
            label={t('settings.voice')}
            description={t('settings.voiceDesc')}
          />
          {langVoices.length > 0 && (
            <label className="block px-2 py-2 sm:pl-[68px]">
              <span className="mb-1 block font-semibold">{t('settings.voiceChoice')}</span>
              <select
                value={s.voiceNames[s.language] ?? ''}
                onChange={(e) => s.set({ voiceNames: { ...s.voiceNames, [s.language]: e.target.value || undefined } })}
                className="w-full min-h-touch rounded-xl border-2 border-line bg-surface px-3 focus:border-primary focus:outline-none"
              >
                <option value="">{t('settings.voiceAuto', { voice: bestVoice?.name ?? '—' })}</option>
                {langVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang}){v.localService ? '' : ` · ${t('settings.voiceOnline')}`}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-sm text-ink-muted">{t('settings.voiceChoiceHint')}</span>
            </label>
          )}
          <Choice<string>
            icon={Gauge}
            label={t('settings.voiceSpeed')}
            value={String(s.voiceRate)}
            onChange={(v) => s.set({ voiceRate: Number(v) })}
            options={[
              { v: '0.75', label: t('settings.voiceSlow') },
              { v: '0.9', label: t('settings.voiceNormal') },
              { v: '1.05', label: t('settings.voiceFast') },
            ]}
          />
          <div className="flex flex-wrap items-center gap-3 px-2 pb-2">
            <Button
              size="md"
              variant="outline"
              icon={Volume2}
              onClick={async () => {
                setVoiceStatus(t('settings.voiceTesting'));
                const r = await voice.speakKey('settings.voiceTestPhrase', {}, { force: true });
                setVoiceStatus(
                  r.ok
                    ? t(r.fellBackToEnglish ? 'settings.voiceOkEnglish' : 'settings.voiceOk', { voice: r.voice, lang: r.lang })
                    : t('settings.voiceFailed', { reason: r.reason + (r.detail ? ` — ${r.detail}` : '') }),
                );
              }}
            >
              {t('settings.voiceTest')}
            </Button>
            {voiceStatus && (
              <p className="text-sm" role="status">
                {voiceStatus}
              </p>
            )}
            {!voice.voiceAvailable && <p className="text-sm text-ink-muted">{t('settings.voiceMissing')}</p>}
          </div>
        </Card>

        <Card className="!p-3">
          <Row icon={Users} label={t('profile.manage')} onClick={() => navigate('/profiles')} />
          <Toggle
            icon={PlayCircle}
            checked={s.demoMode}
            onChange={(v) => s.set({ demoMode: v })}
            label={t('settings.demoMode')}
            description={t('settings.demoModeDesc')}
          />
        </Card>

        <LearningCard />

        <Card className="!p-3">
          <h2 className="px-2 pb-1 pt-2 text-h3">{t('settings.privacy')}</h2>
          <Toggle
            icon={Share2}
            checked={s.dataContribution}
            onChange={(v) =>
              (!v || window.confirm(t('settings.contributeConfirm'))) && s.set({ dataContribution: v })
            }
            label={t('settings.contribute')}
            description={t('settings.contributeDesc')}
          />
          <Toggle
            icon={CloudUpload}
            checked={s.syncEnabled}
            onChange={(v) => (!v || window.confirm(t('settings.syncConfirm'))) && s.set({ syncEnabled: v })}
            label={t('settings.sync')}
            description={appConfig.syncApiBaseUrl ? t('settings.syncDesc') : t('settings.syncNoEndpoint')}
          />
          <div className="px-2 pt-2">
            <Button variant="danger" icon={Trash2} fullWidth onClick={wipe}>
              {t('settings.deleteAll')}
            </Button>
          </div>
        </Card>

        <Card className="!p-3">
          <h2 className="flex items-center gap-2 px-2 pb-1 pt-2 text-h3">
            <Cpu className="text-primary" aria-hidden /> {t('settings.modelInfo')}
          </h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 px-2 py-2">
            <dt className="text-ink-muted">{t('settings.modelSourceLabel')}</dt>
            <dd className="font-semibold">{info ? t(`settings.modelSource.${info.modelSource}`) : '…'}</dd>
            <dt className="text-ink-muted">{t('settings.modelVersion')}</dt>
            <dd className="font-semibold">{info?.modelVersion ?? '…'}</dd>
            <dt className="text-ink-muted">{t('settings.imageBackend')}</dt>
            <dd className="font-semibold">
              {info ? (info.backend === 'opencv' ? 'OpenCV.js' : 'JavaScript') : '…'}
            </dd>
            <dt className="text-ink-muted">{t('settings.thresholds')}</dt>
            <dd className="font-semibold">WHO {thresholds.version}</dd>
            <dt className="text-ink-muted">{t('settings.appVersion')}</dt>
            <dd className="font-semibold">{appConfig.appVersion}</dd>
          </dl>
        </Card>

        <ModelPerformanceCard />

        <Card className="!p-3">
          <Row icon={Info} label={t('settings.about')} onClick={() => navigate('/about')} />
        </Card>
      </div>
    </div>
  );
}
