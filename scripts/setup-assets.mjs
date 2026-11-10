/**
 * Copies / downloads the runtime assets HemoScan needs to work fully offline:
 *
 *  - OpenCV.js            node_modules/@techstark/opencv-js/dist/opencv.js -> public/vendor/opencv/opencv.js
 *  - MediaPipe WASM       node_modules/@mediapipe/tasks-vision/wasm/*      -> public/mediapipe/wasm/
 *  - MediaPipe models     hand_landmarker.task, face_landmarker.task       -> public/mediapipe/models/
 *
 * Runs automatically after `npm install`. The model download is the only step
 * that needs internet; once the files exist they are bundled into the web build
 * and the Android APK, and cached by the service worker.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

function copyOpenCv() {
  const src = join(root, 'node_modules/@techstark/opencv-js/dist/opencv.js');
  const destDir = join(pub, 'vendor/opencv');
  ensureDir(destDir);
  if (!existsSync(src)) {
    console.warn(
      '[setup-assets] OpenCV.js not found in node_modules — the app will use the pure-JS image backend.',
    );
    return;
  }
  copyFileSync(src, join(destDir, 'opencv.js'));
  console.log('[setup-assets] OpenCV.js copied');
}

function copyMediaPipeWasm() {
  const srcDir = join(root, 'node_modules/@mediapipe/tasks-vision/wasm');
  const destDir = join(pub, 'mediapipe/wasm');
  ensureDir(destDir);
  if (!existsSync(srcDir)) {
    console.warn('[setup-assets] MediaPipe wasm folder not found.');
    return;
  }
  for (const f of readdirSync(srcDir)) copyFileSync(join(srcDir, f), join(destDir, f));
  console.log('[setup-assets] MediaPipe WASM copied');
}

const MODELS = {
  'hand_landmarker.task':
    'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  'face_landmarker.task':
    'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
};

async function downloadMediaPipeModels() {
  const destDir = join(pub, 'mediapipe/models');
  ensureDir(destDir);
  for (const [name, url] of Object.entries(MODELS)) {
    const dest = join(destDir, name);
    if (existsSync(dest) && statSync(dest).size > 100_000) continue;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      console.log(`[setup-assets] downloaded ${name}`);
    } catch (err) {
      console.warn(
        `[setup-assets] could not download ${name} (${err.message}). ` +
          'Region detection will fall back to guide-box cropping. Re-run `npm run setup-assets` when online.',
      );
    }
  }
}

copyOpenCv();
copyMediaPipeWasm();
await downloadMediaPipeModels();
