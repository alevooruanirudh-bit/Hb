/**
 * Color conversions matching OpenCV's float formulas (sRGB, D65), so features
 * computed here match `training/extract_features.py` (which uses cv2).
 */

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const linearToSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

// Precomputed 8-bit gamma table.
const GAMMA_LUT = new Float32Array(256);
for (let i = 0; i < 256; i++) GAMMA_LUT[i] = srgbToLinear(i / 255);

const Xn = 0.950456;
const Zn = 1.088754;
const T = 0.008856;
const f = (t: number) => (t > T ? Math.cbrt(t) : 7.787 * t + 16 / 116);

/** 8-bit RGB → Lab with L ∈ [0,100], a,b ∈ ~[-128,127]. */
export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const R = GAMMA_LUT[r];
  const G = GAMMA_LUT[g];
  const B = GAMMA_LUT[b];
  const X = (0.412453 * R + 0.35758 * G + 0.180423 * B) / Xn;
  const Y = 0.212671 * R + 0.71516 * G + 0.072169 * B;
  const Z = (0.019334 * R + 0.119193 * G + 0.950227 * B) / Zn;
  const fy = f(Y);
  const L = Y > T ? 116 * fy - 16 : 903.3 * Y;
  return [L, 500 * (f(X) - fy), 200 * (fy - f(Z))];
}

/** Lab → 8-bit RGB (clamped). */
export function labToRgb(L: number, a: number, b: number): [number, number, number] {
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const inv = (t: number) => (t > 0.206893 ? t * t * t : (t - 16 / 116) / 7.787);
  const Y = L > 7.9996 ? fy * fy * fy : L / 903.3;
  const X = inv(fx) * Xn;
  const Z = inv(fz) * Zn;
  const R = 3.240479 * X - 1.53715 * Y - 0.498535 * Z;
  const G = -0.969256 * X + 1.875991 * Y + 0.041556 * Z;
  const B = 0.055648 * X - 0.204043 * Y + 1.057311 * Z;
  const to8 = (c: number) =>
    Math.max(0, Math.min(255, Math.round(linearToSrgb(Math.max(0, Math.min(1, c))) * 255)));
  return [to8(R), to8(G), to8(B)];
}

/** 8-bit RGB → HSV with all components in [0, 1]. */
export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h /= 6;
    if (h < 0) h += 1;
  }
  return [h, max === 0 ? 0 : d / max, max];
}

/** Rec. 601 luma, 0–255 (same weights as cv2.COLOR_RGB2GRAY). */
export const luma = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;
