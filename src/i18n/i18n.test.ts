import { describe, expect, it } from 'vitest';
import enCommon from './locales/en/common.json';
import teCommon from './locales/te/common.json';
import hiCommon from './locales/hi/common.json';
import enGuidance from './locales/en/guidance.json';
import teGuidance from './locales/te/guidance.json';
import hiGuidance from './locales/hi/guidance.json';

function flatten(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix];
  return Object.entries(obj).flatMap(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k));
}

describe('translations', () => {
  it.each([
    ['te common', enCommon, teCommon],
    ['hi common', enCommon, hiCommon],
    ['te guidance', enGuidance, teGuidance],
    ['hi guidance', enGuidance, hiGuidance],
  ])('%s has exactly the same keys as English', (_, en, other) => {
    expect(flatten(other).sort()).toEqual(flatten(en).sort());
  });
});
