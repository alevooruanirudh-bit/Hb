import type { RGBAImage } from '@/imageProcessing/types';
import type { QualityReport, Region, RegionDetection, RegionEstimate, TrainingPopulation } from '@/ml/types';

/** Messages the main thread sends to the pipeline worker. */
export type WorkerRequest =
  | { type: 'init'; baseUrl: string; useMock: boolean }
  | { type: 'quality'; image: RGBAImage }
  | { type: 'prepare'; image: RGBAImage }
  | {
      type: 'analyze';
      region: Region;
      image: RGBAImage;
      detection: RegionDetection;
      quality: QualityReport;
      subject?: { ageYears: number; sex?: string };
    };

export interface InitResult {
  backend: 'opencv' | 'js';
  modelSource: 'mock' | 'real';
  modelVersion: string;
  /** Regions the loaded models support (trained models may lack palm). */
  regions: Region[];
  /** Regions with only an anemia classifier (no Hb value). */
  likelihoodRegions?: Region[];
  /** Training population per region (real models). */
  populations?: Partial<Record<Region, TrainingPopulation>>;
  /** e.g. "realModelsMissing" when real models were requested but not installed. */
  warnings: string[];
}

export interface PrepareResult {
  quality: QualityReport;
  preprocessed: RGBAImage | null;
}

export interface AnalyzeResult {
  estimate: RegionEstimate;
  roi: RGBAImage;
  colorFeatures: number[];
}

export type WorkerResponse<T = unknown> =
  { id: number; ok: true; result: T } | { id: number; ok: false; error: string };
