import { createImage, type RGBAImage } from '@/imageProcessing/types';

/** Deterministic PRNG so tests are repeatable. */
export function rng(seed = 42) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** Sharp, well-exposed checkerboard with mild noise around `base` brightness. */
export function sharpImage(w = 200, h = 200, base = 130, contrast = 60): RGBAImage {
  const img = createImage(w, h);
  const r = rng(1);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const on = (Math.floor(x / 6) + Math.floor(y / 6)) % 2 === 0;
      const v = base + (on ? contrast / 2 : -contrast / 2) + (r() - 0.5) * 6;
      const i = (y * w + x) * 4;
      img.data[i] = v + 20;
      img.data[i + 1] = v - 10;
      img.data[i + 2] = v - 10;
      img.data[i + 3] = 255;
    }
  }
  return img;
}

/** Smooth gradient — almost no edges → blurry. */
export function blurryImage(w = 200, h = 200, base = 130): RGBAImage {
  const img = createImage(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = base + ((x + y) / (w + h) - 0.5) * 30;
      const i = (y * w + x) * 4;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  return img;
}

/** Uniform color image. */
export function solidImage(w: number, h: number, r: number, g: number, b: number): RGBAImage {
  const img = createImage(w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = r;
    img.data[i + 1] = g;
    img.data[i + 2] = b;
    img.data[i + 3] = 255;
  }
  return img;
}
