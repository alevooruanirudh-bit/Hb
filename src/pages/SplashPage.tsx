import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';
import { useSettings } from '@/store/settingsStore';
import { db } from '@/db/db';

/** Splash: animated droplet, then routes to the first unfinished setup step. */
export function SplashPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(async () => {
      const s = useSettings.getState();
      const count = await db.profiles.count().catch(() => 0);
      if (!s.languageChosen) navigate('/language', { replace: true });
      else if (!s.onboardingDone) navigate('/onboarding', { replace: true });
      else if (!s.consentGiven) navigate('/consent', { replace: true });
      else if (count === 0) navigate('/profile/new', { replace: true });
      else navigate('/home', { replace: true });
    }, 1800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-primary-light to-background px-6 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0, y: -30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 12 }}
      >
        <Logo size={128} animated />
      </motion.div>
      <motion.h1
        className="mt-6 text-[2.5rem] font-extrabold text-primary"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        {t('app.name')}
      </motion.h1>
      <motion.p
        className="mt-2 text-h3 font-medium text-ink-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
      >
        {t('app.tagline')}
      </motion.p>
    </div>
  );
}
