import type { Language } from '@/store/settingsStore';

/**
 * Rewrites on-screen text into something a text-to-speech voice pronounces well:
 * decimals become words in Hindi/Telugu ("11.5" → "ग्यारह दशमलव पाँच"), the unit is spelled out,
 * the app name is split so it isn't read as one strange word, and dashes/symbols become pauses.
 */

const HI = [
  'शून्य', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस', 'ग्यारह', 'बारह',
  'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस', 'इक्कीस', 'बाईस', 'तेईस',
  'चौबीस', 'पच्चीस',
];
const TE = [
  'సున్నా', 'ఒకటి', 'రెండు', 'మూడు', 'నాలుగు', 'ఐదు', 'ఆరు', 'ఏడు', 'ఎనిమిది', 'తొమ్మిది', 'పది',
  'పదకొండు', 'పన్నెండు', 'పదమూడు', 'పద్నాలుగు', 'పదిహేను', 'పదహారు', 'పదిహేడు', 'పద్దెనిమిది',
  'పందొమ్మిది', 'ఇరవై', 'ఇరవై ఒకటి', 'ఇరవై రెండు', 'ఇరవై మూడు', 'ఇరవై నాలుగు', 'ఇరవై ఐదు',
];
const WORDS: Partial<Record<Language, { n: string[]; point: string }>> = {
  hi: { n: HI, point: 'दशमलव' },
  te: { n: TE, point: 'పాయింట్' },
};

const UNIT: Record<Language, string> = {
  en: 'grams per decilitre',
  hi: 'ग्राम प्रति डेसीलीटर',
  te: 'గ్రాములు ప్రతి డెసిలీటర్',
};

const BRAND: Record<Language, string> = { en: 'Heemo Scan', hi: 'हीमो स्कैन', te: 'హీమో స్కాన్' };
const HB: Record<Language, string> = { en: 'hemoglobin', hi: 'हीमोग्लोबिन', te: 'హిమోగ్లోబిన్' };
const TO: Record<Language, string> = { en: 'to', hi: 'से', te: 'నుండి' };

function numberToWords(num: string, lang: Language): string {
  const w = WORDS[lang];
  if (!w) return num;
  const [int, frac] = num.split('.');
  const i = Number(int);
  if (!Number.isInteger(i) || i < 0 || i >= w.n.length) return num;
  if (!frac) return w.n[i];
  // Digits after the point are read one by one ("11.25" → "eleven point two five").
  return `${w.n[i]} ${w.point} ${[...frac].map((d) => w.n[Number(d)]).join(' ')}`;
}

export function toSpeech(text: string, lang: Language): string {
  return (
    text
      .replace(/\s*g\s*\/\s*dL\b/gi, ` ${UNIT[lang]}`)
      .replace(/HemoScan/g, BRAND[lang])
      .replace(/\bHb\b/g, HB[lang])
      // Number ranges "11.5–13.2" → "11.5 to 13.2".
      .replace(/(\d)\s*[–-]\s*(\d)/g, `$1 ${TO[lang]} $2`)
      .replace(/\d+(?:\.\d+)?/g, (m) => numberToWords(m, lang))
      // Dashes, arrows, bullets and brackets: a short pause instead of "dash"/"arrow".
      .replace(/\s*[—–→•·|]\s*/g, ', ')
      .replace(/[()[\]{}~*_#]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
  );
}

/**
 * Respellings for words a particular voice gets wrong; other voices get the normal spelling.
 * Rishi (macOS en-IN) says "hemoglobin" as "hemaanglabin".
 */
const VOICE_FIXES: Array<{ voice: RegExp; fixes: Array<[RegExp, string]> }> = [
  { voice: /^Rishi\b/i, fixes: [[/\bhemoglobin\b/gi, 'heemo globin']] },
];

export function fixForVoice(text: string, voiceName: string | undefined): string {
  if (!voiceName) return text;
  return VOICE_FIXES.filter((f) => f.voice.test(voiceName)).reduce(
    (s, f) => f.fixes.reduce((acc, [re, to]) => acc.replace(re, to), s),
    text,
  );
}
