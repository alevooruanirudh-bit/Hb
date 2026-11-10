import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  HelpCircle,
  Info,
  ListChecks,
  Save,
  ScanLine,
  ShieldCheck,
  Trash2,
  Volume2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HbGauge } from '@/components/ui/HbGauge';
import { SeverityChip } from '@/components/ui/SeverityChip';
import { Badge } from '@/components/ui/Badge';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { PageHeader } from '@/components/ui/PageHeader';
import { RegionIllustration } from '@/components/illustrations/RegionIllustration';
import { AdjustmentsCard } from '@/components/scan/AdjustmentsCard';
import { SimulatedBanner } from '@/components/scan/SimulatedBanner';
import { ModelInfoNote } from '@/components/scan/ModelInfoNote';
import { CalibrationCard } from '@/components/scan/CalibrationCard';
import { useScanSession } from '@/store/scanStore';
import { useProfiles } from '@/store/useActiveProfile';
import { recordToOutcome, scanRepo, toSubject } from '@/db/repositories';
import { db, type ScanResultRecord } from '@/db/db';
import { severityClassifier } from '@/ml/severityClassifier';
import type { ScanOutcome } from '@/ml/types';
import { saveCurrentScan } from '@/features/scan/saveScan';
import { shareOrDownloadReport } from '@/features/report/pdfReport';
import { useVoice } from '@/features/voice/useVoice';
import { severityStyles } from '@/utils/severity';
import { formatDate, profileLabel } from '@/utils/profileText';
import { cn } from '@/utils/cn';

/**
 * Results for the current scan (/scan/results) or a saved one (/history/:id):
 * animated gauge, severity, region breakdown, reliability, fallback note,
 * actions and the always-visible disclaimer. Two-column dashboard on desktop.
 */
