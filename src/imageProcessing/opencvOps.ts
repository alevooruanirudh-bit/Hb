/* eslint-disable @typescript-eslint/no-explicit-any */
import { createImage, type ImageOps, type RGBAImage } from './types';
import { JsOps } from './jsOps';

/** Minimal typing for the parts of OpenCV.js we use. */
type CV = any;

/**
 * OpenCV.js (WASM) implementation of {@link ImageOps}. Mirrors the cv2 calls in
 * `training/preprocess.py` so training and on-device preprocessing match.
 */
export class OpenCvOps implements ImageOps {
  readonly name = 'opencv' as const;
  private readonly js = new JsOps();

  constructor(private readonly cv: CV) {}

  private toMat(img: RGBAImage) {
    return this.cv.matFromImageData(img as ImageData);
  }

  private fromMat(mat: any): RGBAImage {
    const out = createImage(mat.cols, mat.rows);
    out.data.set(mat.data);
    return out;
  }

  laplacianVariance(img: RGBAImage): number {
    const cv = this.cv;
    const src = this.toMat(img);
    const gray = new cv.Mat();
    const lap = new cv.Mat();
    const mean = new cv.Mat();
    const std = new cv.Mat();
    try {
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      cv.Laplacian(gray, lap, cv.CV_64F, 1, 1, 0, cv.BORDER_DEFAULT);
      cv.meanStdDev(lap, mean, std);
      const s = std.doubleAt(0, 0);
      return s * s;
    } finally {
      [src, gray, lap, mean, std].forEach((m) => m.delete());
    }
  }

  /** Channel means are trivial in JS; the multiply is done in JS too (same result, no copies). */
  grayWorld(img: RGBAImage, maxGain: number): RGBAImage {
    return this.js.grayWorld(img, maxGain);
  }

  claheOnL(img: RGBAImage, clipLimit: number, tileGrid: number): RGBAImage {
    const cv = this.cv;
    const src = this.toMat(img);
    const rgb = new cv.Mat();
    const lab = new cv.Mat();
    const planes = new cv.MatVector();
    const outRgb = new cv.Mat();
    const outRgba = new cv.Mat();
    const clahe = new cv.CLAHE(clipLimit, new cv.Size(tileGrid, tileGrid));
    try {
      cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);
      cv.cvtColor(rgb, lab, cv.COLOR_RGB2Lab);
      cv.split(lab, planes);
      const L = planes.get(0);
      const Leq = new cv.Mat();
      clahe.apply(L, Leq);
      planes.set(0, Leq);
      cv.merge(planes, lab);
      cv.cvtColor(lab, outRgb, cv.COLOR_Lab2RGB);
      cv.cvtColor(outRgb, outRgba, cv.COLOR_RGB2RGBA);
      L.delete();
      Leq.delete();
      return this.fromMat(outRgba);
    } finally {
      clahe.delete();
      [src, rgb, lab, outRgb, outRgba].forEach((m) => m.delete());
      planes.delete();
    }
  }

  gaussianDenoise(img: RGBAImage): RGBAImage {
    const cv = this.cv;
    const src = this.toMat(img);
    const dst = new cv.Mat();
    try {
      cv.GaussianBlur(src, dst, new cv.Size(3, 3), 0, 0, cv.BORDER_DEFAULT);
      return this.fromMat(dst);
    } finally {
      src.delete();
      dst.delete();
    }
  }
}
