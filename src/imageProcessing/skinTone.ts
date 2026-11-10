import { skinToneConfig } from '@/config/pipelineConfig';
import type { Box, SkinToneCategory } from '@/ml/types';
import type { RGBAImage } from './types';
import { rgbToLab } from './colorSpace';

/**
 * Objective skin-tone measurement with the Individual Typology Angle
 * (ITA° = atan((L* − 50) / b*) · 180/π, Chardon et al. 1991), a standard
 * dermatology measure. It is used ONLY to decide how much to trust palm pallor
 * (harder to see on darker skin) — never to guess ethnicity, culture or diet.
 */

const isSkin = (r: number, g: number, b: number) => {
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  return cr >= 133 && cr <= 180 && cb >= 77 && cb <= 135;
};

function median(v: number[]): number {
  const s = [...v].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/**
 * Measures ITA° on skin-coloured pixels inside `box` (default: whole image),
 * excluding any `exclude` boxes (e.g. the nail beds or palm ROI).
 * Returns null when too few skin pixels are visible.
 */
export function measureIta(img: RGBAImage, box?: Box, exclude: Box[] = []): number | null {
  const b = box ?? { x: 0, y: 0, width: img.width, height: img.height };
  const Ls: number[] = [];
  const Bs: number[] = [];
  const inside = (x: number, y: number, e: Box) => x >= e.x && x < e.x + e.width && y >= e.y && y < e.y + e.height;
  const x1 = Math.min(img.width, Math.round(b.x + b.width));
  const y1 = Math.min(img.height, Math.round(b.y + b.height));
  for (let y = Math.max(0, Math.round(b.y)); y < y1; y += 2) {
    for (let x = Math.max(0, Math.round(b.x)); x < x1; x += 2) {
      if (exclude.some((e) => inside(x, y, e))) continue;
      const i = (y * img.width + x) * 4;
      const r = img.data[i];
      const g = img.data[i + 1];
      const bl = img.data[i + 2];
      if (!isSkin(r, g, bl)) continue;
      const [L, , bb] = rgbToLab(r, g, bl);
      if (L < 8 || L > 97) continue; // shadows / glare
      Ls.push(L);
      Bs.push(bb);
    }
  }
  if (Ls.length < skinToneConfig.minSkinPixels) return null;
  const L = median(Ls);
  const bb = Math.max(1, median(Bs));
  return (Math.atan((L - 50) / bb) * 180) / Math.PI;
}

export function itaCategory(ita: number): SkinToneCategory {
  for (const c of skinToneConfig.categories) if (ita > c.minIta) return c.id as SkinToneCategory;
  return 'dark';
}

/** Multiplier for the palm's fusion weight (1 on light skin, lower on darker skin). */
export function palmWeightFactor(category: SkinToneCategory | undefined): number {
  if (!category) return 1;
  return skinToneConfig.categories.find((c) => c.id === category)?.palmWeightFactor ?? 1;
}

/** Representative display colours for the self-report picker and result chips. */
export const SKIN_TONE_SWATCHES: Record<SkinToneCategory, string> = {
  veryLight: '#F3DCCB',
  light: '#E6BFA0',
  intermediate: '#CF9B77',
  tan: '#B07A54',
  brown: '#7E5238',
  dark: '#4A2F22',
};
