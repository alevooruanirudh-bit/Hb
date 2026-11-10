import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from './locales/en/common.json';
import enGuidance from './locales/en/guidance.json';
import teCommon from './locales/te/common.json';
import teGuidance from './locales/te/guidance.json';
import hiCommon from './locales/hi/common.json';
import hiGuidance from './locales/hi/guidance.json';
import { useSettings } from '@/store/settingsStore';

/**
 * i18next setup. All three languages are bundled (small JSON) so switching is
 * instant and works offline. Namespaces: `common` (UI) and `guidance`
 * (health content used by the GuidanceEngine).
 */
export const resources = {
  en: { common: enCommon, guidance: enGuidance },
  te: { common: teCommon, guidance: teGuidance },
  hi: { common: hiCommon, guidance: hiGuidance },
} as const;

/** BCP-47 tags for speech synthesis and date formatting. */
export const localeTags = { en: 'en-IN', te: 'te-IN', hi: 'hi-IN' } as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: useSettings.getState().language,
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common', 'guidance'],
  interpolation: { escapeValue: false },
  returnNull: false,
});

// Keep i18n and <html lang> in sync with the persisted setting.
const applyLang = (lng: string) => {
  if (i18n.language !== lng) void i18n.changeLanguage(lng);
  document.documentElement.lang = lng;
};
applyLang(useSettings.getState().language);
useSettings.subscribe((s) => applyLang(s.language));

export default i18n;
