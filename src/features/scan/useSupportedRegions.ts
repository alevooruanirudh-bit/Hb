import { useEffect, useState } from 'react';
import { ALL_REGIONS, type Region } from '@/ml/types';
import { pipelineWorker } from '@/workers/workerClient';
import { useSettings } from '@/store/settingsStore';
import { resolveUseMock } from './useCaptureFlow';

/**
 * Regions the active models can estimate. Trained models only cover regions
 * for which public data with lab hemoglobin exists (currently eye + nails).
 */
export function useSupportedRegions(): {
  regions: Region[];
  likelihoodRegions: Region[];
  modelSource: 'mock' | 'real' | null;
} {
  const modelMode = useSettings((s) => s.modelMode);
  const [state, setState] = useState<{ regions: Region[]; likelihoodRegions: Region[]; modelSource: 'mock' | 'real' | null }>({
    regions: ALL_REGIONS,
    likelihoodRegions: [],
    modelSource: null,
  });
  useEffect(() => {
    let alive = true;
    pipelineWorker
      .init(resolveUseMock())
      .then((r) => {
        if (!alive) return;
        const regions = ALL_REGIONS.filter((x) => r.regions.includes(x));
        setState({
          regions: regions.length ? regions : ALL_REGIONS,
          likelihoodRegions: r.likelihoodRegions ?? [],
          modelSource: r.modelSource,
        });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [modelMode]);
  return state;
}
