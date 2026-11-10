import { confounderConfig } from '@/config/pipelineConfig';
import type { ImageFlag, Region, ReportedCondition } from './types';

/** Checklist items offered before scanning each region. */
export const REGION_CONDITIONS: Record<Region, ReportedCondition[]> = {
  eye: ['criedOrRubbed', 'eyeIrritation'],
  nails: ['nailPolishOrHenna', 'fingerInjury', 'nailsCutShort', 'coldHands'],
  palm: ['hennaOnPalm', 'hotWaterOrExercise', 'coldHands'],
};

/**
 * Combined weight multiplier for a region given what the person reported and
 * what was detected in the image. Multipliers compound; 0 excludes the region.
 *
 * Examples: crying makes the inner eyelid redder (can hide anemia); freshly
 * cut nails show more free edge and look paler (can fake anemia); nail polish
 * or mehndi hides the nail bed entirely.
 */
export function confounderFactor(region: Region, conditions: ReportedCondition[] = [], flags: ImageFlag[] = []): number {
  const reported = confounderConfig.reported[region] as Record<string, number>;
  const image = confounderConfig.image as Record<string, number>;
  let f = 1;
  for (const c of new Set(conditions)) if (c in reported) f *= reported[c];
  for (const fl of new Set(flags)) if (fl in image) f *= image[fl];
  return Math.round(f * 1000) / 1000;
}
