import { describe, expect, it } from 'vitest';
import { correctionFor, fitDeviceModel, type LearningPair } from './deviceLearning';

const DAY = 86_400_000;
const now = Date.UTC(2026, 9, 5);
const pair = (personId: number, estimate: number, labHb: number, daysApart = 1): LearningPair => ({
  personId,
  estimate,
  labHb,
  scanTime: now - 10 * DAY,
  labDate: now - 10 * DAY + daysApart * DAY,
});

describe('device learning', () => {
  it('waits for enough blood tests from more than one person', () => {
    expect(fitDeviceModel([pair(1, 11, 13), pair(2, 12, 14)], now)).toMatchObject({ active: false, reason: 'fewPairs' });
    const onePerson = [0, 1, 2, 3, 4].map(() => pair(1, 11, 13));
    expect(fitDeviceModel(onePerson, now)).toMatchObject({ active: false, reason: 'fewPeople' });
  });

  it('learns a phone that reads ~2 g/dL low and proves it helps on unseen people', () => {
    const pairs = [10, 11, 11.5, 12, 12.5, 13, 9.5, 11.8].map((e, i) => pair(i + 1, e, e + 2 + (i % 2 ? 0.2 : -0.2)));
    const m = fitDeviceModel(pairs, now);
    expect(m.active).toBe(true);
    expect(m.maeAfter!).toBeLessThan(m.maeBefore!);
    expect(correctionFor(m, 11)).toBeGreaterThan(1.2);
    expect(correctionFor(m, 11)).toBeLessThanOrEqual(3);
  });

  it('stays off when the photo estimates are already right', () => {
    const pairs = [10, 11, 12, 13, 14, 12.5].map((e, i) => pair(i + 1, e, e + (i % 2 ? 0.4 : -0.4)));
    expect(fitDeviceModel(pairs, now)).toMatchObject({ active: false, reason: 'noImprovement' });
  });

  it('ignores blood tests taken more than 7 days from the scan', () => {
    const pairs = [1, 2, 3, 4, 5].map((i) => pair(i, 11, 14, 20));
    expect(fitDeviceModel(pairs, now).pairs).toBe(0);
  });
});
