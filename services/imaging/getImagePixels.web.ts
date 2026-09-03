import { PixelBuffer } from './types';
import { EyeRegionBox } from './eyeDetection.types';

const MAX_DIMENSION = 200;

/**
 * Web implementation: draws the actual captured/uploaded photo onto an
 * offscreen canvas and reads real pixel data via getImageData. This is
 * genuine per-pixel image analysis — nothing here is simulated. If a crop
 * region is supplied (from real eye-landmark detection — see
 * eyeDetection.web.ts), only that region of the source image is drawn, so
 * every downstream pixel is already scoped to the detected eye area.
 */
export async function getImagePixels(uri: string, cropRegion?: EyeRegionBox): Promise<PixelBuffer> {
  const img = await loadImage(uri);

  const sourceX = cropRegion?.x ?? 0;
  const sourceY = cropRegion?.y ?? 0;
  const sourceWidth = cropRegion?.width ?? img.width;
  const sourceHeight = cropRegion?.height ?? img.height;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);

  return { data: new Uint8Array(imageData.data.buffer), width, height };
}

function loadImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = uri;
  });
}
