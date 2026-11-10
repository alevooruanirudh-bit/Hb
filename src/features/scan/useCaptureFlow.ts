import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useScanSession, type InputSource } from '@/store/scanStore';
import { appConfig } from '@/config/appConfig';
import { pipelineWorker } from '@/workers/workerClient';
import type { Region } from '@/ml/types';
import { quickCheck } from './runPipeline';

/**
 * Whether the mock provider should be used, given the Settings override.
 * Demo sample images are synthetic drawings, so they always use the mock.
 */
/**
 * Every result — camera, upload and sample images — comes from the trained models.
 * The stand-in formula is only reachable in development with VITE_USE_MOCK_MODELS=true.
 */
export function resolveUseMock(): boolean {
  return appConfig.useMockModels;
}

/**
 * Shared "an image for region X arrived" flow used by the camera, upload and
 * demo inputs: quick quality/region check → Retake screen, or store the image
 * and move to the next region / processing.
 */
export function useCaptureFlow() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (region: Region, blob: Blob, source: InputSource, demoId?: string) => {
      setBusy(true);
      setError(null);
      try {
        await pipelineWorker.init(resolveUseMock());
        const check = await quickCheck(region, blob);
        const s = useScanSession.getState();
        if (!('ok' in check)) {
          s.setRetake({ region, source, quality: check.quality, noRegion: check.noRegion });
          navigate('/scan/retake');
          return;
        }
        s.setCapture(region, { blob, source, quality: check.quality, demoId });
        s.setRetake(null);
        // Next region that still has no image (a retake may have come from the middle of the queue).
        const { queue, captures } = useScanSession.getState();
        const next = queue.findIndex((r) => !captures[r]);
        if (next >= 0) {
          useScanSession.setState({ index: next });
          navigate('/scan/method', { replace: true });
        } else {
          navigate('/scan/processing', { replace: true });
        }
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [navigate],
  );

  return { submit, busy, error };
}

/**
 * Opens the gallery / file picker. On Android (Capacitor) the native photo
 * picker is used; on the web a hidden <input type="file">.
 */
export async function pickImage(): Promise<Blob | null> {
  if (Capacitor.isNativePlatform()) {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    try {
      const photo = await Camera.getPhoto({
        source: CameraSource.Photos,
        resultType: CameraResultType.Uri,
        quality: 92,
      });
      if (!photo.webPath) return null;
      return await (await fetch(photo.webPath)).blob();
    } catch {
      return null; // user cancelled
    }
  }
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}
