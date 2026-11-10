import { createImage, type ImageOps, type RGBAImage } from './types';
import { labToRgb, luma, rgbToLab } from './colorSpace';

/** Grayscale (luma) plane as floats. */
export function toGray(img: RGBAImage): Float32Array {
  const { data, width, height } = img;
  const out = new Float32Array(width * height);
  for (let i = 0, p = 0; p < out.length; i += 4, p++) out[p] = luma(data[i], data[i + 1], data[i + 2]);
  return out;
}

/**
 * Pure-TypeScript implementation of {@link ImageOps}. Deterministic and
 * dependency-free, used by unit tests and as the fallback backend.
 */
export class JsOps implements ImageOps {
  readonly name = 'js' as const;

  laplacianVariance(img: RGBAImage): number {
    const { width: w, height: h } = img;
    if (w < 3 || h < 3) return 0;
    const g = toGray(img);
    let sum = 0;
    let sumSq = 0;
    let n = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const v = g[i - w] + g[i + w] + g[i - 1] + g[i + 1] - 4 * g[i];
        sum += v;
        sumSq += v * v;
        n++;
      }
    }
    const mean = sum / n;
    return sumSq / n - mean * mean;
  }

  grayWorld(img: RGBAImage, maxGain: number): RGBAImage {
    const { data } = img;
    let r = 0;
    let g = 0;
    let b = 0;
    const n = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    r /= n;
    g /= n;
    b /= n;
    const gray = (r + g + b) / 3;
    const clamp = (v: number) => Math.min(maxGain, Math.max(1 / maxGain, v));
    const gr = clamp(gray / Math.max(r, 1));
    const gg = clamp(gray / Math.max(g, 1));
    const gb = clamp(gray / Math.max(b, 1));
    const out = createImage(img.width, img.height);
    const o = out.data;
    for (let i = 0; i < data.length; i += 4) {
      o[i] = data[i] * gr;
      o[i + 1] = data[i + 1] * gg;
      o[i + 2] = data[i + 2] * gb;
      o[i + 3] = 255;
    }
    return out;
  }

  claheOnL(img: RGBAImage, clipLimit: number, tileGrid: number): RGBAImage {
    const { width: w, height: h, data } = img;
    const n = w * h;
    const L8 = new Uint8Array(n);
    const A = new Float32Array(n);
    const B = new Float32Array(n);
    for (let p = 0, i = 0; p < n; p++, i += 4) {
      const [l, a, b] = rgbToLab(data[i], data[i + 1], data[i + 2]);
      L8[p] = Math.max(0, Math.min(255, Math.round((l * 255) / 100)));
      A[p] = a;
      B[p] = b;
    }
    const eq = clahe(L8, w, h, clipLimit, tileGrid);
    const out = createImage(w, h);
    for (let p = 0, i = 0; p < n; p++, i += 4) {
      const [r, g, b] = labToRgb((eq[p] * 100) / 255, A[p], B[p]);
      out.data[i] = r;
      out.data[i + 1] = g;
      out.data[i + 2] = b;
      out.data[i + 3] = 255;
    }
    return out;
  }

  gaussianDenoise(img: RGBAImage): RGBAImage {
    const { width: w, height: h, data } = img;
    const k = [1, 2, 1, 2, 4, 2, 1, 2, 1];
    const out = createImage(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        for (let c = 0; c < 3; c++) {
          let acc = 0;
          let ki = 0;
          for (let dy = -1; dy <= 1; dy++) {
            const yy = Math.min(h - 1, Math.max(0, y + dy));
            for (let dx = -1; dx <= 1; dx++) {
              const xx = Math.min(w - 1, Math.max(0, x + dx));
              acc += data[(yy * w + xx) * 4 + c] * k[ki++];
            }
          }
          out.data[(y * w + x) * 4 + c] = acc / 16;
        }
        out.data[(y * w + x) * 4 + 3] = 255;
      }
    }
    return out;
  }
}

/**
 * Contrast Limited Adaptive Histogram Equalization on an 8-bit plane, following
 * OpenCV's algorithm (clip limit scaled by tile area / 256, uniform
 * redistribution, bilinear interpolation between tile LUTs).
 */
export function clahe(src: Uint8Array, w: number, h: number, clipLimit: number, grid: number): Uint8Array {
  const tw = Math.ceil(w / grid);
  const th = Math.ceil(h / grid);
  const area = tw * th;
  const limit = Math.max(1, Math.floor((clipLimit * area) / 256));
  const luts: Uint8Array[] = [];

  for (let ty = 0; ty < grid; ty++) {
    for (let tx = 0; tx < grid; tx++) {
      const hist = new Int32Array(256);
      let count = 0;
      for (let y = ty * th; y < Math.min(h, (ty + 1) * th); y++) {
        for (let x = tx * tw; x < Math.min(w, (tx + 1) * tw); x++) {
          hist[src[y * w + x]]++;
          count++;
        }
      }
      let clipped = 0;
      for (let i = 0; i < 256; i++) {
        if (hist[i] > limit) {
          clipped += hist[i] - limit;
          hist[i] = limit;
        }
      }
      const batch = Math.floor(clipped / 256);
      const residual = clipped - batch * 256;
      for (let i = 0; i < 256; i++) hist[i] += batch;
      if (residual > 0) {
        const step = Math.max(1, Math.floor(256 / residual));
        for (let i = 0, r = residual; i < 256 && r > 0; i += step, r--) hist[i]++;
      }
      const lut = new Uint8Array(256);
      const scale = count > 0 ? 255 / count : 0;
      let sum = 0;
      for (let i = 0; i < 256; i++) {
        sum += hist[i];
        lut[i] = Math.min(255, Math.round(sum * scale));
      }
      luts.push(lut);
    }
  }

  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const gy = (y + 0.5) / th - 0.5;
    const y0 = Math.max(0, Math.min(grid - 1, Math.floor(gy)));
    const y1 = Math.min(grid - 1, y0 + 1);
    const fy = Math.max(0, Math.min(1, gy - y0));
    for (let x = 0; x < w; x++) {
      const gx = (x + 0.5) / tw - 0.5;
      const x0 = Math.max(0, Math.min(grid - 1, Math.floor(gx)));
      const x1 = Math.min(grid - 1, x0 + 1);
      const fx = Math.max(0, Math.min(1, gx - x0));
      const v = src[y * w + x];
      const top = luts[y0 * grid + x0][v] * (1 - fx) + luts[y0 * grid + x1][v] * fx;
      const bot = luts[y1 * grid + x0][v] * (1 - fx) + luts[y1 * grid + x1][v] * fx;
      out[y * w + x] = Math.round(top * (1 - fy) + bot * fy);
    }
  }
  return out;
}
