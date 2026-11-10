import { qualityConfig } from '@/config/pipelineConfig';
import type { RGBAImage } from './types';
import { fitWithin } from './imageUtils';
import { luma } from './colorSpace';

/**
 * Content-robust sharpness score (mirrored in training/preprocess.py):
 *
 *  1. downscale to `sharpnessSide` px (colour analysis needs no fine detail, and this
 *     removes JPEG / WhatsApp softening from the decision)
 *  2. Laplacian of the grayscale image
 *  3. variance of the Laplacian in each tile of a `sharpnessGrid` × grid
 *  4. score = the `sharpnessPercentile` tile — i.e. how sharp the SHARPEST parts are
 *
 * A whole-image variance mistakes smooth skin, walls and bed sheets for blur; a sharp
 * close-up always has some crisp detail (palm creases, nail edges, eyelashes).
 */
export function sharpnessScore(img: RGBAImage): number {
  const small = fitWithin(img, qualityConfig.sharpnessSide);
  const { width: w, height: h, data } = small;
  if (w < 8 || h < 8) return 0;
  const g = new Float32Array(w * h);
  for (let p = 0, i = 0; p < g.length; p++, i += 4) g[p] = luma(data[i], data[i + 1], data[i + 2]);

  const grid = qualityConfig.sharpnessGrid;
  const th = Math.floor((h - 2) / grid);
  const tw = Math.floor((w - 2) / grid);
  if (th < 2 || tw < 2) return 0;
  const vars: number[] = [];
  for (let ty = 0; ty < grid; ty++) {
    for (let tx = 0; tx < grid; tx++) {
      let s = 0;
      let s2 = 0;
      let n = 0;
      for (let y = 1 + ty * th; y < 1 + (ty + 1) * th; y++) {
        for (let x = 1 + tx * tw; x < 1 + (tx + 1) * tw; x++) {
          const i = y * w + x;
          const v = g[i - w] + g[i + w] + g[i - 1] + g[i + 1] - 4 * g[i];
          s += v;
          s2 += v * v;
          n++;
        }
      }
      const m = s / n;
      vars.push(s2 / n - m * m);
    }
  }
  vars.sort((a, b) => a - b);
  const idx = Math.min(vars.length - 1, Math.round(qualityConfig.sharpnessPercentile * (vars.length - 1)));
  return vars[idx];
}