export function ResultsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const historyId = id ? Number(id) : null;
  const { active, profiles } = useProfiles();
  const session = useScanSession();
  const voice = useVoice();
  const [record, setRecord] = useState<ScanResultRecord | null | undefined>(historyId ? undefined : null);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (historyId) void scanRepo.get(historyId).then((r) => setRecord(r ?? null));
  }, [historyId]);

  const outcome: ScanOutcome | null = historyId ? (record ? recordToOutcome(record) : null) : session.outcome;
  const profile = historyId ? profiles?.find((p) => p.id === record?.profileId) : active;

  // Spoken summary: likely range (or value) + severity — in the app language and in English
  // (spoken instead when this device has no voice for the app language).
  const spokenSummary = (o: ScanOutcome, lng?: string) => {
    const a = o.altitudeAdjustment ?? 0;
    const severity = t(`severityLong.${o.severity}`, { lng });
    return o.hbLow !== undefined && o.hbHigh !== undefined
      ? t('results.voiceSummaryRange', { low: (o.hbLow - a).toFixed(1), high: (o.hbHigh - a).toFixed(1), severity, lng })
      : t('results.voiceSummary', { value: (o.hbAdjusted ?? o.hb).toFixed(1), severity, lng });
  };
  const readAloud = (o: ScanOutcome, force = false) =>
    voice.speak(spokenSummary(o), { force, englishText: spokenSummary(o, 'en') });

  // History → "Add blood test result": jump straight to the blood test box.
  const [search] = useSearchParams();
  const jumpToBloodTest = search.get('bloodtest') === '1';
  useEffect(() => {
    if (!jumpToBloodTest || !record) return;
    const el = document.getElementById('blood-test');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.querySelector<HTMLInputElement>('input[type="number"]')?.focus({ preventScroll: true });
  }, [jumpToBloodTest, record]);

  // Announce a new result once (when voice guidance is on).
  useEffect(() => {
    if (!outcome || historyId) return;
    void readAloud(outcome);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome?.hb]);

  if (historyId && record === undefined) return null;
  if (!outcome) return <Navigate to={historyId ? '/history' : '/home'} replace />;

  const saved = historyId !== null || session.savedScanId !== null;
  const thresholds = profile
    ? severityClassifier.selectGroup(toSubject(profile)).group
    : { normal: outcome.normalThreshold, mild: outcome.normalThreshold - 1, moderate: 8, upper: outcome.upperNormal };
  const timestamp = record?.timestamp ?? Date.now();
  const sev = severityStyles[outcome.severity];
  // Everything shown on the gauge is on the judged (altitude-adjusted) scale.
  const judged = outcome.hbAdjusted ?? outcome.hb;
  const adj = outcome.altitudeAdjustment ?? 0;
  const range: [number, number] | undefined =
    outcome.hbLow !== undefined && outcome.hbHigh !== undefined
      ? [Math.round((outcome.hbLow - adj) * 10) / 10, Math.round((outcome.hbHigh - adj) * 10) / 10]
      : undefined;
  const upper = thresholds.upper ?? outcome.upperNormal;
  const [sevLow, sevHigh] = outcome.severityRange ?? [outcome.severity, outcome.severity];

  const save = async () => {
    if (!profile?.id) return;
    setSaving(true);
    await saveCurrentScan(profile.id);
    setSaving(false);
  };

  const why = () => {
    if (historyId) return navigate(`/history/${historyId}/guidance?focus=causes`);
    navigate(outcome.anemia ? '/scan/questionnaire' : '/scan/guidance?focus=causes');
  };
  const what = () =>
    navigate(
      historyId
        ? `/history/${historyId}/guidance?focus=actions`
        : outcome.anemia && !Object.keys(session.answers).length
          ? '/scan/questionnaire?next=actions'
          : '/scan/guidance?focus=actions',
    );

  const share = async () => {
    if (!profile) return;
    setSharing(true);
    try {
      const answers = historyId
        ? ((await db.questionnaireResponses.where('scanId').equals(historyId).last())?.answers ?? {})
        : session.answers;
      const idx = profiles?.findIndex((p) => p.id === profile.id) ?? 0;
      await shareOrDownloadReport({
        profile,
        profileName: profileLabel(profile, idx, t),
        outcome,
        timestamp,
        answers,
        t,
        lang: i18n.language,
      });
    } finally {
      setSharing(false);
    }
  };

  const remove = async () => {
    if (!historyId || !window.confirm(t('history.deleteConfirm'))) return;
    await scanRepo.remove(historyId);
    navigate('/history', { replace: true });
  };

  return (
    <div>
      <PageHeader
        title={t('results.title')}
        subtitle={`${profile ? profileLabel(profile, profiles?.findIndex((p) => p.id === profile.id) ?? 0, t) + ' · ' : ''}${formatDate(timestamp, i18n.language, true)}`}
        back={historyId ? '/history' : '/home'}
        action={
          <div className="flex items-center gap-2">
            {outcome.isDemo && <Badge tone="demo">{t('demo.badge')}</Badge>}
            <Button
              size="md"
              variant="outline"
              icon={Volume2}
              onClick={() => void readAloud(outcome, true)}
              aria-label={t('results.readAloud')}
            >
              <span className="hidden sm:inline">{t('results.readAloud')}</span>
            </Button>
          </div>
        }
      />

      {outcome.modelSource === 'mock' && <SimulatedBanner className="mb-6" />}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: gauge + verdict */}
        <Card className="flex flex-col items-center text-center">
          {/* The gauge shows the value that was judged against the cutoffs (altitude-adjusted). */}
          <HbGauge hb={judged} severity={outcome.severity} thresholds={thresholds} range={range} />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-2 flex flex-col items-center"
          >
            <p className={cn('text-h1', sev.text)}>{t(`severityLong.${outcome.severity}`)}</p>
            <p className="mt-2 flex items-center gap-2 text-lg font-semibold">
              {outcome.anemia ? (
                <AlertTriangle className={sev.text} size={22} aria-hidden />
              ) : (
                <CheckCircle2 className="text-severity-normal" size={22} aria-hidden />
              )}
              {outcome.anemia ? t('results.anemiaDetected') : t('results.anemiaNotDetected')}
            </p>
            {range && (
              <p className="mt-2 text-lg">
                {t('results.likelyRange', { low: range[0].toFixed(1), high: range[1].toFixed(1) })}{' '}
                <span className="text-ink-muted">({t('results.bestEstimate', { value: judged.toFixed(1) })})</span>
              </p>
            )}
            <p className="mt-1 text-ink-muted">
              {upper !== undefined
                ? t('results.healthyRange', { min: thresholds.normal.toFixed(1), max: upper.toFixed(1) })
                : t('results.normalRange', { value: thresholds.normal.toFixed(1) })}
            </p>
            {sevLow !== sevHigh && (
              <p className="mt-3 flex max-w-md gap-2 rounded-2xl bg-severity-mild/15 p-3 text-left text-sm">
                <Info size={18} className="mt-0.5 shrink-0" aria-hidden />
                {t('results.rangeCrosses', { a: t(`severityLong.${sevLow}`), b: t(`severityLong.${sevHigh}`) })}
              </p>
            )}
            {outcome.palmCheck?.disagrees && (
              <p className="mt-3 flex max-w-md gap-2 rounded-2xl bg-severity-mild/15 p-3 text-left text-sm">
                <Info size={18} className="mt-0.5 shrink-0" aria-hidden />
                {outcome.palmCheck.looksAnemic ? t('results.palmDisagreesAnemic') : t('results.palmDisagreesHealthy')}
              </p>
            )}
            {outcome.aboveNormal && (
              <p className="mt-3 flex max-w-md gap-2 rounded-2xl bg-secondary-light p-3 text-left text-sm text-secondary">
                <Info size={18} className="mt-0.5 shrink-0" aria-hidden />
                {t('results.aboveNormal')}
              </p>
            )}
            {(outcome.altitudeAdjustment ?? 0) > 0 && (
              <p className="mt-1 text-sm font-semibold text-secondary">
                {t('results.altitudeCompared', {
                  hb: outcome.hb.toFixed(1),
                  adj: (outcome.altitudeAdjustment ?? 0).toFixed(1),
                  value: (outcome.hbAdjusted ?? outcome.hb).toFixed(1),
                })}
              </p>
            )}
          </motion.div>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {outcome.reliability === 'high' ? (
              <Badge tone="success" icon={ShieldCheck}>
                {t('results.highConfidence')}
              </Badge>
            ) : (
              <Badge tone="warning" icon={AlertTriangle}>
                {t('results.lowConfidenceShort')}
              </Badge>
            )}
          </div>
          {outcome.reliability === 'low' && (
            <p className="mt-2 max-w-sm text-sm text-ink-muted">{t('results.lowConfidence')}</p>
          )}
          {outcome.usedFallback && (
            <p className="mt-4 flex max-w-md gap-2 rounded-2xl bg-secondary-light p-3 text-left text-sm text-secondary">
              <Info size={18} className="mt-0.5 shrink-0" aria-hidden />
              {t('results.fallbackNote')}
            </p>
          )}
          {/* Never raise an urgent alarm from simulated numbers. */}
          {outcome.severity === 'severe' && outcome.modelSource !== 'mock' && (
            <p
              className="mt-4 w-full rounded-2xl bg-severity-severe p-4 text-left font-semibold text-white"
              role="alert"
            >
              {t('guidance:referral.urgent.body')}
            </p>
          )}
        </Card>

        {/* Right: breakdown + actions */}
        <div className="flex flex-col gap-6">
          <AdjustmentsCard outcome={outcome} />
          <Card>
            <h2 className="text-h3">{t('results.regionBreakdown')}</h2>
            <ul className="mt-4 space-y-3">
              {outcome.regions.map((r) => {
                if (r.likelihoodOnly) {
                  const pct = Math.round((r.anemiaProbability ?? 0) * 100);
                  return (
                    <li
                      key={r.region}
                      className={cn('flex items-center gap-4 rounded-2xl bg-surface-muted p-3', r.confounderFactor === 0 && 'opacity-60')}
                    >
                      <RegionIllustration kind={r.region} size={48} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{t(`regions.${r.region}.name`)}</p>
                        <p className="text-sm text-ink-muted">{t('results.palmCheckLabel')}</p>
                        {(r.confounderFactor ?? 1) === 0 && (
                          <p className="mt-0.5 text-sm font-semibold text-severity-moderate">{t('adjustments.excluded')}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={cn('text-lg font-bold', r.looksAnemic ? 'text-severity-moderate' : 'text-severity-normal')}>
                          {r.looksAnemic ? t('results.looksAnemic') : t('results.looksHealthy')}
                        </p>
                        <p className="text-sm text-ink-muted tabular-nums">{t('results.anemiaChance', { pct })}</p>
                      </div>
                    </li>
                  );
                }
                const rsev = severityClassifier.classify(
                  r.hb,
                  profile ? toSubject(profile) : { ageYears: 30, sex: 'female', pregnant: false },
                ).severity;
                return (
                  <li
                    key={r.region}
                    className={cn('flex items-center gap-4 rounded-2xl bg-surface-muted p-3', r.confounderFactor === 0 && 'opacity-60')}
                  >
                    <RegionIllustration kind={r.region} size={48} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{t(`regions.${r.region}.name`)}</p>
                      <p className="text-sm text-ink-muted">
                        {t(`results.model.${r.model}`)} ·{' '}
                        {t('results.quality', { value: Math.round(r.qualityScore * 100) })}
                      </p>
                      {(r.confounderFactor ?? 1) < 1 && (
                        <p className="mt-0.5 text-sm font-semibold text-severity-moderate">
                          {r.confounderFactor === 0 ? t('adjustments.excluded') : t('adjustments.lessWeight')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={cn('text-h3 tabular-nums', severityStyles[rsev].text)}>
                        {r.hb.toFixed(1)}
                      </p>
                      <p className="text-sm text-ink-muted tabular-nums">
                        {r.halfWidth !== undefined ? `± ${r.halfWidth.toFixed(1)} ` : ''}
                        {t('common.gdl')}
                      </p>
                    </div>
                  </li>
                );
              })}
              {outcome.regions.filter((r) => !r.likelihoodOnly).length > 1 && (
                <li className="flex items-center justify-between rounded-2xl border-2 border-primary/30 p-3">
                  <span>
                    <span className="block font-semibold">{t('results.combined')}</span>
                    {outcome.hbLow !== undefined && outcome.hbHigh !== undefined && (
                      <span className="block text-sm text-ink-muted tabular-nums">
                        {outcome.hbLow.toFixed(1)} – {outcome.hbHigh.toFixed(1)} {t('common.gdl')}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-3">
                    <SeverityChip severity={outcome.severity} size="sm" />
                    <span className={cn('text-h3 tabular-nums', sev.text)}>{outcome.hb.toFixed(1)}</span>
                  </span>
                </li>
              )}
            </ul>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" icon={HelpCircle} onClick={why}>
              {t('results.why')}
            </Button>
            <Button variant="outline" icon={ListChecks} onClick={what}>
              {t('results.what')}
            </Button>
            {!historyId && (
              <Button icon={saved ? CheckCircle2 : Save} onClick={save} disabled={saved || saving}>
                {saved ? t('common.saved') : t('common.save')}
              </Button>
            )}
            <Button variant="secondary" icon={Download} onClick={share} disabled={sharing}>
              {t('results.share')}
            </Button>
          </div>
          {!historyId ? (
            <Button variant="ghost" icon={ScanLine} onClick={() => navigate('/scan')}>
              {t('results.newScan')}
            </Button>
          ) : (
            <Button variant="ghost" icon={Trash2} className="text-severity-severe" onClick={remove}>
              {t('history.deleteScan')}
            </Button>
          )}
        </div>
      </div>

      {profile?.id && (
        <div id="blood-test" className="mt-8 scroll-mt-24">
          <CalibrationCard
            outcome={outcome}
            profile={profile}
            scanTime={timestamp}
            ensureSaved={async () => (historyId ? historyId : saveCurrentScan(profile.id!))}
            bloodTest={record?.bloodTest}
          />
        </div>
      )}
      {outcome.modelSource === 'real' && <ModelInfoNote className="mt-6" />}
      <Disclaimer className="mt-6" />
      <p className="mt-3 text-center text-sm text-ink-muted">
        {t('results.modelInfo', {
          source: t(`settings.modelSource.${outcome.modelSource}`),
          version: outcome.modelVersion,
          ms: outcome.durationMs,
        })}
      </p>
    </div>
  );
}
