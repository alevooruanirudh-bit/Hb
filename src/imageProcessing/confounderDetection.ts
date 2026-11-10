import { confounderConfig } from '@/config/pipelineConfig';
import type { Box, ImageFlag, Region } from '@/ml/types';
import type { RGBAImage } from './types';
import { rgbToHsv, rgbToLab } from './colorSpace';

const D = confounderConfig.detection;

/**
 * Red "white of the eye": after crying, rubbing, allergy or infection the
 * sclera turns pink and the inner eyelid looks redder than the blood really
 * is (an anemic person could look normal). Looks for bright, low-chroma
 * pixels (sclera) in a band just above the eyelid ROI and measures their a*.
 */
export function detectScleraRed(img: RGBAImage, eyelidBoxes: Box[]): boolean {
  const aVals: number[] = [];
  for (const b of eyelidBoxes) {
    const top = Math.max(0, Math.round(b.y - b.height * 1.6));
    const bottom = Math.max(0, Math.round(b.y));
    for (let y = top; y < bottom; y += 2) {
      for (let x = Math.max(0, Math.round(b.x)); x < Math.min(img.width, Math.round(b.x + b.width)); x += 2) {
        const i = (y * img.width + x) * 4;
        const [L, a, bb] = rgbToLab(img.data[i], img.data[i + 1], img.data[i + 2]);
        // Sclera candidates: bright; chroma limit is generous so a pink sclera still counts.
        if (L >= D.scleraMinL && Math.hypot(a, bb) <= D.scleraMaxChroma && a > -5) aVals.push(a);
      }
    }
  }
  if (aVals.length < D.scleraMinPixels) return false;
  aVals.sort((p, q) => p - q);
  return aVals[Math.floor(aVals.length / 2)] > D.scleraRedA;
}

interface HueStats {
  saturated: number;
  offSkinHue: number;
  dark: number;
}

function hueStats(roi: RGBAImage): HueStats {
  let n = 0;
  let saturated = 0;
  let offSkin = 0;
  let dark = 0;
  for (let i = 0; i < roi.data.length; i += 4) {
    const [h, s, v] = rgbToHsv(roi.data[i], roi.data[i + 1], roi.data[i + 2]);
    n++;
    if (s >= D.coatingSaturation && v > 0.25) saturated++;
    // Skin, nail beds and henna sit in the red–orange hues; blue/green/purple = polish.
    if (s > 0.3 && v > 0.25 && h > 0.14 && h < 0.88) offSkin++;
    if (v < D.darkSpotValue) dark++;
  }
  return { saturated: saturated / n, offSkinHue: offSkin / n, dark: dark / n };
}

/**
 * Automatic confounder flags for one region's ROI mosaic (and, for the eye,
 * the full preprocessed image to look at the sclera).
 */
export function detectImageFlags(region: Region, roi: RGBAImage, full?: RGBAImage, boxes: Box[] = []): ImageFlag[] {
  const flags: ImageFlag[] = [];
  if (region === 'eye') {
    if (full && detectScleraRed(full, boxes)) flags.push('scleraRed');
    return flags;
  }
  const st = hueStats(roi);
  // Nail polish / mehndi: very saturated colour, or colours skin never has.
  const coated = st.saturated > D.coatingFraction || st.offSkinHue > D.offSkinHueFraction;
  if (region === 'nails') {
    if (coated) flags.push('nailCoating');
    if (st.dark > D.darkSpotFraction) flags.push('nailDarkSpot');
  } else if (coated) {
    flags.push('hennaDetected');
  }
  return flags;
}
