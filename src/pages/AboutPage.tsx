import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { Logo } from '@/components/ui/Logo';
import { appConfig } from '@/config/appConfig';

/** About HemoScan + full disclaimer. */
export function AboutPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t('about.title')} back />
      <Card className="flex flex-col items-center text-center">
        <Logo size={80} />
        <h2 className="mt-3 text-h2 text-primary">{t('app.name')}</h2>
        <p className="text-ink-muted">{t('app.tagline')}</p>
        <p className="mt-1 text-sm text-ink-muted">v{appConfig.appVersion}</p>
      </Card>
      <Card className="mt-5 space-y-3">
        <h2 className="text-h3">{t('about.howTitle')}</h2>
        <p>{t('about.how')}</p>
        <h2 className="text-h3">{t('about.privacyTitle')}</h2>
        <p>{t('about.privacy')}</p>
        <h2 className="text-h3">{t('about.limitsTitle')}</h2>
        <p>{t('about.limits')}</p>
      </Card>
      <Disclaimer className="mt-5" />
    </div>
  );
}
