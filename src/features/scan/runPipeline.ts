import { correctionFor, type DeviceModel } from '@/ml/deviceLearning';
import { appConfig } from '@/config/appConfig';
import { qualityConfig } from '@/config/pipelineConfig';
import { fuseEstimates } from '@/ml/fusion';
import { confounderFactor } from '@/ml/confounders';
import { regionExtractor } from '@/ml/regionExtractor';
import { severityClassifier } from '@/ml/severityClassifier';
import type {
  ClassificationSubject,
  QualityReport,
  Region,
  RegionEstimate,
  ReportedCondition,
  ScanOutcome,
  SkinTone,
} from '@/ml/types';
import { buildRoiMosaic } from '@/ml/regionAnalyzer';
import { detectImageFlags } from '@/imageProcessing/confounderDetection';
import { itaCategory, measureIta } from '@/imageProcessing/skinTone';
import type { RGBAImage } from '@/imageProcessing/types';
import { pipelineWorker } from '@/workers/workerClient';
import { cloneImage, decodeImage } from '@/utils/image';
import type { CapturedImage } from '@/store/scanStore';

/** Visible processing steps (Processing screen). */
export const PIPELINE_STEPS = ['quality', 'lighting', 'region', 'color', 'estimate'] as const;
export type PipelineStep = (typeof PIPELINE_STEPS)[number];

export interface StepEvent {
  step: PipelineStep;
  region: Region;
  regionIndex: number;
  regionCount: number;
}

export interface RetakeRequest {
  region: Region;
  quality: QualityReport | null;
  noRegion?: boolean;
}

export interface RoiSample {
  region: Region;
  roi: RGBAImage;
  colorFeatures: number[];
  hb: number;
}

export type PipelineResult =
  | { kind: 'ok'; outcome: ScanOutcome; samples: RoiSample[]; warnings: string[] }
  | { kind: 'retake'; retake: RetakeRequest };

/**
 * Quick check right after capture / upload: quality gate + "is the region in
 * the picture?". Lets the user retake immediately instead of after processing.
 */
export async function quickCheck(
  region: Region,
  blob: Blob,
): Promise<RetakeRequest | { ok: true; quality: QualityReport }> {
  const img = await decodeImage(blob, qualityConfig.analysisMaxSide);
  const quality = await pipelineWorker.quality(img.pixels);
  if (quality.status === 'fail') return { region, quality };
  const det = await regionExtractor.detect(region, img.canvas, img.pixels);
  if (!det) return { region, quality, noRegion: true };
  return { ok: true, quality };
}

/**
 * Full on-device pipeline for all captured regions:
 *
 *   QualityChecker → Preprocessor (worker) → RegionExtractor (main, MediaPipe)
 *   → FeatureExtractor → FallbackDecider → Predictor (worker)
 *   → Fusion → SeverityClassifier
 */
