import type { RGBAImage } from '@/imageProcessing/types';
import type { QualityReport, Region, RegionDetection } from '@/ml/types';
import type { AnalyzeResult, InitResult, PrepareResult, WorkerRequest, WorkerResponse } from './protocol';

/**
 * Promise-based client for the pipeline Web Worker. A single worker instance is
 * shared app-wide and re-initialised only when the model mode changes.
 */
class PipelineWorkerClient {
  private worker: Worker | null = null;
  private seq = 0;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private initPromise: Promise<InitResult> | null = null;
  private initMock: boolean | null = null;

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('./pipeline.worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (ev: MessageEvent<WorkerResponse>) => {
        const p = this.pending.get(ev.data.id);
        if (!p) return;
        this.pending.delete(ev.data.id);
        if (ev.data.ok) p.resolve(ev.data.result);
        else p.reject(new Error(ev.data.error));
      };
      this.worker.onerror = (e) => {
        this.pending.forEach((p) => p.reject(new Error(e.message || 'Worker error')));
        this.pending.clear();
      };
    }
    return this.worker;
  }

  private call<T>(req: WorkerRequest, transfer: Transferable[] = []): Promise<T> {
    const w = this.ensureWorker();
    const id = ++this.seq;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
      w.postMessage({ ...req, id }, transfer);
    });
  }

  /** Initialises OpenCV.js + models once (or again if the model mode changed). */
  init(useMock: boolean): Promise<InitResult> {
    if (this.initPromise && this.initMock === useMock) return this.initPromise;
    this.initMock = useMock;
    this.initPromise = this.call<InitResult>({ type: 'init', baseUrl: document.baseURI, useMock }).catch(
      (e) => {
        this.initPromise = null;
        throw e;
      },
    );
    return this.initPromise;
  }

  quality(image: RGBAImage): Promise<QualityReport> {
    return this.call({ type: 'quality', image });
  }

  /** Quality check + preprocessing. The input buffer is copied (not transferred) so callers can reuse it. */
  prepare(image: RGBAImage): Promise<PrepareResult> {
    return this.call({ type: 'prepare', image });
  }

  analyze(
    region: Region,
    image: RGBAImage,
    detection: RegionDetection,
    quality: QualityReport,
    subject?: { ageYears: number; sex?: string },
  ): Promise<AnalyzeResult> {
    return this.call({ type: 'analyze', region, image, detection, quality, subject }, [image.data.buffer]);
  }
}

export const pipelineWorker = new PipelineWorkerClient();
