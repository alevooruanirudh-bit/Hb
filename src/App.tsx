import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { AppShell, BareShell } from '@/components/layout/AppShell';
import { useThemeSync } from '@/utils/theme';
import { PulsingDroplet } from '@/components/ui/PulsingDroplet';
import { SplashPage } from '@/pages/SplashPage';
import { LanguagePage } from '@/pages/LanguagePage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { ConsentPage } from '@/pages/ConsentPage';
import { ProfileFormPage } from '@/pages/ProfileFormPage';
import { ProfilesPage } from '@/pages/ProfilesPage';
import { HomePage } from '@/pages/HomePage';
import { RegionSelectPage } from '@/pages/RegionSelectPage';
import { InputMethodPage } from '@/pages/InputMethodPage';
import { RetakePage } from '@/pages/RetakePage';
import { ProcessingPage } from '@/pages/ProcessingPage';
import { ResultsPage } from '@/pages/ResultsPage';
import { QuestionnairePage } from '@/pages/QuestionnairePage';
import { GuidancePage } from '@/pages/GuidancePage';
import { HistoryPage } from '@/pages/HistoryPage';
import { DietTipsPage } from '@/pages/DietTipsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AboutPage } from '@/pages/AboutPage';
import { DemoPage } from '@/pages/DemoPage';

// Camera screen pulls in MediaPipe — load it on demand.
const CapturePage = lazy(() => import('@/pages/CapturePage'));

function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <PulsingDroplet size={64} />
    </div>
  );
}

/**
 * Routes. HashRouter keeps deep links working on static hosting, as an
 * installed PWA and inside the Capacitor WebView without server rewrites.
 */
export function App() {
  useThemeSync();
  return (
    <MotionConfig reducedMotion="user">
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route element={<BareShell />}>
              <Route path="/" element={<SplashPage />} />
              <Route path="/language" element={<LanguagePage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/consent" element={<ConsentPage />} />
              <Route path="/scan/capture" element={<CapturePage />} />
              <Route path="/scan/processing" element={<ProcessingPage />} />
            </Route>
            <Route element={<AppShell />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/profile/new" element={<ProfileFormPage />} />
              <Route path="/profile/:id" element={<ProfileFormPage />} />
              <Route path="/profiles" element={<ProfilesPage />} />
              <Route path="/scan" element={<RegionSelectPage />} />
              <Route path="/scan/method" element={<InputMethodPage />} />
              <Route path="/scan/retake" element={<RetakePage />} />
              <Route path="/scan/results" element={<ResultsPage />} />
              <Route path="/scan/questionnaire" element={<QuestionnairePage />} />
              <Route path="/scan/guidance" element={<GuidancePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/history/:id" element={<ResultsPage />} />
              <Route path="/history/:id/guidance" element={<GuidancePage />} />
              <Route path="/tips" element={<DietTipsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/demo" element={<DemoPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </MotionConfig>
  );
}