export async function runScanPipeline(opts: {
  captures: Partial<Record<Region, CapturedImage>>;
  order: Region[];
  subject: ClassificationSubject;
  isDemo: boolean;
  useMock: boolean;
  /** Pre-scan checklist answers per region (crying, polish, injury …). */
  conditions?: Partial<Record<Region, ReportedCondition[]>>;
  /** Skin tone from the profile (photo or self-report); otherwise measured from the scan. */
  profileSkinTone?: SkinTone;
  /** Personal calibration offset from this person's own blood tests (see ml/personalCalibration). */
  personalOffset?: { offset: number; tests: number } | null;
  /** Correction learned from blood tests on this device — used only when the person has none of their own. */
  deviceModel?: DeviceModel | null;
  onStep?: (e: StepEvent) => void;
}): Promise<PipelineResult> {
  const t0 = performance.now();
  const init = await pipelineWorker.init(opts.useMock);
  void regionExtractor.init();

  const regions = opts.order.filter((r) => opts.captures[r]);
  const estimates: RegionEstimate[] = [];
  const samples: RoiSample[] = [];
  const scanItas: number[] = [];

  for (let k = 0; k < regions.length; k++) {
    const region = regions[k];
    const emit = (step: PipelineStep) =>
      opts.onStep?.({ step, region, regionIndex: k, regionCount: regions.length });
    const capture = opts.captures[region]!;

    emit('quality');
    const decoded = await decodeImage(capture.blob, qualityConfig.analysisMaxSide);
    const prepared = await pipelineWorker.prepare(cloneImage(decoded.pixels));
    if (prepared.quality.status === 'fail' || !prepared.preprocessed) {
      return { kind: 'retake', retake: { region, quality: prepared.quality } };
    }

    emit('lighting');
    // (Preprocessing already ran in the worker; the step is shown so users see what happens.)

    emit('region');
    const detection = await regionExtractor.detect(region, decoded.canvas, decoded.pixels);
    if (!detection) return { kind: 'retake', retake: { region, quality: prepared.quality, noRegion: true } };

    emit('color');
    // The trained eye model learned from raw conjunctiva pixels (camera white balance only),
    // so it gets the original image; the nail model was trained on preprocessed images.
    const analysisImage =
      (region === 'eye' || region === 'palm') && init.modelSource === 'real'
        ? cloneImage(decoded.pixels)
        : prepared.preprocessed;
    const analysed = await pipelineWorker.analyze(region, analysisImage, detection, prepared.quality, {
      ageYears: opts.subject.ageYears,
      sex: opts.subject.sex,
    });

    // Confounders and skin tone are measured on the ORIGINAL pixels: white balance would
    // push skin-dominated photos towards grey and hide a pink sclera or polish colour.
    const origRoi = buildRoiMosaic(decoded.pixels, detection.boxes, 112);
    const imageFlags = detectImageFlags(region, origRoi, decoded.pixels, detection.boxes);
    // Skin tone only from the finger skin around the nails: palm skin gets paler with
    // anemia itself, so measuring it there would make anemic people look lighter-skinned.
    if (region === 'nails') {
      const ita = measureIta(decoded.pixels, undefined, detection.boxes);
      if (ita !== null) scanItas.push(ita);
    }

    emit('estimate');
    const pop = init.populations?.[region];
    const populationMismatch =
      !!pop && (opts.subject.ageYears < pop.minAge || opts.subject.ageYears > pop.maxAge);
    estimates.push({
      ...analysed.estimate,
      conditions: opts.conditions?.[region] ?? [],
      imageFlags,
      populationMismatch,
    });
    samples.push({
      region,
      roi: analysed.roi,
      colorFeatures: analysed.colorFeatures,
      hb: analysed.estimate.hb,
    });
  }

  let skinTone: SkinTone | undefined = opts.profileSkinTone;
  if (!skinTone && scanItas.length) {
    const ita = scanItas.sort((a, b) => a - b)[Math.floor(scanItas.length / 2)];
    skinTone = { ita: Math.round(ita * 10) / 10, category: itaCategory(ita), source: 'scan' };
  }

  // Classifier-only regions (palm check) never enter the hemoglobin number.
  const hbEstimates = estimates.filter((e) => !e.likelihoodOnly);
  const checks = estimates.filter((e) => e.likelihoodOnly);
  if (!hbEstimates.length) throw new Error('No region with a hemoglobin estimate was scanned');
  const fusedRaw = fuseEstimates(hbEstimates, { skinTone: skinTone?.category });
  // Personal calibration shifts the estimate and its range by this person's measured offset.
  const po = opts.personalOffset;
  // Learned only from real-model scans, so never applied to demo / simulated results.
  const dm = !po && opts.deviceModel?.active && init.modelSource === 'real' && !opts.isDemo ? opts.deviceModel : null;
  const dc = dm ? { offset: correctionFor(dm, fusedRaw.hb), pairs: dm.pairs } : undefined;
  const shift = po ? po.offset : (dc?.offset ?? 0);
  const r1 = (v: number) => Math.round(v * 10) / 10;
  const fused = {
    ...fusedRaw,
    hb: r1(fusedRaw.hb + shift),
    low: r1(fusedRaw.low + shift),
    high: r1(fusedRaw.high + shift),
  };
  const cls = severityClassifier.classify(fused.hb, opts.subject);
  // Severity at both ends of the likely range — they differ when the range crosses a cutoff.
  const sevLow = severityClassifier.classify(fused.low, opts.subject).severity;
  const sevHigh = severityClassifier.classify(fused.high, opts.subject).severity;
  const upperNormal = cls.group.upper;

  const outcome: ScanOutcome = {
    hb: fused.hb,
    hbUncalibrated: fusedRaw.hb,
    personalCalibration: po ?? undefined,
    deviceCorrection: dc,
    hbLow: fused.low,
    hbHigh: fused.high,
    severityRange: [sevLow, sevHigh],
    upperNormal,
    aboveNormal: upperNormal !== undefined && cls.adjustedHb > upperNormal,
    hbAdjusted: cls.adjustedHb,
    altitudeAdjustment: cls.altitudeAdjustment,
    skinTone,
    severity: cls.severity,
    anemia: cls.anemia,
    reliability: fused.reliability,
    allRegionsAffected: fused.allRegionsAffected,
    usedFallback: fused.regions.some((r) => r.model === 'randomForest'),
    regions: [
      ...fused.regions,
      ...checks.map((c) => ({
        ...c,
        confounderFactor: confounderFactor(c.region, c.conditions, c.imageFlags),
      })),
    ],
    thresholdGroup: cls.groupKey,
    normalThreshold: cls.group.normal,
    isDemo: opts.isDemo,
    modelSource: init.modelSource,
    modelVersion: init.modelVersion,
    durationMs: Math.round(performance.now() - t0),
  };
  const palmEst = checks.find((c) => c.region === 'palm');
  if (palmEst && palmEst.anemiaProbability !== undefined) {
    const excluded = confounderFactor('palm', palmEst.conditions, palmEst.imageFlags) === 0;
    outcome.palmCheck = {
      probability: palmEst.anemiaProbability,
      looksAnemic: !!palmEst.looksAnemic,
      excluded,
      disagrees: !excluded && !!palmEst.looksAnemic !== outcome.anemia,
    };
  }
  if (outcome.durationMs > appConfig.processingBudgetMs) {
    console.warn(
      `[HemoScan] pipeline took ${outcome.durationMs} ms (budget ${appConfig.processingBudgetMs} ms)`,
    );
  }
  return { kind: 'ok', outcome, samples, warnings: init.warnings };
}
