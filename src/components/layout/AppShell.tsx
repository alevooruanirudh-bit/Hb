import { NavLink, useLocation, useOutlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { History, Home, Leaf, ScanLine, Settings } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/utils/cn';
import { useSettings } from '@/store/settingsStore';
import { Badge } from '@/components/ui/Badge';

const NAV = [
  { to: '/home', icon: Home, key: 'nav.home' },
  { to: '/scan', icon: ScanLine, key: 'nav.scan' },
  { to: '/history', icon: History, key: 'nav.history' },
  { to: '/tips', icon: Leaf, key: 'nav.tips' },
  { to: '/settings', icon: Settings, key: 'nav.settings' },
] as const;

/**
 * Responsive shell:
 *  - mobile: single column + bottom navigation bar
 *  - desktop/laptop (md+): left side navigation panel + centered wide content
 *    (projector friendly)
 */
export function AppShell() {
  const { t } = useTranslation();
  const location = useLocation();
  // Freeze the outlet element so the exiting page animates out with its own content.
  const outlet = useOutlet();
  const demoMode = useSettings((s) => s.demoMode);

  return (
    <div className="min-h-dvh md:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:p-3"
      >
        {t('common.skipToContent')}
      </a>

      {/* Side navigation (desktop) */}
      <aside
        className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-line bg-surface px-5 py-8 md:flex"
        aria-label={t('nav.label')}
      >
        <div className="mb-10 flex items-center gap-3 px-2">
          <Logo size={44} />
          <div>
            <div className="text-h3 font-bold text-primary">{t('app.name')}</div>
            <div className="text-sm text-ink-muted">{t('app.taglineShort')}</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1.5">
          {NAV.map(({ to, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/scan'}
              className={({ isActive }) =>
                cn(
                  'flex min-h-[52px] items-center gap-3 rounded-2xl px-4 text-lg font-semibold transition',
                  isActive ? 'bg-primary-light text-primary' : 'text-ink-muted hover:bg-ink/5 hover:text-ink',
                )
              }
            >
              <Icon size={24} aria-hidden />
              {t(key)}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-3 px-2 text-sm text-ink-muted">
          {demoMode && <Badge tone="demo">{t('demo.badge')}</Badge>}
          <p>{t('app.disclaimerShort')}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main
          id="main"
          className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 safe-top md:px-10 md:pb-12 md:pt-10"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom navigation (mobile) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface/95 backdrop-blur safe-bottom md:hidden"
        aria-label={t('nav.label')}
      >
        {NAV.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/scan'}
            className={({ isActive }) =>
              cn(
                'flex min-h-[64px] flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold',
                isActive ? 'text-primary' : 'text-ink-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex h-8 w-14 items-center justify-center rounded-pill transition',
                    isActive && 'bg-primary-light',
                  )}
                >
                  <Icon size={22} aria-hidden />
                </span>
                {t(key)}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

/** Full-screen layout without navigation (onboarding, capture, processing). */
export function BareShell() {
  const location = useLocation();
  const outlet = useOutlet();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="min-h-dvh"
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
