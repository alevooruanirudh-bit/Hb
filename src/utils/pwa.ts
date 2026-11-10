import { Capacitor } from '@capacitor/core';

/**
 * Registers the service worker (vite-plugin-pwa) for offline use on the web.
 * Skipped inside the Capacitor app, where all assets are already bundled in the APK.
 */
export function registerServiceWorker() {
  if (Capacitor.isNativePlatform() || !('serviceWorker' in navigator) || import.meta.env.DEV) return;
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
}
