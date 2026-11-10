import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Save, Trash2, UserPlus, AlertTriangle, MapPin, Mountain, Salad, Palette, Droplet } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { profileRepo } from '@/db/repositories';
import { useSettings } from '@/store/settingsStore';
import type { Sex, SkinTone } from '@/ml/types';
import type { Diet } from '@/db/db';
import { SkinTonePicker } from '@/components/profile/SkinTonePicker';
import { personalOffset, type CalibrationPoint } from '@/ml/personalCalibration';
import { COUNTRY_CODES, HILL_STATES, INDIAN_STATES, PRIORITY_COUNTRIES, countryName } from '@/config/locations';
import { ALTITUDE_BANDS_M } from '@/ml/altitude';
import { cn } from '@/utils/cn';

function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block font-semibold">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-sm text-ink-muted">{hint}</p>}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T | null;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-3">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'min-h-[56px] rounded-2xl border-2 px-4 text-lg font-semibold transition',
            value === o.value
              ? 'border-primary bg-primary-light text-primary'
              : 'border-line bg-surface text-ink hover:border-primary/40',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: typeof MapPin; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 border-t border-line pt-5 text-h3">
      <Icon className="text-secondary" size={22} aria-hidden />
      {children}
    </h2>
  );
}

const inputCls =
  'w-full min-h-[56px] rounded-2xl border-2 border-line bg-surface px-4 text-lg text-ink placeholder:text-ink-muted/70 focus:border-primary focus:outline-none';

/**
 * Create or edit a profile: name (optional), age, sex, pregnancy when relevant,
 * location (altitude adjustment), diet and skin tone (palm reliability).
 */
