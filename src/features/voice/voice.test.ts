import { describe, expect, it } from 'vitest';
import { fixForVoice, toSpeech } from './speechText';
import { pickVoice } from './voiceSelect';

const v = (name: string, lang: string, localService = true) => ({ name, lang, localService, default: false, voiceURI: name }) as SpeechSynthesisVoice;

describe('toSpeech', () => {
  it('reads decimals as words in Hindi and Telugu, and spells out the unit', () => {
    expect(toSpeech('11.5 से 13.2 g/dL', 'hi')).toBe('ग्यारह दशमलव पाँच से तेरह दशमलव दो ग्राम प्रति डेसीलीटर');
    expect(toSpeech('11.5 నుండి 13.2 g/dL', 'te')).toBe('పదకొండు పాయింట్ ఐదు నుండి పదమూడు పాయింట్ రెండు గ్రాములు ప్రతి డెసిలీటర్');
    expect(toSpeech('between 11.5 and 13.2 g/dL.', 'en')).toBe('between 11.5 and 13.2 grams per decilitre.');
  });

  it('splits the app name and turns dashes into pauses', () => {
    expect(toSpeech('This is HemoScan — hold steady', 'en')).toBe('This is Heemo Scan, hold steady');
  });
});

describe('fixForVoice', () => {
  it('respells hemoglobin only for Rishi', () => {
    expect(fixForVoice('Your hemoglobin is 12', 'Rishi')).toBe('Your heemo globin is 12');
    expect(fixForVoice('Your hemoglobin is 12', 'Samantha')).toBe('Your hemoglobin is 12');
  });
});

describe('pickVoice', () => {
  const voices = [v('Albert', 'en-US'), v('Rishi', 'en-IN'), v('Google हिन्दी', 'hi-IN', false), v('Lekha', 'hi-IN'), v('Microsoft Neerja Online (Natural) - English (India)', 'en-IN', false)];

  it('prefers natural/online voices when online and never novelty voices', () => {
    expect(pickVoice(voices, 'en', undefined, true)?.name).toMatch(/Neerja/);
    expect(pickVoice(voices, 'hi', undefined, true)?.name).toBe('Google हिन्दी');
  });

  it('falls back to installed voices offline and honours the user choice', () => {
    expect(pickVoice(voices, 'hi', undefined, false)?.name).toBe('Lekha');
    expect(pickVoice(voices, 'en', 'Rishi', true)?.name).toBe('Rishi');
    expect(pickVoice([v('Albert', 'en-US')], 'en')).toBeUndefined();
  });
});
