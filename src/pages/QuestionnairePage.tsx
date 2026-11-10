import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  BatteryLow,
  Baby,
  Coffee,
  Droplets,
  Pill,
  RotateCw,
  Salad,
  CalendarDays,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useScanSession } from '@/store/scanStore';
import { useProfiles } from '@/store/useActiveProfile';
import type { QuestionAnswer, QuestionId } from '@/db/db';
import { cn } from '@/utils/cn';
import { saveCurrentScan } from '@/features/scan/saveScan';

const QUESTIONS: Array<{ id: QuestionId; icon: LucideIcon; femaleOnly?: boolean; pregnancyAge?: boolean }> = [
  { id: 'tired', icon: BatteryLow },
  { id: 'dizzy', icon: RotateCw },
  { id: 'heavyPeriods', icon: CalendarDays, femaleOnly: true },
  { id: 'bloodLoss', icon: Droplets },
  { id: 'vegetarian', icon: Salad },
  { id: 'teaWithMeals', icon: Coffee },
  { id: 'noRecentDeworming', icon: Pill },
  { id: 'pregnant', icon: Baby, femaleOnly: true, pregnancyAge: true },
];

/** Short yes / no / not-sure symptom & lifestyle questions, shown when anemia is detected. */
export function QuestionnairePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { active } = useProfiles();
  const { outcome, answers: saved, setAnswers } = useScanSession();
  const [answers, set] = useState<Partial<Record<QuestionId, QuestionAnswer>>>(() => ({
    ...(active?.pregnant ? { pregnant: 'yes' as const } : {}),
    // Diet was asked at registration — pre-fill instead of asking twice.
    ...(active?.diet ? { vegetarian: active.diet === 'vegetarian' || active.diet === 'vegan' ? ('yes' as const) : ('no' as const) } : {}),
    ...saved,
  }));

  if (!outcome) return <Navigate to="/home" replace />;

  const female = active?.sex === 'female';
  const age = active?.ageYears ?? 30;
  const visible = QUESTIONS.filter(
    (q) =>
      (!q.femaleOnly || female) &&
      (!q.pregnancyAge || (age >= 10 && age <= 55)) &&
      (q.id !== 'heavyPeriods' || age >= 10),
  );

  const submit = () => {
    setAnswers(answers);
    // If the scan was already saved, store the answers with it too.
    if (useScanSession.getState().savedScanId !== null && active?.id) void saveCurrentScan(active.id);
    navigate(`/scan/guidance?focus=${params.get('next') === 'actions' ? 'actions' : 'causes'}`, {
      replace: true,
    });
  };

  const opts: Array<{ v: QuestionAnswer; label: string }> = [
    { v: 'yes', label: t('common.yes') },
    { v: 'no', label: t('common.no') },
    { v: 'unsure', label: t('common.notSure') },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t('questionnaire.title')} subtitle={t('questionnaire.subtitle')} back />
      <div className="grid gap-4 md:grid-cols-2">
        {visible.map(({ id, icon: Icon }) => (
          <Card key={id} className="!p-4">
            <fieldset>
              <legend className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <Icon size={22} aria-hidden />
                </span>
                <span className="pt-2 font-semibold">{t(`questionnaire.q.${id}`)}</span>
              </legend>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {opts.map((o) => (
                  <label
                    key={o.v}
                    className={cn(
                      'flex min-h-touch cursor-pointer items-center justify-center rounded-xl border-2 px-2 text-center font-semibold transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/40',
                      answers[id] === o.v
                        ? 'border-primary bg-primary-light text-primary'
                        : 'border-line text-ink hover:border-primary/40',
                    )}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name={id}
                      value={o.v}
                      checked={answers[id] === o.v}
                      onChange={() => set((a) => ({ ...a, [id]: o.v }))}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </Card>
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
        <Button iconRight={ArrowRight} onClick={submit} className="sm:flex-1">
          {t('questionnaire.submit')}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setAnswers({});
            navigate('/scan/guidance?focus=causes', { replace: true });
          }}
        >
          {t('common.skip')}
        </Button>
      </div>
    </div>
  );
}
