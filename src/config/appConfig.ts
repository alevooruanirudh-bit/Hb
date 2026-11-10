/**
 * Application-level configuration.
 *
 * `VITE_*` variables can be set in `.env` / `.env.local` (see `.env.example`).
 */
const env = import.meta.env;

export const appConfig = {
  appVersion: '1.0.0',

  /**
   * Model toggle. Default `false` → RealModelProvider (trained models; falls back
   * to the mock with a warning if they are not installed). `true` → MockModelProvider
   * (simulated values). Demo-mode sample images always use the mock. Real models load
   * the TF.js CNN from `public/models/cnn/model.json` and the m2cgen tree
   * models from `src/ml/models/`. Can be overridden at runtime in Settings
   * (developer section) — see `useSettings().modelMode`.
   */
  useMockModels: (env.VITE_USE_MOCK_MODELS ?? 'false') === 'true',

  /** Base path of the TF.js CNN feature extractor (relative to the app root). */
  cnnModelUrl: 'models/cnn/model.json',
  /** Model metadata file (version, feature layout). */
  modelInfoUrl: 'models/model-info.json',

  /** MediaPipe assets bundled by scripts/setup-assets.mjs. */
  mediapipeWasmPath: 'mediapipe/wasm',
  handLandmarkerModel: 'mediapipe/models/hand_landmarker.task',
  faceLandmarkerModel: 'mediapipe/models/face_landmarker.task',

  /** OpenCV.js bundled locally (not from a CDN). */
  openCvUrl: 'vendor/opencv/opencv.js',

  /**
   * Optional sync endpoint. Empty by default — no real server is hardcoded.
   * Sync is also OFF by default in Settings and requires explicit consent.
   */
  syncApiBaseUrl: env.VITE_SYNC_API_BASE_URL ?? '',

  /** Target end-to-end processing budget. */
  processingBudgetMs: 10_000,
} as const;
