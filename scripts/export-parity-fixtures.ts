/**
 * Writes fixtures that let `training/tests/test_parity.py` check the Python
 * training code produces EXACTLY the same ROI crops and color features as
 * the app. For each demo region image (downscaled to 320 px):
 *
 *   <name>.orig.rgba   original pixels     (u32 width, u32 height, RGBA bytes)
 *   <name>.pre.rgba    preprocessed pixels (JS backend)
 *   <name>.json        heuristic detection boxes, ROI mosaic checksum, color features
 *   <name>.roi.rgba    ROI mosaic
 *
 *   python3 scripts/generate_demo_samples.py --raw-dir /tmp/hemoscan-raw
 *   npx vite-node scripts/export-parity-fixtures.ts /tmp/hemoscan-raw
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { JsOps } from '@/imageProcessing/jsOps';
import { Preprocessor } from '@/imageProcessing/preprocessor';
import { heuristicDetection } from '@/imageProcessing/roiHeuristics';
import { extractColorFeatures, COLOR_FEATURE_NAMES } from '@/imageProcessing/colorFeatures';
import { fitWithin } from '@/imageProcessing/imageUtils';
import { buildRoiMosaic } from '@/ml/regionAnalyzer';
import type { RGBAImage } from '@/imageProcessing/types';
import { ALL_REGIONS } from '@/ml/types';

const rawDir = process.argv[2];
const out = join(process.cwd(), 'training/tests/fixtures');
mkdirSync(out, { recursive: true });

const write = (path: string, img: RGBAImage) => {
  const header = Buffer.alloc(8);
  header.writeUInt32LE(img.width, 0);
  header.writeUInt32LE(img.height, 4);
  writeFileSync(
    path,
    Buffer.concat([header, Buffer.from(img.data.buffer, img.data.byteOffset, img.data.byteLength)]),
  );
};

const pre = new Preprocessor(new JsOps());
for (const level of ['healthy', 'severe']) {
  for (const region of ALL_REGIONS) {
    const name = `${level}_${region}`;
    const buf = readFileSync(join(rawDir, `${name}.rgba`));
    const img = fitWithin(
      {
        width: buf.readUInt32LE(0),
        height: buf.readUInt32LE(4),
        data: new Uint8ClampedArray(buf.subarray(8)),
      },
      320,
    );
    const det = heuristicDetection(region, img);
    if (!det) throw new Error(`no detection for ${name}`);
    const p = pre.process(img).image;
    const roi = buildRoiMosaic(p, det.boxes, 224);
    write(join(out, `${name}.orig.rgba`), img);
    write(join(out, `${name}.pre.rgba`), p);
    write(join(out, `${name}.roi.rgba`), roi);
    writeFileSync(
      join(out, `${name}.json`),
      JSON.stringify(
        { region, detection: det, featureNames: COLOR_FEATURE_NAMES, features: extractColorFeatures(roi) },
        null,
        1,
      ),
    );
    console.log('fixture', name, det.method, det.boxes.length, 'boxes');
  }
}
