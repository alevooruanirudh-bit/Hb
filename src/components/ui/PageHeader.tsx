import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Show a back button. Pass a path to go somewhere specific, `true` for history back. */
  back?: boolean | string;
  action?: ReactNode;
}

/** Consistent page title block with optional back navigation. */
export function PageHeader({ title, subtitle, back, action }: PageHeaderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <header className="mb-5 flex items-start gap-3 md:mb-8">
      {back && (
        <button
          type="button"
          onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
          className="-ml-2 flex min-h-touch min-w-touch items-center justify-center rounded-full text-ink hover:bg-ink/5"
          aria-label={t('common.back')}
        >
          <ArrowLeft size={26} aria-hidden />
        </button>
      )}
      <div className="min-w-0 flex-1 pt-1.5">
        <h1 className="text-h2 md:text-h1">{title}</h1>
        {subtitle && <p className="mt-1 text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
