/**
 * Resolves a path inside `public/` to an absolute URL. The app uses a relative
 * base (`./`) + HashRouter so the same build works on any web host, as an
 * installed PWA and inside the Capacitor WebView.
 */
export function assetUrl(path: string): string {
  return new URL(path, document.baseURI).href;
}
