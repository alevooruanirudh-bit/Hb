import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertOctagon,
  AlertTriangle,
  Building2,
  CheckCircle2,
  HeartPulse,
  Hospital,
  Phone,
  Search,
  Stethoscope,
  UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { SimulatedBanner } from '@/components/scan/SimulatedBanner';
import { SeverityChip } from '@/components/ui/SeverityChip';
import { useScanSession } from '@/store/scanStore';
import { useProfiles } from '@/store/useActiveProfile';
import { questionnaireRepo, scanRepo, toSubject } from '@/db/repositories';
import type { QuestionAnswer, QuestionId, ScanResultRecord } from '@/db/db';
import { guidanceEngine, type Referral } from '@/guidance/guidanceEngine';
import type { Severity } from '@/ml/types';
import { cn } from '@/utils/cn';

const referralStyle: Record<Referral, { cls: string; icon: LucideIcon }> = {
  none: { cls: 'bg-severity-normal/10 text-ink', icon: CheckCircle2 },
  routine: { cls: 'bg-severity-mild/15 text-ink', icon: Stethoscope },
  soon: { cls: 'bg-severity-moderate text-white', icon: AlertTriangle },
  urgent: { cls: 'bg-severity-severe text-white shadow-lift', icon: AlertOctagon },
};

/** Possible causes, what you can do, referral urgency and local resources. */
export function GuidancePage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const historyId = id ? Number(id) : null;
  const [params] = useSearchParams();
  const focus = params.get('focus');
  const { active, profiles } = useProfiles();
  const session = useScanSession();
  const [record, setRecord] = useState<ScanResultRecord | null>(null);
  const [histAnswers, setHistAnswers] = useState<Partial<Record<QuestionId, QuestionAnswer>>>({});
  const causesRef = useRef<HTMLElement>(null);
  const actionsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!historyId) return;
    void scanRepo.get(historyId).then((r) => setRecord(r ?? null));
    void questionnaireRepo.forScan(historyId).then((q) => setHistAnswers(q?.answers ?? {}));
  }, [historyId]);

  const severity: Severity | undefined = historyId ? record?.severity : session.outcome?.severity;
  const simulated = (historyId ? record?.modelSource : session.outcome?.modelSource) === 'mock';
  const profile = historyId ? profiles?.find((p) => p.id === record?.profileId) : active;
  const answers = historyId ? histAnswers : session.answers;

  const plan = useMemo(
    () =>
      severity ? guidanceEngine.build(severity, answers, profile ? toSubject(profile) : undefined) : null,
    [severity, answers, profile],
  );

  useEffect(() => {
    const el = focus === 'actions' ? actionsRef.current : focus === 'causes' ? causesRef.current : null;
    if (el && plan) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
  }, [focus, plan]);

  if (!historyId && !session.outcome) return <Navigate to="/home" replace />;
  if (!plan || !severity) return null;

  const ref = referralStyle[plan.referral];
  const RefIcon = ref.icon;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={t('guidance.title')}
        subtitle={t('guidance.subtitle')}
        back
        action={<SeverityChip severity={severity} />}
      />
      {simulated && <SimulatedBanner className="mb-5" />}

      {/* Referral card — prominent red for severe */}
      <section
        className={cn(
          'rounded-card p-5 md:p-6',
          ref.cls,
          plan.referral === 'urgent' && 'ring-4 ring-severity-severe/30',
        )}
        role={plan.referral === 'urgent' ? 'alert' : undefined}
      >
        <div className="flex gap-4">
          <RefIcon size={plan.referral === 'urgent' ? 40 : 30} className="shrink-0" aria-hidden />
          <div>
            <h2 className={plan.referral === 'urgent' ? 'text-h2' : 'text-h3'}>
              {t(`guidance:referral.${plan.referral}.title`)}
            </h2>
            <p className="mt-1 text-lg">{t(`guidance:referral.${plan.referral}.body`)}</p>
          </div>
        </div>
      </section>

      {plan.symptomWarning && (
        <p className="mt-4 flex gap-3 rounded-2xl bg-severity-mild/15 p-4 font-semibold">
          <HeartPulse className="shrink-0 text-severity-moderate" aria-hidden />{' '}
          {t('guidance:symptomWarning')}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {plan.causes.length > 0 && (
          <section ref={causesRef} className="scroll-mt-6" aria-labelledby="causes-h">
            <h2 id="causes-h" className="mb-1 flex items-center gap-2 text-h3">
              <Search className="text-primary" aria-hidden /> {t('guidance.causesTitle')}
            </h2>
            <p className="mb-3 text-sm text-ink-muted">{t('guidance.causesNote')}</p>
            <div className="space-y-3">
              {plan.causes.map((c) => (
                <Card key={c} className="!p-4">
                  <h3 className="text-lg font-semibold">{t(`guidance:causes.${c}.title`)}</h3>
                  <p className="mt-1 text-ink-muted">{t(`guidance:causes.${c}.body`)}</p>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section
          ref={actionsRef}
          className={cn('scroll-mt-6', plan.causes.length === 0 && 'lg:col-span-2')}
          aria-labelledby="actions-h"
        >
          <h2 id="actions-h" className="mb-3 flex items-center gap-2 text-h3">
            <CheckCircle2 className="text-secondary" aria-hidden /> {t('guidance.actionsTitle')}
          </h2>
          <ol className="space-y-3">
            {plan.actions.map((a, i) => (
              <li key={a}>
                <Card className="flex gap-4 !p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-light font-bold text-secondary">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{t(`guidance:actions.${a}.title`)}</h3>
                    <p className="mt-1 text-ink-muted">{t(`guidance:actions.${a}.body`)}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {plan.showResources && (
        <section className="mt-8" aria-labelledby="res-h">
          <h2 id="res-h" className="mb-3 text-h3">
            {t('guidance:resources.title')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ['amb', HeartPulse],
                ['phc', Hospital],
                ['anganwadi', UsersRound],
                ['emergency', Phone],
              ] as Array<[string, LucideIcon]>
            ).map(([k, Icon]) => (
              <Card key={k} tone="muted" className="flex gap-3 !p-4">
                <Icon className="mt-0.5 shrink-0 text-primary" aria-hidden />
                <div>
                  <h3 className="font-semibold">{t(`guidance:resources.${k}.title`)}</h3>
                  <p className="text-sm text-ink-muted">{t(`guidance:resources.${k}.body`)}</p>
                </div>
              </Card>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
            <Building2 size={16} aria-hidden /> {t('guidance.resourcesNote')}
          </p>
        </section>
      )}

      <Disclaimer className="mt-8" />
    </div>
  );
}
