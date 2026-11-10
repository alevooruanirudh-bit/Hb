import type { Language } from '@/store/settingsStore';

// macOS novelty and "Eloquence" voices: robotic, poor pronunciation — never picked automatically.
const POOR =
  /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Ralph|Kathy|Grandma|Grandpa|Rocko|Eddy|Flo|Reed|Sandy|Shelley)\b/i;

// Same tags as i18n `localeTags` (kept local so this module has no i18n/DOM side effects).
const localeTags: Record<Language, string> = { en: 'en-IN', te: 'te-IN', hi: 'hi-IN' };

const norm = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace('_', '-');

/** Voices that speak `lang` (any region), excluding novelty voices. */
export function voicesFor(voices: SpeechSynthesisVoice[], lang: Language): SpeechSynthesisVoice[] {
  return voices.filter((v) => norm(v).startsWith(lang) && !POOR.test(v.name));
}

/**
 * Quality score — natural/neural voices (Edge "Online (Natural)", macOS Premium/Enhanced,
 * Chrome's Google voices) pronounce Indian languages far better than the basic built-in ones.
 * Online voices need internet, so they are skipped when offline.
 */
export function voiceScore(v: SpeechSynthesisVoice, lang: Language, online: boolean): number {
  let s = 0;
  if (!v.localService && !online) return -1000;
  if (/natural|neural|premium|enhanced|wavenet/i.test(v.name)) s += 60;
  else if (/google/i.test(v.name)) s += 45;
  if (norm(v) === localeTags[lang].toLowerCase()) s += 20; // en-IN / hi-IN / te-IN
  else if (lang === 'en' && /^en-(gb|us)/.test(norm(v))) s += 8;
  if (v.default) s += 2;
  return s;
}

/** Best voice for the language, or the user's chosen voice if it is still installed. */
export function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: Language,
  preferredName?: string,
  online = typeof navigator === 'undefined' || navigator.onLine !== false,
): SpeechSynthesisVoice | undefined {
  const list = voicesFor(voices, lang);
  const chosen = preferredName && list.find((v) => v.name === preferredName);
  if (chosen && (chosen.localService || online)) return chosen;
  return [...list].sort((a, b) => voiceScore(b, lang, online) - voiceScore(a, lang, online))[0];
}
