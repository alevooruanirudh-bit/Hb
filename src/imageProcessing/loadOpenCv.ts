/* eslint-disable @typescript-eslint/no-explicit-any */

let loading: Promise<any> | null = null;

/**
 * Waits for the Emscripten runtime. NOTE: never `await` the module directly —
 * it is itself a thenable that resolves to itself, which makes `await` loop
 * forever on microtasks (and starves timers). We strip `then` before resolving.
 */
function readyModule(mod: any): Promise<any> {
  return new Promise((resolve) => {
    const done = (m: any) => {
      if (m && typeof m.then === 'function') delete m.then;
      resolve(m);
    };
    if (mod instanceof Promise) {
      mod.then(done);
    } else if (mod?.Mat) {
      done(mod);
    } else if (typeof mod?.then === 'function') {
      mod.then((m: any) => done(m));
    } else {
      mod.onRuntimeInitialized = () => done(mod);
    }
  });
}

/**
 * Loads the locally bundled OpenCV.js (public/vendor/opencv/opencv.js) inside a
 * Web Worker. The file is a UMD script, so it is fetched and evaluated in
 * global scope (module workers cannot use importScripts). The service worker
 * caches it, so this works offline.
 *
 * Resolves to the `cv` namespace, or rejects on timeout / error — callers fall
 * back to the pure-JS backend.
 */
export function loadOpenCv(url: string, timeoutMs = 20_000): Promise<any> {
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('OpenCV.js load timeout')), timeoutMs);
    (async () => {
      const g = globalThis as any;
      if (!g.cv) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`OpenCV.js HTTP ${res.status}`);
        const code = await res.text();
        // Indirect eval → runs in global scope so the UMD wrapper assigns `self.cv`.
        (0, eval)(code);
      }
      const cv = await readyModule(g.cv);
      clearTimeout(timer);
      resolve(cv);
    })().catch((e) => {
      clearTimeout(timer);
      loading = null;
      reject(e);
    });
  });
  return loading;
}
