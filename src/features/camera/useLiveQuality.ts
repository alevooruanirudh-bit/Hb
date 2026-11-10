import { useEffect, useRef, useState, type RefObject } from 'react';
import { qualityConfig } from '@/config/pipelineConfig';
import { JsOps } from '@/imageProcessing/jsOps';
import { QualityChecker } from '@/imageProcessing/qualityChecker';
import { guideBoxPx, reddestWindow, skinFraction } from '@/imageProcessing/roiHeuristics';
import { regionExtractor } from '@/ml/regionExtractor';
import type { Region } from '@/ml/types';

export type PillState = 'ok' | 'warn' | 'pending';

export interface LiveQuality {
  focus: PillState;
  lighting: PillState;
  position: PillState;
  allOk: boolean;
  hint: 'blurry' | 'tooDark' | 'tooBright' | 'noRegion' | null;
}

const FRAME_W = 240;
const INTERVAL_MS = 450;
// Live frames are small; sharpness is judged relative to this preview size.
const checker = new QualityChecker(new JsOps(), {
  blurFailThreshold: qualityConfig.blurFailThreshold * 0.9,
  minSide: 60,
});

/**
 * Samples the camera preview a few times per second on a tiny canvas and
 * computes the three live indicators:
 *   Focus    — Laplacian variance
 *   Lighting — mean brightness / clipping
 *   Position — hand landmarks (nails/palm) or eyelid redness inside the guide (eye)
 * Cheap enough for low-end phones (≈40k pixels per sample).
 */
export function useLiveQuality(
  videoRef: RefObject<HTMLVideoElement | null>,
  region: Region,
  active: boolean,
): LiveQuality {
  const [state, setState] = useState<LiveQuality>({
    focus: 'pending',
    lighting: 'pending',
    position: 'pending',
    allOk: false,
    hint: null,
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tick = useRef(0);

  useEffect(() => {
    if (!active) return;
    void regionExtractor.init();
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
    const canvas = canvasRef.current;
    let lastPositionOk = false;

    const id = window.setInterval(() => {
      const video = videoRef.current;
      if (!video || !video.videoWidth) return;
      const w = FRAME_W;
      const h = Math.round((video.videoHeight / video.videoWidth) * w);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(video, 0, 0, w, h);
      const img = ctx.getImageData(0, 0, w, h);
      const frame = { width: w, height: h, data: img.data };

      const q = checker.check(frame);
      const focusOk = !q.reasons.includes('blurry');
      const lightOk =
        !q.reasons.some((r) => r === 'tooDark' || r === 'tooBright') || q.status === 'borderline';

      // Position is more expensive → evaluate every other tick.
      tick.current++;
      if (tick.current % 2 === 0) {
        const guide = guideBoxPx(region, w, h);
        if (region === 'eye') {
          lastPositionOk =
            reddestWindow(frame, guide).confidence >= 0.3 ||
            !!regionExtractor.detectLandmarks('eye', canvas, w, h);
        } else if (regionExtractor.landmarksAvailable) {
          const det = regionExtractor.detectLandmarks(region, canvas, w, h);
          const b = det?.boxes[0];
          lastPositionOk =
            !!b &&
            b.x + b.width / 2 > guide.x &&
            b.x + b.width / 2 < guide.x + guide.width &&
            b.y + b.height / 2 > guide.y &&
            b.y + b.height / 2 < guide.y + guide.height;
        } else {
          lastPositionOk = skinFraction(frame, guide, 3) > 0.4;
        }
      }

      const hint = !focusOk
        ? 'blurry'
        : !lightOk
          ? q.metrics.meanBrightness < 100
            ? 'tooDark'
            : 'tooBright'
          : !lastPositionOk
            ? 'noRegion'
            : null;
      setState({
        focus: focusOk ? 'ok' : 'warn',
        lighting: lightOk ? 'ok' : 'warn',
        position: lastPositionOk ? 'ok' : 'warn',
        allOk: focusOk && lightOk && lastPositionOk,
        hint,
      });
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [active, region, videoRef]);

  return state;
}
