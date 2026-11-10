import type { TFunction } from 'i18next';
import type { Profile } from '@/db/db';

/** Display name; unnamed profiles get "Person 1", "Person 2"… */
export function profileLabel(p: Profile, index: number, t: TFunction): string {
  return p.name || t('profile.defaultName', { n: index + 1 });
}

/** "32 years · Female · Pregnant" */
export function profileSummary(p: Profile, t: TFunction): string {
  const age =
    p.ageYears < 5 && p.ageMonths
      ? t('profile.ageYearsMonths', { years: p.ageYears, months: p.ageMonths })
      : t('profile.ageYears', { count: p.ageYears });
  return [age, t(`profile.${p.sex}`), p.pregnant ? t('profile.pregnantShort') : null]
    .filter(Boolean)
    .join(' · ');
}

export function formatDate(ts: number, lang: string, withTime = false): string {
  const tag = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
  return new Intl.DateTimeFormat(tag, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(ts);
}
