import { describe, expect, it } from 'vitest';
import { GuidanceEngine } from './guidanceEngine';
import en from '@/i18n/locales/en/guidance.json';
import te from '@/i18n/locales/te/guidance.json';
import hi from '@/i18n/locales/hi/guidance.json';

const engine = new GuidanceEngine();

describe('GuidanceEngine', () => {
  it('gives maintenance advice and no referral for normal results', () => {
    const p = engine.build('normal', {});
    expect(p.referral).toBe('none');
    expect(p.causes).toEqual([]);
    expect(p.actions).toContain('keepHealthyDiet');
    expect(p.actions).toContain('recheckYearly');
  });

  it.each([
    ['mild', 'routine'],
    ['moderate', 'soon'],
    ['severe', 'urgent'],
  ] as const)('%s anemia → %s referral', (sev, ref) => {
    expect(engine.build(sev, {}).referral).toBe(ref);
  });

  it('always lists iron deficiency and resources when anemic', () => {
    const p = engine.build('mild', {});
    expect(p.causes[0]).toBe('ironDeficiency');
    expect(p.showResources).toBe(true);
    expect(p.actions).toEqual(
      expect.arrayContaining(['ironRichFoods', 'vitaminC', 'ifaTablets', 'confirmBloodTest']),
    );
  });

  it('puts recent blood loss first and escalates referral', () => {
    const p = engine.build('mild', { bloodLoss: 'yes' });
    expect(p.causes[0]).toBe('bloodLoss');
    expect(p.referral).toBe('soon');
  });

  it('maps questionnaire answers to causes and actions', () => {
    const p = engine.build('moderate', {
      vegetarian: 'yes',
      teaWithMeals: 'yes',
      noRecentDeworming: 'yes',
      heavyPeriods: 'yes',
    });
    expect(p.causes).toEqual(
      expect.arrayContaining([
        'lowIronDiet',
        'b12Folate',
        'poorAbsorption',
        'worms',
        'menstrualLoss',
        'otherConditions',
      ]),
    );
    expect(p.actions[0]).toBe('avoidTeaWithMeals');
    expect(p.actions).toEqual(expect.arrayContaining(['b12Foods', 'deworming']));
  });

  it('skips deworming advice if dewormed recently', () => {
    expect(engine.build('mild', { noRecentDeworming: 'no' }).actions).not.toContain('deworming');
  });

  it('escalates pregnant users and adds pregnancy care', () => {
    const p = engine.build('mild', {}, { sex: 'female', pregnant: true, ageYears: 25 });
    expect(p.referral).toBe('soon');
    expect(p.causes).toContain('pregnancyDemand');
    expect(p.actions).toContain('pregnancyCare');
  });

  it('puts blood test first for severe anemia and warns about symptoms', () => {
    const p = engine.build('severe', { dizzy: 'yes' });
    expect(p.actions[0]).toBe('confirmBloodTest');
    expect(p.symptomWarning).toBe(true);
  });

  it('never returns duplicates', () => {
    const p = engine.build('severe', {
      vegetarian: 'yes',
      teaWithMeals: 'yes',
      pregnant: 'yes',
      tired: 'yes',
    });
    expect(new Set(p.causes).size).toBe(p.causes.length);
    expect(new Set(p.actions).size).toBe(p.actions.length);
  });

  it('has localized content for every cause and action in all languages', () => {
    const all = [
      engine.build('severe', {
        vegetarian: 'yes',
        teaWithMeals: 'yes',
        pregnant: 'yes',
        tired: 'yes',
        bloodLoss: 'yes',
        heavyPeriods: 'yes',
        noRecentDeworming: 'yes',
      }),
      engine.build('normal', {}),
    ];
    for (const locale of [en, te, hi] as unknown as Array<
      Record<string, Record<string, { title: string; body: string }>>
    >) {
      for (const p of all) {
        for (const c of p.causes) expect(locale.causes[c]?.title, c).toBeTruthy();
        for (const a of p.actions) expect(locale.actions[a]?.title, a).toBeTruthy();
      }
    }
  });
});
