/// <reference lib="webworker" />
import { JsOps } from '@/imageProcessing/jsOps';
import { OpenCvOps } from '@/imageProcessing/opencvOps';
import { loadOpenCv } from '@/imageProcessing/loadOpenCv';
import { QualityChecker } from '@/imageProcessing/qualityChecker';
import { Preprocessor } from '@/imageProcessing/preprocessor';
import type { ImageOps } from '@/imageProcessing/types';
import { MockModelProvider } from '@/ml/mockModelProvider';
import { RealModelProvider } from '@/ml/realModelProvider';
import type { ModelProvider } from '@/ml/modelProvider';
import { analyzeRegion } from '@/ml/regionAnalyzer';
import { appConfig } from '@/config/appConfig';
import type { AnalyzeResult, InitResult, PrepareResult, WorkerRequest, WorkerResponse } from './protocol';

/**
 * Pipeline Web Worker — keeps heavy image processing and inference off the UI
 * thread: QualityChecker → Preprocessor → (ROI from main thread) →
 * FeatureExtractor → FallbackDecider → Predictor.
 */
declare const self: DedicatedWorkerGlobalScope;

let ops: ImageOps = new JsOps();
let provider: ModelProvider = new MockModelProvider();
let quality = new QualityChecker(ops);
let pre = new Preprocessor(ops);
let initResult: InitResult | null = null;

async function init(baseUrl: string, useMock: boolean): Promise<InitResult> {
  const warnings: string[] = [];
  try {
    const cv = await loadOpenCv(new URL(appConfig.openCvUrl, baseUrl).href);
    ops = new OpenCvOps(cv);
  } catch (e) {
    console.warn('[worker] OpenCV.js unavailable, using JS image backend', e);
    ops = new JsOps();
    warnings.push('openCvUnavailable');
  }
  quality = new QualityChecker(ops);
  pre = new Preprocessor(ops);

  if (useMock) {
    provider = new MockModelProvider();
  } else {
    const real = new RealModelProvider(
      new URL(appConfig.cnnModelUrl, baseUrl).href,
      new URL(appConfig.modelInfoUrl, baseUrl).href,
    );
    try {
      await real.init();
      provider = real;
    } catch (e) {
      // Never show a stand-in number in place of a real analysis: fail visibly instead
      // (the Processing screen offers "Try again").
      console.error('[worker] trained models failed to load', e);
      throw e;
    }
  }
  await provider.init();
  initResult = {
    backend: ops.name,
    modelSource: provider.source,
    modelVersion: provider.version,
    regions: provider.regions,
    populations: provider.populations,
    likelihoodRegions: provider.likelihoodRegions ?? [],
    warnings,
  };
  return initResult;
}

self.onmessage = async (ev: MessageEvent<WorkerRequest & { id: number }>) => {
  const { id, ...req } = ev.data;
  const reply = (msg: WorkerResponse, transfer: Transferable[] = []) => self.postMessage(msg, transfer);
  try {
    switch (req.type) {
      case 'init': {
        reply({ id, ok: true, result: await init(req.baseUrl, req.useMock) });
        break;
      }
      case 'quality': {
        reply({ id, ok: true, result: quality.check(req.image) });
        break;
      }
      case 'prepare': {
        const q = quality.check(req.image);
        const result: PrepareResult = {
          quality: q,
          preprocessed:
            q.status === 'fail' ? null : pre.process(req.image, { sharpen: q.reasons.includes('slightlyBlurry') }).image,
        };
        reply({ id, ok: true, result }, result.preprocessed ? [result.preprocessed.data.buffer] : []);
        break;
      }
      case 'analyze': {
        const out = await analyzeRegion(
          { region: req.region, image: req.image, detection: req.detection, quality: req.quality, subject: req.subject },
          provider,
        );
        const result: AnalyzeResult = {
          estimate: out.estimate,
          roi: out.roi,
          colorFeatures: out.colorFeatures,
        };
        reply({ id, ok: true, result }, [out.roi.data.buffer]);
        break;
      }
    }
  } catch (e) {
    reply({ id, ok: false, error: e instanceof Error ? e.message : String(e) });
  }
};
