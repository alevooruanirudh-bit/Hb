import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { localeTags } from '@/i18n';
import { useSettings, type Language } from '@/store/settingsStore';
import { fixForVoice, toSpeech } from './speechText';
import { pickVoice } from './voiceSelect';

const isNative = Capacitor.isNativePlatform();

/** Outcome of a speak() call — shown by Settings → "Test voice" to diagnose silence. */
export type SpeakResult =
  | { ok: true; voice: string; lang: string; fellBackToEnglish: boolean }
  | { ok: false; reason: 'unsupported' | 'noVoice' | 'error' | 'timeout'; detail?: string };

/** Voices load asynchronously in Chrome — wait for them (max ~1.5 s). */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const v = speechSynthesis.getVoices();
    if (v.length) return resolve(v);
    const done = () => resolve(speechSynthesis.getVoices());
    speechSynthesis.addEventListener?.('voiceschanged', done, { once: true });
    setTimeout(done, 1500);
  });
}

// Chrome garbage-collects utterances mid-sentence unless a reference is kept until they end.
const liveUtterances = new Set<SpeechSynthesisUtterance>();

function webSpeak(text: string, voice: SpeechSynthesisVoice | undefined, lang: string, rate: number): Promise<SpeakResult> {
  return new Promise((resolve) => {
    const synth = speechSynthesis;
    // Only cancel if something is playing: cancel() immediately followed by speak() makes
    // Chrome silently drop the new utterance.
    if (synth.speaking || synth.pending) synth.cancel();
    setTimeout(() => {
      synth.resume(); // Chrome can be stuck in a paused state
      const u = new SpeechSynthesisUtterance(fixForVoice(text, voice?.name));
      if (voice) u.voice = voice;
      u.lang = voice?.lang ?? lang;
      u.rate = rate;
      u.volume = 1;
      let settled = false;
      const finish = (r: SpeakResult) => {
        if (!settled) {
          settled = true;
          resolve(r);
        }
      };
      u.onstart = () => finish({ ok: true, voice: voice?.name ?? '(browser default)', lang: u.lang, fellBackToEnglish: false });
      u.onerror = (e) => {
        liveUtterances.delete(u);
        finish({ ok: false, reason: 'error', detail: e.error });
      };
      u.onend = () => liveUtterances.delete(u);
      liveUtterances.add(u);
      synth.speak(u);
      // Online (natural) voices can take a moment to start.
      setTimeout(() => finish({ ok: false, reason: 'timeout', detail: 'speech did not start within 6 s' }), 6000);
    }, 80);
  });
}

/**
 * Voice guidance (capture instructions, result summary).
 *
 *  - Android APK: the phone's text-to-speech engine (@capacitor-community/text-to-speech) —
 *    the Android WebView has no Web Speech API.
 *  - Browsers: the Web Speech API, with the usual Chrome workarounds (wait for voices, no
 *    cancel-then-speak race, keep the utterance referenced).
 *  - If the selected language has no voice (e.g. Telugu on a Mac), the English version of the
 *    same sentence is spoken instead of staying silent (pass `englishText`).
 */
export function useVoice() {
  const { i18n, t } = useTranslation();
  const enabled = useSettings((s) => s.voiceEnabled);
  const voiceNames = useSettings((s) => s.voiceNames);
  const rate = useSettings((s) => s.voiceRate);
  const lang = (i18n.language as Language) ?? 'en';
  const [voiceAvailable, setVoiceAvailable] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (isNative) {
        try {
          const { languages } = await TextToSpeech.getSupportedLanguages();
          const tag = localeTags[lang].toLowerCase();
          const ok = languages.some((l) => l.toLowerCase().replace('_', '-') === tag || l.toLowerCase().startsWith(lang));
          if (alive) setVoiceAvailable(ok);
        } catch {
          if (alive) setVoiceAvailable(false);
        }
      } else if (typeof speechSynthesis !== 'undefined') {
        const voices = await loadVoices();
        if (alive) setVoiceAvailable(!!pickVoice(voices, lang));
      } else if (alive) setVoiceAvailable(false);
    })();
    return () => {
      alive = false;
    };
  }, [lang]);

  /**
   * Speaks `text` in the app language. `force` speaks even when voice guidance is off
   * (the "Read aloud" / "Test voice" buttons). `englishText` is used when no voice exists
   * for the app language.
   */
  const speak = useCallback(
    async (text: string, opts: { force?: boolean; englishText?: string } = {}): Promise<SpeakResult> => {
      if (!enabled && !opts.force) return { ok: false, reason: 'noVoice', detail: 'voice guidance is off' };
      const tag = localeTags[lang];

      if (isNative) {
        try {
          await TextToSpeech.stop().catch(() => undefined);
          let speakLang = tag;
          let speakText = toSpeech(text, lang);
          let fell = false;
          if (!voiceAvailable && opts.englishText && lang !== 'en') {
            speakLang = localeTags.en;
            speakText = toSpeech(opts.englishText, 'en');
            fell = true;
          }
          void TextToSpeech.speak({ text: speakText, lang: speakLang, rate, pitch: 1.0, volume: 1.0, category: 'playback' });
          return { ok: true, voice: 'Android text-to-speech', lang: speakLang, fellBackToEnglish: fell };
        } catch (e) {
          return { ok: false, reason: 'error', detail: String(e) };
        }
      }

      if (typeof speechSynthesis === 'undefined') return { ok: false, reason: 'unsupported' };
      const voices = await loadVoices();
      const voice = pickVoice(voices, lang, voiceNames[lang]);
      if (voice) return webSpeak(toSpeech(text, lang), voice, tag, rate);
      // No voice for this language in this browser → speak the English sentence instead.
      if (opts.englishText && lang !== 'en') {
        const r = await webSpeak(toSpeech(opts.englishText, 'en'), pickVoice(voices, 'en', voiceNames.en), localeTags.en, rate);
        return r.ok ? { ...r, fellBackToEnglish: true } : r;
      }
      if (!voices.length) return webSpeak(toSpeech(text, lang), undefined, tag, rate); // let the browser try its default
      return { ok: false, reason: 'noVoice', detail: `no ${tag} voice in this browser` };
    },
    [enabled, lang, voiceAvailable, voiceNames, rate],
  );

  /** Speaks a translation key in the app language, with the English version as fallback. */
  const speakKey = useCallback(
    (key: string, params: Record<string, unknown> = {}, opts: { force?: boolean } = {}) =>
      speak(t(key, params), { ...opts, englishText: t(key, { ...params, lng: 'en' }) }),
    [speak, t],
  );

  const stop = useCallback(() => {
    if (isNative) void TextToSpeech.stop().catch(() => undefined);
    else if (typeof speechSynthesis !== 'undefined' && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel();
  }, []);

  useEffect(() => stop, [stop]);

  return { speak, speakKey, stop, enabled, voiceAvailable };
}
