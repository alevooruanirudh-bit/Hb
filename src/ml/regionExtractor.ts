import type { FaceLandmarker, HandLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { appConfig } from '@/config/appConfig';
import { heuristicDetection } from '@/imageProcessing/roiHeuristics';
import { pickPulledEye } from '@/imageProcessing/conjunctiva';
import type { RGBAImage } from '@/imageProcessing/types';
import { assetUrl } from '@/utils/assetUrl';
import type { Box, Region, RegionDetection } from './types';

type Source = HTMLCanvasElement | ImageBitmap | HTMLVideoElement;

// Face-mesh landmark indices: eye corners and lower-lid points.
const EYES = [
  { corners: [33, 133], lowerLid: [145, 153, 144, 163, 7] },
  { corners: [263, 362], lowerLid: [374, 380, 373, 390, 249] },
];
// Hand landmark indices: fingertip / DIP pairs (index → pinky) and palm points.
const NAILS: Array<[number, number]> = [
  [8, 7],
  [12, 11],
  [16, 15],
  [20, 19],
];
const PALM = [0, 5, 9, 13, 17];

const dist = (a: NormalizedLandmark, b: NormalizedLandmark, w: number, h: number) =>
  Math.hypot((a.x - b.x) * w, (a.y - b.y) * h);

/**
 * Locates the region of interest:
 *  - eye   → MediaPipe Face Landmarker → strip under the lower eyelid (palpebral conjunctiva)
 *  - nails → MediaPipe Hand Landmarker → one box per fingernail bed (index–pinky)
 *  - palm  → MediaPipe Hand Landmarker → square at the palm centre
 * Falls back to color / guide-box heuristics for close-up photos where
 * landmarks cannot be found. MediaPipe runs on the main thread (its WASM
 * loader does not support module workers) and is loaded lazily.
 */
export class RegionExtractor {
  private hand: HandLandmarker | null = null;
  private face: FaceLandmarker | null = null;
  private loading: Promise<void> | null = null;
  private failed = false;

  init(): Promise<void> {
    if (this.loading) return this.loading;
    this.loading = (async () => {
      try {
        const vision = await import('@mediapipe/tasks-vision');
        const fileset = await vision.FilesetResolver.forVisionTasks(assetUrl(appConfig.mediapipeWasmPath));
        const [hand, face] = await Promise.all([
          vision.HandLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: assetUrl(appConfig.handLandmarkerModel), delegate: 'CPU' },
            runningMode: 'IMAGE',
            numHands: 1,
          }),
          vision.FaceLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: assetUrl(appConfig.faceLandmarkerModel), delegate: 'CPU' },
            runningMode: 'IMAGE',
            numFaces: 1,
          }),
        ]);
        this.hand = hand;
        this.face = face;
      } catch (e) {
        console.warn('[RegionExtractor] MediaPipe unavailable — using heuristics only', e);
        this.failed = true;
      }
    })();
    return this.loading;
  }

  get landmarksAvailable() {
    return !this.failed && !!this.hand && !!this.face;
  }

  /** Landmark-based detection, or null if landmarks were not found. */
  detectLandmarks(region: Region, source: Source, w: number, h: number): RegionDetection | null {
    try {
      if (region === 'eye') {
        const res = this.face?.detect(source as HTMLCanvasElement);
        const lm = res?.faceLandmarks?.[0];
        if (!lm) return null;
        const boxes: Box[] = EYES.map(({ corners, lowerLid }) => {
          const xs = corners.map((i) => lm[i].x * w);
          const eyeW = Math.abs(xs[0] - xs[1]);
          const lidY = Math.max(...lowerLid.map((i) => lm[i].y * h));
          return { x: Math.min(...xs), y: lidY - eyeW * 0.04, width: eyeW, height: eyeW * 0.28 };
        }).filter((b) => b.width > 12);
        return boxes.length ? { boxes, confidence: 0.9, method: 'landmarks' } : null;
      }

      const res = this.hand?.detect(source as HTMLCanvasElement);
      const lm = res?.landmarks?.[0];
      if (!lm) return null;
      const score = res.handedness?.[0]?.[0]?.score ?? 0.8;
      if (region === 'nails') {
        const boxes = NAILS.map(([tip, dip]) => {
          const t = lm[tip];
          const d = lm[dip];
          const size = dist(t, d, w, h) * 0.95;
          const cx = (t.x + (d.x - t.x) * 0.4) * w;
          const cy = (t.y + (d.y - t.y) * 0.4) * h;
          return { x: cx - size / 2, y: cy - size / 2, width: size, height: size };
        }).filter((b) => b.width > 8);
        return boxes.length ? { boxes, confidence: Math.min(0.95, score), method: 'landmarks' } : null;
      }
      const cx = (PALM.reduce((s, i) => s + lm[i].x, 0) / PALM.length) * w;
      const cy = (PALM.reduce((s, i) => s + lm[i].y, 0) / PALM.length) * h;
      const size = dist(lm[0], lm[9], w, h) * 0.45;
      return {
        boxes: [{ x: cx - size / 2, y: cy - size / 2, width: size, height: size }],
        confidence: Math.min(0.9, score),
        method: 'landmarks',
      };
    } catch (e) {
      console.warn('[RegionExtractor] detection error', e);
      return null;
    }
  }

  /** Landmarks first, then heuristics. Returns null when no region is visible. */
  async detect(region: Region, source: Source, img: RGBAImage): Promise<RegionDetection | null> {
    await this.init();
    const det = this.detectLandmarks(region, source, img.width, img.height) ?? heuristicDetection(region, img);
    // Only the eye whose lower lid is pulled down shows conjunctiva — don't average in the other one.
    if (det && region === 'eye') det.boxes = pickPulledEye(img, det.boxes);
    return det;
  }
}

export const regionExtractor = new RegionExtractor();
