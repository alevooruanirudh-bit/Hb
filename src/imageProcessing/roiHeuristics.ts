import { guideBoxes } from '@/config/guideConfig';
import type { Box, Region, RegionDetection } from '@/ml/types';
import type { RGBAImage } from './types';
import { rgbToLab } from './colorSpace';

/** Guide box for a region in pixel coordinates. */
export function guideBoxPx(region: Region, w: number, h: number): Box {
  const g = guideBoxes[region];
  return { x: g.x * w, y: g.y * h, width: g.width * w, height: g.height * h };
}

/** Fraction of pixels inside `box` that fall in a broad YCrCb skin range. */
export function skinFraction(img: RGBAImage, box: Box, step = 2): number {
  let skin = 0;
  let n = 0;
  const x1 = Math.min(img.width, Math.round(box.x + box.width));
  const y1 = Math.min(img.height, Math.round(box.y + box.height));
  for (let y = Math.max(0, Math.round(box.y)); y < y1; y += step) {
    for (let x = Math.max(0, Math.round(box.x)); x < x1; x += step) {
      const i = (y * img.width + x) * 4;
      const r = img.data[i];
      const g = img.data[i + 1];
      const b = img.data[i + 2];
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      if (cr >= 133 && cr <= 180 && cb >= 77 && cb <= 135) skin++;
      n++;
    }
  }
  return n ? skin / n : 0;
}

/**
 * Finds the reddest square window (highest mean a*) inside a search box — used
 * to locate the pulled-down inner eyelid on close-up photos where face
 * landmarks are not visible. Confidence reflects how much redder the window is
 * than its surroundings.
 */
export function reddestWindow(img: RGBAImage, search: Box, winFrac = 0.35): { box: Box; confidence: number } {
  const cells = 16;
  const cw = search.width / cells;
  const ch = search.height / cells;
  const grid = new Float32Array(cells * cells);
  for (let gy = 0; gy < cells; gy++) {
    for (let gx = 0; gx < cells; gx++) {
      let sum = 0;
      let n = 0;
      for (let sy = 0; sy < 3; sy++) {
        for (let sx = 0; sx < 3; sx++) {
          const x = Math.min(img.width - 1, Math.floor(search.x + (gx + (sx + 0.5) / 3) * cw));
          const y = Math.min(img.height - 1, Math.floor(search.y + (gy + (sy + 0.5) / 3) * ch));
          const i = (y * img.width + x) * 4;
          sum += rgbToLab(img.data[i], img.data[i + 1], img.data[i + 2])[1];
          n++;
        }
      }
      grid[gy * cells + gx] = sum / n;
    }
  }
  const wCells = Math.max(2, Math.round(cells * winFrac));
  const hCells = Math.max(2, Math.round(cells * winFrac * 0.6));
  let best = -Infinity;
  let bx = 0;
  let by = 0;
  for (let gy = 0; gy + hCells <= cells; gy++) {
    for (let gx = 0; gx + wCells <= cells; gx++) {
      let s = 0;
      for (let y = gy; y < gy + hCells; y++) for (let x = gx; x < gx + wCells; x++) s += grid[y * cells + x];
      if (s > best) {
        best = s;
        bx = gx;
        by = gy;
      }
    }
  }
  const winMean = best / (wCells * hCells);
  const overall = grid.reduce((a, b) => a + b, 0) / grid.length;
  const confidence = Math.max(0, Math.min(0.7, (winMean - overall) / 25 + (winMean > 12 ? 0.25 : 0)));
  return {
    box: { x: search.x + bx * cw, y: search.y + by * ch, width: wCells * cw, height: hCells * ch },
    confidence,
  };
}

/**
 * Finds up to `n` nail-bed candidates on close-up hand photos without
 * landmarks: square cells that are almost entirely skin/pink-toned and
 * brighter than the typical skin cell (nail plates reflect more light than the
 * surrounding finger skin). Picks up to `n` cells, brightest first, never two
 * cells sharing an edge (so specular spots on one nail can't dominate).
 */
export function nailBedWindows(img: RGBAImage, search: Box, n = 8): { boxes: Box[]; confidence: number } {
  const cols = 14;
  const cell = search.width / cols;
  const rows = Math.max(1, Math.floor(search.height / cell));
  const cells: Array<{ gx: number; gy: number; luma: number }> = [];
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const box = { x: search.x + gx * cell, y: search.y + gy * cell, width: cell, height: cell };
      if (skinFraction(img, box, 2) < 0.85) continue;
      let sum = 0;
      let cnt = 0;
      for (let y = Math.round(box.y); y < Math.min(img.height, box.y + cell); y += 2) {
        for (let x = Math.round(box.x); x < Math.min(img.width, box.x + cell); x += 2) {
          const i = (y * img.width + x) * 4;
          sum += 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];
          cnt++;
        }
      }
      cells.push({ gx, gy, luma: sum / Math.max(1, cnt) });
    }
  }
  if (cells.length < 3) return { boxes: [], confidence: 0 };
  const sorted = [...cells].sort((a, b) => b.luma - a.luma);
  const median = sorted[Math.floor(sorted.length / 2)].luma;
  const picked: typeof cells = [];
  for (const c of sorted) {
    if (picked.length >= n || c.luma < median + 8) break;
    if (picked.some((p) => Math.abs(p.gx - c.gx) + Math.abs(p.gy - c.gy) <= 1)) continue;
    picked.push(c);
  }
  const boxes = picked.map((c) => ({
    x: search.x + c.gx * cell,
    y: search.y + c.gy * cell,
    width: cell,
    height: cell,
  }));
  return { boxes, confidence: boxes.length >= 3 ? 0.45 : boxes.length ? 0.3 : 0 };
}

/**
 * Landmark-free fallback detection:
 *  - eye: reddest window inside the guide area (colorHeuristic)
 *  - nails / palm: guide box if enough skin is present (guideBox)
 * Returns null when nothing plausible is in view.
 */
export function heuristicDetection(region: Region, img: RGBAImage): RegionDetection | null {
  // Uploaded close-ups rarely match the guide exactly, so search a generous area.
  const search: Box = {
    x: img.width * 0.08,
    y: img.height * 0.08,
    width: img.width * 0.84,
    height: img.height * 0.84,
  };
  if (region === 'eye') {
    const { box, confidence } = reddestWindow(img, search);
    return confidence >= 0.25 ? { boxes: [box], confidence, method: 'colorHeuristic' } : null;
  }
  const g = guideBoxPx(region, img.width, img.height);
  if (region === 'nails') {
    const nails = nailBedWindows(img, search);
    if (nails.boxes.length)
      return { boxes: nails.boxes, confidence: nails.confidence, method: 'colorHeuristic' };
  }
  const skin = skinFraction(img, g);
  if (skin < 0.3) return null;
  const inset = region === 'palm' ? 0.2 : 0.1;
  const box = {
    x: g.x + g.width * inset,
    y: g.y + g.height * inset,
    width: g.width * (1 - 2 * inset),
    height: g.height * (1 - 2 * inset),
  };
  return { boxes: [box], confidence: Math.min(0.55, 0.25 + skin * 0.35), method: 'guideBox' };
}