export function ProfileFormPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const editingId = id ? Number(id) : null;
  const setSettings = useSettings((s) => s.set);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [months, setMonths] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [pregnant, setPregnant] = useState<'yes' | 'no'>('no');
  const [country, setCountry] = useState('IN');
  const [stateName, setStateName] = useState('');
  const [city, setCity] = useState('');
  const [altitudeM, setAltitudeM] = useState(0);
  const [diet, setDiet] = useState<Diet | ''>('');
  const [skinTone, setSkinTone] = useState<SkinTone | undefined>();
  const [calibrations, setCalibrations] = useState<CalibrationPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingId) return;
    void profileRepo.get(editingId).then((p) => {
      if (!p) return;
      setName(p.name);
      setAge(String(p.ageYears));
      setMonths(p.ageMonths ? String(p.ageMonths) : '');
      setSex(p.sex);
      setPregnant(p.pregnant ? 'yes' : 'no');
      setCountry(p.country ?? 'IN');
      setStateName(p.state ?? '');
      setCity(p.city ?? '');
      setAltitudeM(p.altitudeM ?? 0);
      setDiet(p.diet ?? '');
      setSkinTone(p.skinTone);
      setCalibrations(p.calibrations ?? []);
    });
  }, [editingId]);

  const ageNum = Number(age);
  const showMonths = age !== '' && ageNum < 5;
  const showPregnancy = sex === 'female' && ageNum >= 10 && ageNum <= 55;
  const infant = age !== '' && ageNum === 0 && Number(months || 0) < 6;

  const save = async () => {
    if (age === '' || !Number.isFinite(ageNum) || ageNum < 0 || ageNum > 120)
      return setError(t('profile.errors.age'));
    if (!sex) return setError(t('profile.errors.sex'));
    const data = {
      name: name.trim(),
      ageYears: Math.floor(ageNum),
      ageMonths: showMonths && months ? Math.min(11, Math.max(0, Number(months))) : undefined,
      sex,
      pregnant: showPregnancy && pregnant === 'yes',
      country,
      state: stateName.trim() || undefined,
      city: city.trim() || undefined,
      altitudeM,
      diet: diet || undefined,
      skinTone,
    };
    if (editingId) {
      await profileRepo.update(editingId, data);
      navigate(-1);
    } else {
      const newId = await profileRepo.add(data);
      setSettings({ activeProfileId: newId });
      navigate('/home', { replace: true });
    }
  };

  const remove = async () => {
    if (!editingId || !window.confirm(t('profile.deleteConfirm'))) return;
    await profileRepo.remove(editingId);
    if (useSettings.getState().activeProfileId === editingId) setSettings({ activeProfileId: null });
    navigate('/profiles', { replace: true });
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title={editingId ? t('profile.editTitle') : t('profile.title')}
        subtitle={t('profile.subtitle')}
        back={!!editingId || undefined}
      />
      <Card className="space-y-6">
        <Field label={t('profile.name')} htmlFor="name" hint={t('profile.nameHint')}>
          <input
            id="name"
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('profile.namePlaceholder')}
            autoComplete="off"
            maxLength={40}
          />
        </Field>

        <div className={cn('grid gap-4', showMonths && 'grid-cols-2')}>
          <Field label={t('profile.age')} htmlFor="age">
            <input
              id="age"
              className={inputCls}
              inputMode="numeric"
              type="number"
              min={0}
              max={120}
              value={age}
              onChange={(e) => {
                setAge(e.target.value);
                setError(null);
              }}
              placeholder={t('profile.agePlaceholder')}
            />
          </Field>
          {showMonths && (
            <Field label={t('profile.months')} htmlFor="months">
              <input
                id="months"
                className={inputCls}
                inputMode="numeric"
                type="number"
                min={0}
                max={11}
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                placeholder="0–11"
              />
            </Field>
          )}
        </div>

        {infant && (
          <p className="flex gap-2 rounded-2xl bg-severity-mild/15 p-3 text-sm">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-severity-mild" aria-hidden />
            {t('profile.infantWarning')}
          </p>
        )}

        <Field label={t('profile.sex')}>
          <Segmented
            label={t('profile.sex')}
            value={sex}
            onChange={(v) => {
              setSex(v);
              setError(null);
            }}
            options={[
              { value: 'female', label: t('profile.female') },
              { value: 'male', label: t('profile.male') },
            ]}
          />
        </Field>

        {showPregnancy && (
          <Field label={t('profile.pregnant')} hint={t('profile.pregnantHint')}>
            <Segmented
              label={t('profile.pregnant')}
              value={pregnant}
              onChange={setPregnant}
              options={[
                { value: 'no', label: t('common.no') },
                { value: 'yes', label: t('common.yes') },
              ]}
            />
          </Field>
        )}

        <SectionTitle icon={MapPin}>{t('profile.locationTitle')}</SectionTitle>
        <p className="-mt-3 text-sm text-ink-muted">{t('profile.locationHint')}</p>
        <Field label={t('profile.country')} htmlFor="country">
          <select
            id="country"
            className={inputCls}
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setStateName('');
            }}
          >
            {PRIORITY_COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {countryName(c, i18n.language)}
              </option>
            ))}
            <option disabled>──────────</option>
            {COUNTRY_CODES.filter((c) => !PRIORITY_COUNTRIES.includes(c))
              .map((c) => ({ c, n: countryName(c, i18n.language) }))
              .sort((a, b) => a.n.localeCompare(b.n))
              .map(({ c, n }) => (
                <option key={c} value={c}>
                  {n}
                </option>
              ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('profile.state')} htmlFor="state">
            {country === 'IN' ? (
              <select
                id="state"
                className={inputCls}
                value={stateName}
                onChange={(e) => {
                  setStateName(e.target.value);
                  const def = HILL_STATES[e.target.value];
                  if (def) setAltitudeM(def);
                }}
              >
                <option value="">{t('profile.statePlaceholder')}</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            ) : (
              <input id="state" className={inputCls} value={stateName} onChange={(e) => setStateName(e.target.value)} maxLength={60} />
            )}
          </Field>
          <Field label={t('profile.city')} htmlFor="city">
            <input
              id="city"
              className={inputCls}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t('profile.cityPlaceholder')}
              maxLength={60}
            />
          </Field>
        </div>
        <Field
          label={t('profile.altitude')}
          htmlFor="altitude"
          hint={stateName in HILL_STATES ? t('profile.altitudeHillHint') : t('profile.altitudeHint')}
        >
          <div className="relative">
            <Mountain className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" size={20} aria-hidden />
            <select id="altitude" className={cn(inputCls, 'pl-12')} value={altitudeM} onChange={(e) => setAltitudeM(Number(e.target.value))}>
              {ALTITUDE_BANDS_M.map((m, i) => (
                <option key={m} value={m}>
                  {i === 0
                    ? t('profile.altitudeBelow', { m: ALTITUDE_BANDS_M[1] })
                    : i === ALTITUDE_BANDS_M.length - 1
                      ? t('profile.altitudeAbove', { m })
                      : t('profile.altitudeRange', { from: m, to: ALTITUDE_BANDS_M[i + 1] - 1 })}
                </option>
              ))}
            </select>
          </div>
        </Field>

        <SectionTitle icon={Salad}>{t('profile.diet')}</SectionTitle>
        <div role="radiogroup" aria-label={t('profile.diet')} className="-mt-2 grid grid-cols-2 gap-3">
          {(['vegetarian', 'eggetarian', 'nonVegetarian', 'vegan'] as Diet[]).map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={diet === d}
              onClick={() => setDiet(diet === d ? '' : d)}
              className={cn(
                'min-h-[56px] rounded-2xl border-2 px-3 font-semibold transition',
                diet === d ? 'border-primary bg-primary-light text-primary' : 'border-line bg-surface hover:border-primary/40',
              )}
            >
              {t(`profile.diets.${d}`)}
            </button>
          ))}
        </div>

        <SectionTitle icon={Palette}>{t('profile.skinTone')}</SectionTitle>
        <p className="-mt-3 text-sm text-ink-muted">{t('profile.skinToneWhy')}</p>
        <SkinTonePicker value={skinTone} onChange={setSkinTone} />

        {editingId && (
          <>
            <SectionTitle icon={Droplet}>{t('calibration.title')}</SectionTitle>
            {(() => {
              const po = personalOffset(calibrations);
              return po ? (
                <div className="-mt-2 flex flex-wrap items-center justify-between gap-3">
                  <p>{t('calibration.summary', { offset: (po.offset >= 0 ? '+' : '') + po.offset.toFixed(1), n: po.tests })}</p>
                  <Button
                    size="md"
                    variant="ghost"
                    onClick={async () => {
                      await profileRepo.clearCalibrations(editingId);
                      setCalibrations([]);
                    }}
                  >
                    {t('calibration.clear')}
                  </Button>
                </div>
              ) : (
                <p className="-mt-2 text-sm text-ink-muted">{t('calibration.none')}</p>
              );
            })()}
          </>
        )}

        {error && (
          <p role="alert" className="font-semibold text-severity-severe">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 pt-2">
          <Button fullWidth icon={editingId ? Save : UserPlus} onClick={save}>
            {editingId ? t('common.save') : t('profile.create')}
          </Button>
          {editingId && (
            <Button fullWidth variant="ghost" icon={Trash2} className="text-severity-severe" onClick={remove}>
              {t('profile.delete')}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
