import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'te' | 'hi';
export type ThemeMode = 'system' | 'light' | 'dark';
/** `auto` follows appConfig.useMockModels; the others force a provider. */
export type ModelMode = 'auto' | 'mock' | 'real';

interface SettingsState {
  language: Language;
  languageChosen: boolean;
  onboardingDone: boolean;
  consentGiven: boolean;
  theme: ThemeMode;
  voiceEnabled: boolean;
  /** Chosen voice name per language (browser only); missing = pick the best automatically. */
  voiceNames: Partial<Record<Language, string>>;
  /** Speaking speed: 0.75 (slow) … 1.1 (fast). */
  voiceRate: number;
  /** Optional background sync — OFF by default and requires explicit consent. */
  syncEnabled: boolean;
  /** Opt-in: keep anonymized ROI crops + features for model improvement. */
  dataContribution: boolean;
  demoMode: boolean;
  modelMode: ModelMode;
  activeProfileId: number | null;
  set: (patch: Partial<Omit<SettingsState, 'set' | 'reset'>>) => void;
  reset: () => void;
}

const defaults = {
  language: 'en' as Language,
  languageChosen: false,
  onboardingDone: false,
  consentGiven: false,
  theme: 'system' as ThemeMode,
  voiceEnabled: true,
  voiceNames: {} as Partial<Record<Language, string>>,
  voiceRate: 0.9,
  syncEnabled: false,
  dataContribution: false,
  demoMode: false,
  modelMode: 'auto' as ModelMode,
  activeProfileId: null,
};

/** User preferences, persisted to localStorage (key `hemoscan-settings`). */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      set: (patch) => set(patch),
      reset: () => set(defaults),
    }),
    { name: 'hemoscan-settings', version: 1 },
  ),
);
