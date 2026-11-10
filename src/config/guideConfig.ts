import type { Region } from '@/ml/types';
import cfg from './pipeline.json';

/**
 * Guide overlay geometry, as fractions of the camera frame. The capture
 * overlay draws these shapes, and the RegionExtractor uses the same boxes for
 * its landmark-free fallback (also mirrored in training/roi.py via pipeline.json).
 */
export const guideBoxes: Record<Region, { x: number; y: number; width: number; height: number }> =
  cfg.guideBoxes;
