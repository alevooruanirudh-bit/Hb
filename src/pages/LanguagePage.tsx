import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';
import { useSettings, type Language } from '@/store/settingsStore';
import { LANGUAGES } from '@/config/languages';
import { cn } from '@/utils/cn';

/** First-launch language picker: three large cards. */
export function LanguagePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language, set } = useSettings();

  const choose = (code: Language) => {
    set({ language: code, languageChosen: true });
    const s = useSettings.getState();
    navigate(s.onboardingDone ? '/home' : '/onboarding');
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo size={64} />
        <h1 className="mt-4">{t('language.title')}</h1>
        <p className="mt-1 text-ink-muted">Choose language · భాషను ఎంచుకోండి · भाषा चुनें</p>
      </div>
      <div className="flex flex-col gap-4" role="radiogroup" aria-label={t('language.title')}>
        {LANGUAGES.map((l, i) => (
          <motion.button
            key={l.code}
            type="button"
            role="radio"
            aria-checked={language === l.code}
            lang={l.code}
            onClick={() => choose(l.code)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i }}
            className={cn(
              'flex min-h-[88px] items-center gap-4 rounded-card bg-surface px-6 text-left shadow-soft transition hover:shadow-lift',
              language === l.code && 'ring-4 ring-primary/40',
            )}
          >
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-h3 font-bold text-primary"
              aria-hidden
            >
              {l.native.charAt(0)}
            </span>
            <span className="flex-1">
              <span className="block text-h2">{l.native}</span>
              {l.code !== 'en' && <span className="block text-ink-muted">{l.latin}</span>}
            </span>
            {language === l.code && <Check className="text-primary" size={28} aria-hidden />}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
