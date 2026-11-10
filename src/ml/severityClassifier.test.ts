import { describe, expect, it } from 'vitest';
import { SeverityClassifier } from './severityClassifier';
import type { ClassificationSubject } from './types';

const c = new SeverityClassifier();
const s = (ageYears: number, sex: 'female' | 'male', pregnant = false): ClassificationSubject => ({
  ageYears,
  sex,
  pregnant,
});

describe('SeverityClassifier — group selection', () => {
  it.each([
    [s(2, 'male'), 'child_6_59m'],
    [s(4.9, 'female'), 'child_6_59m'],
    [s(5, 'female'), 'child_5_11y'],
    [s(11.9, 'male'), 'child_5_11y'],
    [s(12, 'male'), 'child_12_14y'],
    [s(14, 'female'), 'child_12_14y'],
    [s(15, 'female'), 'women_15plus'],
    [s(45, 'female'), 'women_15plus'],
    [s(15, 'male'), 'men_15plus'],
    [s(70, 'male'), 'men_15plus'],
    [s(26, 'female', true), 'pregnant'],
    [s(14, 'female', true), 'pregnant'],
  ])('%o → %s', (subject, key) => {
    expect(c.selectGroup(subject).key).toBe(key);
  });

  it('ignores the pregnancy flag for males', () => {
    expect(c.selectGroup(s(30, 'male', true)).key).toBe('men_15plus');
  });
});

describe('SeverityClassifier — WHO bands', () => {
  const cases: Array<[ClassificationSubject, number, string]> = [
    // Children 6–59 months: ≥11 normal, 10–10.9 mild, 7–9.9 moderate, <7 severe
    [s(3, 'male'), 11.0, 'normal'],
    [s(3, 'male'), 10.9, 'mild'],
    [s(3, 'male'), 10.0, 'mild'],
    [s(3, 'male'), 9.9, 'moderate'],
    [s(3, 'male'), 7.0, 'moderate'],
    [s(3, 'male'), 6.9, 'severe'],
    // Children 5–11: ≥11.5, 11–11.4, 8–10.9, <8
    [s(8, 'female'), 11.5, 'normal'],
    [s(8, 'female'), 11.4, 'mild'],
    [s(8, 'female'), 11.0, 'mild'],
    [s(8, 'female'), 10.9, 'moderate'],
    [s(8, 'female'), 7.9, 'severe'],
    // Children 12–14: ≥12, 11–11.9, 8–10.9, <8
    [s(13, 'male'), 12.0, 'normal'],
    [s(13, 'male'), 11.9, 'mild'],
    [s(13, 'male'), 8.0, 'moderate'],
    [s(13, 'male'), 7.9, 'severe'],
    // Non-pregnant women: ≥12, 11–11.9, 8–10.9, <8
    [s(30, 'female'), 12.0, 'normal'],
    [s(30, 'female'), 11.9, 'mild'],
    [s(30, 'female'), 10.9, 'moderate'],
    [s(30, 'female'), 7.9, 'severe'],
    // Pregnant: ≥11, 10–10.9, 7–9.9, <7
    [s(30, 'female', true), 11.0, 'normal'],
    [s(30, 'female', true), 10.5, 'mild'],
    [s(30, 'female', true), 9.9, 'moderate'],
    [s(30, 'female', true), 6.9, 'severe'],
    // Men: ≥13, 11–12.9, 8–10.9, <8
    [s(40, 'male'), 13.0, 'normal'],
    [s(40, 'male'), 12.9, 'mild'],
    [s(40, 'male'), 11.0, 'mild'],
    [s(40, 'male'), 10.9, 'moderate'],
    [s(40, 'male'), 7.9, 'severe'],
  ];

  it.each(cases)('%o with Hb %s → %s', (subject, hb, expected) => {
    const r = c.classify(hb, subject);
    expect(r.severity).toBe(expected);
    expect(r.anemia).toBe(expected !== 'normal');
  });

  it('rounds to 0.1 g/dL before comparing (12.96 → 13.0 normal for men)', () => {
    expect(c.classify(12.96, s(40, 'male')).severity).toBe('normal');
    expect(c.classify(12.94, s(40, 'male')).severity).toBe('mild');
  });

  it('supports custom threshold configs', () => {
    const custom = new SeverityClassifier({
      version: 't',
      groups: { all: { minAge: 0, maxAge: 200, normal: 10, mild: 9, moderate: 5 } },
    });
    expect(custom.classify(9.5, s(30, 'male')).severity).toBe('mild');
  });
});
