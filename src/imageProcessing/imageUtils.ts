import { createImage, type RGBAImage } from './types';
import type { Box } from '@/ml/types';
import { luma } from './colorSpace';

/** Area-averaging / bilinear resize to exactly `tw × th`. */
export function resize(img: RGBAImage, tw: number, th: number): RGBAImage {
  const out = createImage(tw, th);
  const { width: w, height: h, data } = img;
  const sx = w / tw;
  const sy = h / th;
  if (sx >= 2 || sy >= 2) {
    // Box filter (area) for downscaling — avoids aliasing.
    for (let y = 0; y < th; y++) {
      const y0 = Math.floor(y * sy);
      const y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
      for (let x = 0; x < tw; x++) {
        const x0 = Math.floor(x * sx);
        const x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let yy = y0; yy < Math.min(h, y1); yy++) {
          for (let xx = x0; xx < Math.min(w, x1); xx++) {
            const i = (yy * w + xx) * 4;
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            n++;
          }
        }
        const o = (y * tw + x) * 4;
        out.data[o] = r / n;
        out.data[o + 1] = g / n;
        out.data[o + 2] = b / n;
        out.data[o + 3] = 255;
      }
    }
    return out;
  }
  for (let y = 0; y < th; y++) {
    const fy = Math.min(h - 1, Math.max(0, (y + 0.5) * sy - 0.5));
    const y0 = Math.floor(fy);
    const y1 = Math.min(h - 1, y0 + 1);
    const wy = fy - y0;
    for (let x = 0; x < tw; x++) {
      const fx = Math.min(w - 1, Math.max(0, (x + 0.5) * sx - 0.5));
      const x0 = Math.floor(fx);
      const x1 = Math.min(w - 1, x0 + 1);
      const wx = fx - x0;
      const o = (y * tw + x) * 4;
      for (let c = 0; c < 3; c++) {
        const a = data[(y0 * w + x0) * 4 + c] * (1 - wx) + data[(y0 * w + x1) * 4 + c] * wx;
        const b = data[(y1 * w + x0) * 4 + c] * (1 - wx) + data[(y1 * w + x1) * 4 + c] * wx;
        out.data[o + c] = a * (1 - wy) + b * wy;
      }
      out.data[o + 3] = 255;
    }
  }
  return out;
}

/** Downscales so the longest side ≤ maxSide (never upscales). */
export function fitWithin(img: RGBAImage, maxSide: number): RGBAImage {
  const s = maxSide / Math.max(img.width, img.height);
  if (s >= 1) return img;
  return resize(img, Math.max(1, Math.round(img.width * s)), Math.max(1, Math.round(img.height * s)));
}

/** Clamps a box to image bounds. */
export function clampBox(b: Box, w: number, h: number): Box {
  const x = Math.max(0, Math.min(w - 1, Math.round(b.x)));
  const y = Math.max(0, Math.min(h - 1, Math.round(b.y)));
  return {
    x,
    y,
    width: Math.max(1, Math.min(w - x, Math.round(b.width))),
    height: Math.max(1, Math.min(h - y, Math.round(b.height))),
  };
}

export function crop(img: RGBAImage, box: Box): RGBAImage {
  const b = clampBox(box, img.width, img.height);
  const out = createImage(b.width, b.height);
  for (let y = 0; y < b.height; y++) {
    const src = ((b.y + y) * img.width + b.x) * 4;
    out.data.set(img.data.subarray(src, src + b.width * 4), y * b.width * 4);
  }
  return out;
}

/**
 * Fast noise sigma estimate (Immerkær 1996) on the luma plane. Used to decide
 * whether light denoising is appropriate.
 */
export function estimateNoiseSigma(img: RGBAImage): number {
  const { width: w, height: h, data } = img;
  if (w < 3 || h < 3) return 0;
  const g = new Float32Array(w * h);
  for (let p = 0, i = 0; p < g.length; p++, i += 4) g[p] = luma(data[i], data[i + 1], data[i + 2]);
  let sum = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const v =
        g[i - w - 1] -
        2 * g[i - w] +
        g[i - w + 1] -
        2 * g[i - 1] +
        4 * g[i] -
        2 * g[i + 1] +
        g[i + w - 1] -
        2 * g[i + w] +
        g[i + w + 1];
      sum += Math.abs(v);
    }
  }
  return (sum * Math.sqrt(Math.PI / 2)) / (6 * (w - 2) * (h - 2));
}

/**
 * Gentle unsharp mask: out = img + amount × (img − gaussian(img, sigma)).
 * Used only to "auto-enhance" slightly soft photos; the local mean colour is preserved,
 * so colour features are essentially unchanged. Mirrors preprocess.py → unsharp().
 */
export function unsharpMask(img: RGBAImage, amount: number, sigma: number): RGBAImage {
  const { width: w, height: h, data } = img;
  const r = Math.max(1, Math.ceil(sigma * 3));
  const k: number[] = [];
  let ks = 0;
  for (let i = -r; i <= r; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    k.push(v);
    ks += v;
  }
  for (let i = 0; i < k.length; i++) k[i] /= ks;
  const tmp = new Float32Array(w * h * 3);
  const blur = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) {
        let a = 0;
        for (let i = -r; i <= r; i++) a += data[(y * w + Math.min(w - 1, Math.max(0, x + i))) * 4 + c] * k[i + r];
        tmp[(y * w + x) * 3 + c] = a;
      }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < 3; c++) {
        let a = 0;
        for (let i = -r; i <= r; i++) a += tmp[(Math.min(h - 1, Math.max(0, y + i)) * w + x) * 3 + c] * k[i + r];
        blur[(y * w + x) * 3 + c] = a;
      }
  const out = createImage(w, h);
  for (let p = 0; p < w * h; p++) {
    for (let c = 0; c < 3; c++) {
      const v = data[p * 4 + c];
      out.data[p * 4 + c] = v + amount * (v - blur[p * 3 + c]);
    }
    out.data[p * 4 + 3] = 255;
  }
  return out;
}
