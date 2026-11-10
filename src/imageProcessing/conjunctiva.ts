import type { Box } from '@/ml/types';
import { createImage, type RGBAImage } from './types';
import { rgbToLab } from './colorSpace';

/**
 * Helpers that keep the eye measurement on the palpebral conjunctiva (the pink lining
 * of the pulled-down lower eyelid) — the only tissue the trained eye model has seen.
 * Mirrored in training/common.py.
 */

/** White of the eye: very bright and almost colourless. Never conjunctiva. */
const SCLERA_MIN_L = 70;
const SCLERA_MAX_CHROMA = 12;

/** Median CIE-Lab hue angle (degrees) inside a box: pink conjunctiva ≈ 20–35°, brown skin ≈ 38–60°. */
export function medianHue(img: RGBAImage, box: Box): number {
  const hues: number[] = [];
  const x1 = Math.min(img.width, Math.round(box.x + box.width));
  const y1 = Math.min(img.height, Math.round(box.y + box.height));
  for (let y = Math.max(0, Math.round(box.y)); y < y1; y++) {
    for (let x = Math.max(0, Math.round(box.x)); x < x1; x++) {
      const i = (y * img.width + x) * 4;
      const [L, a, b] = rgbToLab(img.data[i], img.data[i + 1], img.data[i + 2]);
      if (L < 15 || (L > SCLERA_MIN_L && Math.hypot(a, b) < SCLERA_MAX_CHROMA)) continue;
      hues.push((Math.atan2(b, a) * 180) / Math.PI);
    }
  }
  if (!hues.length) return 90;
  hues.sort((p, q) => p - q);
  return hues[Math.floor(hues.length / 2)];
}

/**
 * When both eyes are found, keep the one whose lower eyelid is actually pulled down —
 * its box shows pink conjunctiva, so it has the pinker (lower) median hue. Measuring
 * the other eye would average in plain under-eye skin and bias the estimate low.
 */
export function pickPulledEye(img: RGBAImage, boxes: Box[]): Box[] {
  if (boxes.length < 2) return boxes;
  let best = boxes[0];
  let bestHue = medianHue(img, best);
  for (const b of boxes.slice(1)) {
    const h = medianHue(img, b);
    if (h < bestHue) {
      best = b;
      bestHue = h;
    }
  }
  return [best];
}

/** Returns the ROI's pixels without white-of-the-eye (sclera) pixels, as an N×1 image. */
export function dropScleraPixels(roi: RGBAImage): RGBAImage {
  const keep: number[] = [];
  for (let i = 0; i < roi.data.length; i += 4) {
    const [L, a, b] = rgbToLab(roi.data[i], roi.data[i + 1], roi.data[i + 2]);
    if (L > SCLERA_MIN_L && Math.hypot(a, b) < SCLERA_MAX_CHROMA) continue;
    keep.push(i);
  }
  if (keep.length < 50) return roi; // nothing sensible left — measure the whole ROI
  const out = createImage(1, keep.length);
  keep.forEach((src, k) => out.data.set(roi.data.subarray(src, src + 4), k * 4));
  return out;
}
