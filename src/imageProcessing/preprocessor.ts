import { preprocessConfig } from '@/config/pipelineConfig';
import type { ImageOps, RGBAImage } from './types';
import { estimateNoiseSigma, unsharpMask } from './imageUtils';

export interface PreprocessResult {
  image: RGBAImage;
  noiseSigma: number;
  denoised: boolean;
  /** Gentle sharpening was applied because the photo was slightly soft. */
  sharpened: boolean;
}

/**
 * Normalises lighting before color analysis (mirrors `training/preprocess.py`):
 *
 *  1. Gray-world white balance (color constancy) — gains clamped
 *  2. CLAHE on the L channel in Lab (contrast only; chroma a* and b* untouched)
 *  3. Light 3×3 Gaussian denoise, ONLY for mild noise; OR gentle sharpening ("auto-enhance")
 *     for slightly soft photos (quality "slightlyBlurry"). Very noisy images are
 *     left alone (the quality gate / fallback handles them) — never "fixed".
 */
export class Preprocessor {
  constructor(
    private readonly ops: ImageOps,
    private readonly cfg: typeof preprocessConfig = preprocessConfig,
  ) {}

  /** `opts.sharpen`: auto-enhance a slightly soft (borderline) photo with a gentle unsharp mask. */
  process(img: RGBAImage, opts: { sharpen?: boolean } = {}): PreprocessResult {
    const balanced = this.ops.grayWorld(img, this.cfg.maxWhiteBalanceGain);
    const contrasted = this.ops.claheOnL(balanced, this.cfg.claheClipLimit, this.cfg.claheTileGrid);
    const noiseSigma = estimateNoiseSigma(contrasted);
    const denoise = noiseSigma >= this.cfg.denoiseNoiseThreshold && noiseSigma < this.cfg.denoiseMaxNoise;
    let image = denoise ? this.ops.gaussianDenoise(contrasted) : contrasted;
    // Never both denoise and sharpen; heavily blurred photos never get here (quality gate).
    const sharpen = !!opts.sharpen && !denoise;
    if (sharpen) image = unsharpMask(image, this.cfg.unsharpAmount, this.cfg.unsharpSigma);
    return { image, noiseSigma, denoised: denoise, sharpened: sharpen };
  }
}
