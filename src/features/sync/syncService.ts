import { appConfig } from '@/config/appConfig';
import { contributionRepo } from '@/db/repositories';
import { useSettings } from '@/store/settingsStore';

/**
 * STUB sync API. No real server is shipped or hardcoded — set
 * `VITE_SYNC_API_BASE_URL` to point at your own backend implementing:
 *
 *   POST {base}/contributions        multipart: meta (JSON), image (JPEG ROI crop)
 *   GET  {base}/models/latest        → { version: string, files: string[] }
 */
export interface SyncApi {
  uploadContribution(
    meta: { region: string; features: number[]; hbEstimate: number; consent: true; appVersion: string },
    image?: Blob,
  ): Promise<void>;
  latestModelVersion(): Promise<{ version: string; files: string[] } | null>;
}

export class HttpSyncApi implements SyncApi {
  constructor(private readonly baseUrl: string) {}

  async uploadContribution(meta: Parameters<SyncApi['uploadContribution']>[0], image?: Blob) {
    const body = new FormData();
    body.append('meta', JSON.stringify(meta));
    if (image) body.append('image', image, 'roi.jpg');
    const res = await fetch(`${this.baseUrl}/contributions`, { method: 'POST', body });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  }

  async latestModelVersion() {
    const res = await fetch(`${this.baseUrl}/models/latest`);
    return res.ok ? ((await res.json()) as { version: string; files: string[] }) : null;
  }
}

let running = false;

/**
 * Uploads pending opt-in contributions (anonymized: region, color features,
 * estimate, ROI crop — no name, age or device id). Runs only when ALL are true:
 * sync enabled in Settings, data contribution opted-in, an endpoint is
 * configured, and the device is online. This is the web equivalent of an
 * Android WorkManager job; it is triggered when connectivity returns.
 */
export async function runSyncIfEnabled(): Promise<{ uploaded: number; latestModel?: string } | null> {
  const s = useSettings.getState();
  if (running || !s.syncEnabled || !appConfig.syncApiBaseUrl || !navigator.onLine) return null;
  running = true;
  try {
    const api: SyncApi = new HttpSyncApi(appConfig.syncApiBaseUrl);
    let uploaded = 0;
    if (s.dataContribution) {
      const pending = await contributionRepo.pending();
      const done: number[] = [];
      for (const c of pending) {
        await api.uploadContribution(
          {
            region: c.region,
            features: c.features,
            hbEstimate: c.hbEstimate,
            consent: true,
            appVersion: appConfig.appVersion,
          },
          c.image,
        );
        done.push(c.id!);
      }
      if (done.length) await contributionRepo.markUploaded(done);
      uploaded = done.length;
    }
    const latest = await api.latestModelVersion().catch(() => null);
    return { uploaded, latestModel: latest?.version };
  } catch (e) {
    console.warn('[sync] failed', e);
    return null;
  } finally {
    running = false;
  }
}

export function startSyncListener() {
  window.addEventListener('online', () => void runSyncIfEnabled());
  setTimeout(() => void runSyncIfEnabled(), 5000);
}
