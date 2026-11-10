import { create } from 'zustand';
import type { QualityReport, Region, ReportedCondition, ScanOutcome } from '@/ml/types';
import type { QuestionAnswer, QuestionId } from '@/db/db';
import type { RoiSample } from '@/features/scan/runPipeline';

export type InputSource = 'camera' | 'upload' | 'demo';

export interface CapturedImage {
  blob: Blob;
  source: InputSource;
  /** Quick quality result computed right after capture/upload. */
  quality?: QualityReport;
  /** Demo sample id (for demo mode). */
  demoId?: string;
}

interface RetakeInfo {
  region: Region;
  source: InputSource;
  quality: QualityReport | null;
  /** Set when the region itself could not be found in the image. */
  noRegion?: boolean;
}

interface ScanSessionState {
  /** Regions to capture, in order. */
  queue: Region[];
  index: number;
  captures: Partial<Record<Region, CapturedImage>>;
  isDemo: boolean;
  retake: RetakeInfo | null;
  outcome: ScanOutcome | null;
  /** ROI crops + features, kept in memory only (used for opt-in contribution). */
  samples: RoiSample[];
  savedScanId: number | null;
  answers: Partial<Record<QuestionId, QuestionAnswer>>;
  /** Pre-scan checklist answers per region (crying, polish, injury, short nails …). */
  conditions: Partial<Record<Region, ReportedCondition[]>>;

  setConditions: (region: Region, c: ReportedCondition[]) => void;
  start: (regions: Region[], opts?: { demo?: boolean }) => void;
  current: () => Region | undefined;
  setCapture: (region: Region, image: CapturedImage) => void;
  /** Advances to the next region; returns false when all regions are captured. */
  advance: () => boolean;
  setRetake: (info: RetakeInfo | null) => void;
  setOutcome: (o: ScanOutcome | null, samples?: RoiSample[]) => void;
  setSavedScanId: (id: number | null) => void;
  setAnswers: (a: Partial<Record<QuestionId, QuestionAnswer>>) => void;
  reset: () => void;
}

const initial = {
  queue: [] as Region[],
  index: 0,
  captures: {},
  isDemo: false,
  retake: null,
  outcome: null,
  samples: [] as RoiSample[],
  savedScanId: null,
  answers: {},
  conditions: {},
};

/** In-memory state of the scan in progress (never persisted — images stay in RAM only). */
export const useScanSession = create<ScanSessionState>()((set, get) => ({
  ...initial,
  start: (regions, opts) => set({ ...initial, queue: regions, isDemo: !!opts?.demo }),
  current: () => get().queue[get().index],
  setCapture: (region, image) => set((s) => ({ captures: { ...s.captures, [region]: image } })),
  advance: () => {
    const { index, queue } = get();
    if (index + 1 < queue.length) {
      set({ index: index + 1 });
      return true;
    }
    return false;
  },
  setRetake: (retake) => set({ retake }),
  setOutcome: (outcome, samples = []) => set({ outcome, samples, savedScanId: null }),
  setSavedScanId: (savedScanId) => set({ savedScanId }),
  setAnswers: (answers) => set({ answers }),
  setConditions: (region, c) => set((s) => ({ conditions: { ...s.conditions, [region]: c } })),
  reset: () => set(initial),
}));
