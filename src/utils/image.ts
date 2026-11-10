import type { RGBAImage } from '@/imageProcessing/types';

/** Decoded image, ready for MediaPipe (canvas) and the worker (pixels). */
export interface DecodedImage {
  canvas: HTMLCanvasElement;
  pixels: RGBAImage;
}

/**
 * Decodes a Blob (camera capture / upload / demo sample) and downscales it so
 * its longest side is ≤ maxSide — keeps memory and time low on 2 GB phones.
 * EXIF orientation is honoured by `createImageBitmap(..., {imageOrientation})`.
 */
export async function decodeImage(blob: Blob, maxSide: number): Promise<DecodedImage> {
  let bitmap: ImageBitmap | HTMLImageElement;
  try {
    bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    bitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not decode image'));
      img.src = URL.createObjectURL(blob);
    });
  }
  const w0 = bitmap.width;
  const h0 = bitmap.height;
  const s = Math.min(1, maxSide / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * s));
  const h = Math.max(1, Math.round(h0 * s));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, w, h);
  if ('close' in bitmap) bitmap.close();
  const data = ctx.getImageData(0, 0, w, h);
  return { canvas, pixels: { width: w, height: h, data: data.data } };
}

/** Copies an RGBA image (so one copy can be transferred to the worker). */
export function cloneImage(img: RGBAImage): RGBAImage {
  return { width: img.width, height: img.height, data: new Uint8ClampedArray(img.data) };
}

/** Encodes RGBA pixels to a JPEG blob (used only for opt-in data contribution). */
export async function toJpegBlob(img: RGBAImage, quality = 0.85): Promise<Blob> {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  c.getContext('2d')!.putImageData(
    new ImageData(new Uint8ClampedArray(img.data), img.width, img.height),
    0,
    0,
  );
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', quality),
  );
}
