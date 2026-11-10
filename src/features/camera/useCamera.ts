import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraError = 'permissionDenied' | 'notFound' | 'insecure' | 'unknown';

interface TorchCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

/**
 * getUserMedia camera hook: prefers the rear camera at ~720p, turns the torch
 * on where supported (consistent lighting), and exposes a capture function
 * that returns a full-resolution JPEG Blob.
 *
 * Works in browsers over HTTPS / localhost and inside the Capacitor Android
 * WebView (CAMERA permission is declared in AndroidManifest.xml).
 */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<CameraError | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setReady(false);
    setTorchOn(false);
  }, []);

  const setTorch = useCallback(async (on: boolean) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
      setTorchOn(on);
    } catch {
      setTorchOn(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      if (!window.isSecureContext) {
        setError('insecure');
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('notFound');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }
        const track = stream.getVideoTracks()[0];
        const caps = (track.getCapabilities?.() ?? {}) as TorchCapabilities;
        const supported = !!caps.torch;
        setTorchSupported(supported);
        if (supported) await setTorch(true);
        // Lock focus/exposure to continuous where supported.
        track
          .applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] })
          .catch(() => undefined);
        setReady(true);
      } catch (e) {
        const name = (e as DOMException)?.name;
        setError(
          name === 'NotAllowedError' || name === 'SecurityError'
            ? 'permissionDenied'
            : name === 'NotFoundError' || name === 'OverconstrainedError'
              ? 'notFound'
              : 'unknown',
        );
      }
    })();
    return () => {
      cancelled = true;
      stop();
    };
  }, [facing, setTorch, stop]);

  /** Captures the current frame at native resolution as JPEG. */
  const capture = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const c = document.createElement('canvas');
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    c.getContext('2d')!.drawImage(video, 0, 0);
    return new Promise((resolve) => c.toBlob((b) => resolve(b), 'image/jpeg', 0.92));
  }, []);

  const switchCamera = useCallback(
    () => setFacing((f) => (f === 'environment' ? 'user' : 'environment')),
    [],
  );

  return { videoRef, ready, error, facing, switchCamera, torchSupported, torchOn, setTorch, capture, stop };
}
