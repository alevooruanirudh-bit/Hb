/**
 * Fits the MockModelProvider per-region calibration so the synthetic demo
 * samples map to their intended Hb values. Runs the same JS pipeline as the
 * app (quality → preprocess → heuristic ROI → color features).
 *
 *   python3 scripts/generate_demo_samples.py --raw-dir /tmp/hemoscan-raw
 *   npx vite-node scripts/calibrate-demo.ts /tmp/hemoscan-raw
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JsOps } from '@/imageProcessing/jsOps';
import { QualityChecker } from '@/imageProcessing/qualityChecker';
import { Preprocessor } from '@/imageProcessing/preprocessor';
import { heuristicDetection } from '@/imageProcessing/roiHeuristics';
import { extractColorFeatures } from '@/imageProcessing/colorFeatures';
import { fitWithin } from '@/imageProcessing/imageUtils';
import { buildRoiMosaic } from '@/ml/regionAnalyzer';
import { MockModelProvider, MOCK_CALIBRATION } from '@/ml/mockModelProvider';
import { DEMO_SETS } from '@/features/demo/demoSamples';
import { ALL_REGIONS, type RegionEstimate } from '@/ml/types';
import { analyzeRegion } from '@/ml/regionAnalyzer';
import { fuseEstimates } from '@/ml/fusion';
import { severityClassifier } from '@/ml/severityClassifier';

const dir = process.argv[2];
const ops = new JsOps();
const qc = new QualityChecker(ops);
const pre = new Preprocessor(ops);
const mock = new MockModelProvider();

for (const region of ALL_REGIONS) {
  const pts: Array<[number, number]> = [];
  for (const set of DEMO_SETS) {
    const buf = readFileSync(join(dir, `${set.id}_${region}.rgba`));
    const w = buf.readUInt32LE(0);
    const h = buf.readUInt32LE(4);
    const img = fitWithin({ width: w, height: h, data: new Uint8ClampedArray(buf.subarray(8)) }, 640);
    const q = qc.check(img);
    const det = heuristicDetection(region, img);
    if (!det) {
      console.log(region, set.id, 'NO DETECTION', q.status);
      continue;
    }
    const p = pre.process(img).image;
    const color = extractColorFeatures(buildRoiMosaic(p, det.boxes, 224));
    const red = MockModelProvider.redness(color);
    pts.push([red, set.approxHb]);
    console.log(
      `${region.padEnd(6)} ${set.id.padEnd(9)} quality=${q.status}(${q.score.toFixed(2)}) det=${det.method}(${det.confidence.toFixed(2)}) redness=${red.toFixed(2)} currentHb=${mock.estimate(color, region).hb.toFixed(1)} target=${set.approxHb}`,
    );
  }
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n;
  const my = pts.reduce((s, p) => s + p[1], 0) / n;
  const slope =
    pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
  console.log(
    `  fit ${region}: { intercept: ${(my - slope * mx).toFixed(3)}, slope: ${slope.toFixed(4)} }  (current ${JSON.stringify(MOCK_CALIBRATION[region])})\n`,
  );
}

// End-to-end check: full analyzeRegion (CNN mock + FallbackDecider + trees) → fusion → WHO severity (adult woman).
for (const set of DEMO_SETS) {
  const ests: RegionEstimate[] = [];
  for (const region of ALL_REGIONS) {
    const buf = readFileSync(join(dir, `${set.id}_${region}.rgba`));
    const img = fitWithin(
      {
        width: buf.readUInt32LE(0),
        height: buf.readUInt32LE(4),
        data: new Uint8ClampedArray(buf.subarray(8)),
      },
      640,
    );
    const quality = qc.check(img);
    const detection = heuristicDetection(region, img)!;
    const out = await analyzeRegion({ region, image: pre.process(img).image, detection, quality }, mock);
    ests.push(out.estimate);
  }
  const fused = fuseEstimates(ests);
  const cls = severityClassifier.classify(fused.hb, { ageYears: 30, sex: 'female', pregnant: false });
  console.log(
    `${set.id.padEnd(9)} fused=${fused.hb} (${ests.map((e) => `${e.region}:${e.hb}/${e.model}`).join(' ')}) → ${cls.severity} [expected ${set.level}] reliability=${fused.reliability}`,
  );
}
