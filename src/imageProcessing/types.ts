/**
 * Minimal RGBA image structure (structurally compatible with DOM `ImageData`),
 * so the processing code runs in the browser, in a Web Worker and in Node tests.
 */
export interface RGBAImage {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/**
 * The heavy image operations, implemented twice:
 *  - `OpenCvOps` (OpenCV.js WASM — fast, the default in the app)
 *  - `JsOps` (pure TypeScript — used in unit tests and as an offline-safe fallback
 *    if OpenCV.js fails to load on a very old WebView)
 * Both must produce equivalent results; they share `pipelineConfig` parameters.
 */
export interface ImageOps {
  readonly name: 'opencv' | 'js';
  /** Variance of the 3×3 Laplacian of the grayscale image. */
  laplacianVariance(img: RGBAImage): number;
  /** Gray-world white balance with per-channel gain clamped to `maxGain`. */
  grayWorld(img: RGBAImage, maxGain: number): RGBAImage;
  /** CLAHE applied on the L channel of Lab; a/b channels untouched. */
  claheOnL(img: RGBAImage, clipLimit: number, tileGrid: number): RGBAImage;
  /** Light 3×3 Gaussian denoise. */
  gaussianDenoise(img: RGBAImage): RGBAImage;
}

export function createImage(width: number, height: number): RGBAImage {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}
