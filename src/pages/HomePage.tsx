import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { ChevronRight, History, Leaf, PlayCircle, ScanLine, Settings, UserRound, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SeverityChip } from '@/components/ui/SeverityChip';
import { HbTrendChart } from '@/components/ui/HbTrendChart';
import { Badge } from '@/components/ui/Badge';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { useProfiles } from '@/store/useActiveProfile';
import { useSettings } from '@/store/settingsStore';
import { scanRepo, toSubject } from '@/db/repositories';
import type { ScanResultRecord } from '@/db/db';
import { severityClassifier } from '@/ml/severityClassifier';
import { formatDate, profileLabel } from '@/utils/profileText';
import { severityStyles } from '@/utils/severity';
import { cn } from '@/utils/cn';
import { judgedHb, rangeText } from '@/utils/hbDisplay';

function greetingKey() {
  const h = new Date().getHours();
  return h < 12 ? 'home.greetingMorning' : h < 17 ? 'home.greetingAfternoon' : 'home.greetingEvening';
}

/** Home dashboard: greeting + profile switcher, Start Scan, last result, trend, quick links. */
export function HomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { profiles, active } = useProfiles();
  const set = useSettings((s) => s.set);
  const demoMode = useSettings((s) => s.demoMode);
  const scans = useLiveQuery(
    () => (active?.id ? scanRepo.listForProfile(active.id) : Promise.resolve([] as ScanResultRecord[])),
    [active?.id],
  );

  if (profiles && profiles.length === 0) return <Navigate to="/profile/new" replace />;

  const last = scans?.[0];
  const activeIndex = profiles?.findIndex((p) => p.id === active?.id) ?? 0;
  const name = active ? profileLabel(active, activeIndex, t) : '';
  const group = active ? severityClassifier.selectGroup(toSubject(active)).group : undefined;
  const normal = group?.normal ?? 12;
  const upper = group?.upper;

  const quickLinks = [
    { to: '/history', icon: History, label: t('nav.history') },
    { to: '/tips', icon: Leaf, label: t('home.dietTips') },
    { to: '/settings', icon: Settings, label: t('nav.settings') },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting + profile switcher */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-ink-muted">{t(greetingKey())}</p>
          <h1 className="text-h2 md:text-h1">{name}</h1>
        </div>
        <div className="flex items-center gap-2">
          {profiles && profiles.length > 1 && (
            <label className="relative">
              <span className="sr-only">{t('profile.switch')}</span>
              <UserRound
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary"
                size={20}
                aria-hidden
              />
              <select
                className="min-h-touch appearance-none rounded-pill border-2 border-line bg-surface py-2 pl-10 pr-6 font-semibold text-ink focus:border-primary"
                value={active?.id}
                onChange={(e) => set({ activeProfileId: Number(e.target.value) })}
              >
                {profiles.map((p, i) => (
                  <option key={p.id} value={p.id}>
                    {profileLabel(p, i, t)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Button
            variant="ghost"
            size="md"
            icon={Users}
            onClick={() => navigate('/profiles')}
            aria-label={t('profile.manage')}
          />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Start scan hero */}
        <motion.div className="lg:col-span-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card
            tone="primary"
            className="relative flex h-full flex-col justify-between overflow-hidden !p-6 md:!p-8"
          >
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/10"
              aria-hidden
            />
            <div className="relative">
              <h2 className="text-h2 text-primary">{t('home.startScanTitle')}</h2>
              <p className="mt-2 max-w-md text-lg">{t('home.startScanSub')}</p>
            </div>
            <div className="relative mt-6 flex flex-col gap-3 sm:flex-row">
              <Button size="xl" icon={ScanLine} onClick={() => navigate('/scan')} className="sm:flex-1">
                {t('home.startScan')}
              </Button>
              <Button size="xl" variant="secondary" icon={PlayCircle} onClick={() => navigate('/demo')}>
                {t('home.tryDemo')}
              </Button>
            </div>
            {demoMode && (
              <div className="relative mt-4">
                <Badge tone="demo">{t('demo.modeOn')}</Badge>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Last result */}
        <Card
          className="lg:col-span-2"
          interactive={!!last}
          onClick={() => last && navigate(`/history/${last.id}`)}
        >
          <h2 className="text-h3">{t('home.lastResult')}</h2>
          {last ? (
            <div className="mt-4">
              <div className="flex items-end gap-2">
                <span
                  className={cn(
                    'text-[3rem] font-extrabold leading-none',
                    severityStyles[last.severity].text,
                  )}
                >
                  {judgedHb(last).value.toFixed(1)}
                </span>
                <span className="pb-1 text-lg text-ink-muted">{t('common.gdl')}</span>
              </div>
              {rangeText(last) && (
                <p className="mt-1 text-ink-muted tabular-nums">
                  {t('results.likelyRangeShort', { range: rangeText(last) })}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <SeverityChip severity={last.severity} />
                {last.isDemo && <Badge tone="demo">{t('demo.badge')}</Badge>}
                {!last.isDemo && last.modelSource === 'mock' && <Badge tone="warning">{t('simulated.badge')}</Badge>}
              </div>
              <p className="mt-3 text-ink-muted">{formatDate(last.timestamp, i18n.language, true)}</p>
            </div>
          ) : (
            <p className="mt-4 text-ink-muted">{t('home.noScans')}</p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Mini trend */}
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-h3">{t('home.trend')}</h2>
            <Button variant="ghost" size="md" iconRight={ChevronRight} onClick={() => navigate('/history')}>
              {t('home.viewAll')}
            </Button>
          </div>
          {scans && scans.length >= 2 ? (
            <HbTrendChart scans={scans.slice(0, 10)} normalThreshold={normal} upperNormal={upper} height={140} compact />
          ) : (
            <p className="mt-3 text-ink-muted">{t('home.trendEmpty')}</p>
          )}
        </Card>

        {/* Quick links */}
        <nav className="grid grid-cols-3 gap-3 lg:col-span-2" aria-label={t('home.quickLinks')}>
          {quickLinks.map(({ to, icon: Icon, label }) => (
            <button
              key={to}
              type="button"
              onClick={() => navigate(to)}
              className="flex min-h-[112px] flex-col items-center justify-center gap-2 rounded-card bg-surface p-3 text-center font-semibold shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-light text-secondary">
                <Icon size={24} aria-hidden />
              </span>
              {label}
            </button>
          ))}
        </nav>
      </div>

      <Disclaimer compact />
    </div>
  );
}
