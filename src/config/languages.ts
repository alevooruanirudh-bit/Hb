import type { Language } from '@/store/settingsStore';

/** Each language is shown in its own script so users can recognise it without reading English. */
export const LANGUAGES: Array<{ code: Language; native: string; latin: string }> = [
  { code: 'en', native: 'English', latin: 'English' },
  { code: 'te', native: 'తెలుగు', latin: 'Telugu' },
  { code: 'hi', native: 'हिंदी', latin: 'Hindi' },
];
