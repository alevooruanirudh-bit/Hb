import { useEffect, useState } from 'react';
import type { ModelInfo } from '@/ml/realModelProvider';
import { assetUrl } from '@/utils/assetUrl';
import { appConfig } from '@/config/appConfig';

let cached: Promise<ModelInfo | null> | null = null;

/** Loads public/models/model-info.json once (training data, metrics). */
export function useModelInfo(): ModelInfo | null {
  const [info, setInfo] = useState<ModelInfo | null>(null);
  useEffect(() => {
    cached ??= fetch(assetUrl(appConfig.modelInfoUrl))
      .then((r) => (r.ok ? (r.json() as Promise<ModelInfo>) : null))
      .catch(() => null);
    let alive = true;
    void cached.then((v) => alive && setInfo(v));
    return () => {
      alive = false;
    };
  }, []);
  return info;
}
