import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor wraps the Vite build (dist/) into the Android APK. All assets —
 * OpenCV.js, MediaPipe WASM + models, TF.js model shards, fonts, demo images —
 * are inside dist/ and therefore bundled in the APK for fully offline use.
 */
const config: CapacitorConfig = {
  appId: 'com.hemoscan.app',
  appName: 'HemoScan',
  webDir: 'dist',
  android: {
    // Needed for getUserMedia in the WebView; content is served from https://localhost.
    allowMixedContent: false,
    backgroundColor: '#FFF8F5',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
