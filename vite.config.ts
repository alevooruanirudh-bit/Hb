/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

/**
 * Vite configuration.
 *
 * - `base: './'` keeps asset URLs relative so the same build works on a web host
 *   and inside the Capacitor Android WebView.
 * - The PWA service worker precaches the app shell, fonts, OpenCV.js, MediaPipe
 *   WASM + task models, TF.js model shards and demo images so the whole app
 *   (including inference) works offline after the first load.
 */
export default defineConfig({
  base: './',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg', 'icons/*.png'],
      manifest: {
        name: 'HemoScan — Anemia Screening',
        short_name: 'HemoScan',
        description: 'Check your hemoglobin. No needles. (Screening tool, not a diagnosis.)',
        theme_color: '#B23A48',
        background_color: '#FFF8F5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webp,woff2,json,wasm,task,bin}'],
        // OpenCV.js (~10 MB) and MediaPipe task files are large; allow them in the precache.
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
    }),
  ],
  // Only scan the real entry — not the bundled copies inside android/ or dist/.
  // Lazily imported libraries are listed so the dev server pre-bundles them at startup;
  // otherwise it discovers them mid-scan and reloads the page (losing the scan in progress).
  optimizeDeps: {
    entries: ['index.html'],
    include: [
      '@tensorflow/tfjs',
      '@mediapipe/tasks-vision',
      'jspdf',
      '@capacitor/camera',
      '@capacitor/filesystem',
      '@capacitor/share',
    ],
  },
  server: {
    watch: { ignored: ['**/android/**', '**/training/**', '**/dist/**'] },
  },
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2500,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
