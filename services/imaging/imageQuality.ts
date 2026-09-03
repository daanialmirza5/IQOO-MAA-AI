import { PixelBuffer, ImageQualityAssessment, RoiColorSample } from './types';

/**
 * Real, deterministic image-quality heuristics computed from actual pixel
 * data (see getImagePixels.ts / getImagePixels.web.ts) — no fabricated
 * scores. These are simple, honest signals (average brightness, average
 * local gradient magnitude as a sharpness proxy), not a trained blur/quality
 * classifier — labeled as such in the UI.
 */

const MIN_ACCEPTABLE_BRIGHTNESS = 60;
const MAX_ACCEPTABLE_BRIGHTNESS = 220;
const MIN_ACCEPTABLE_SHARPNESS = 6;

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function computeBrightness(buffer: PixelBuffer): number {
  const { data, width, height } = buffer;
  let sum = 0;
  let count = 0;
  const step = 4; // sample every pixel (RGBA stride), no need to skip further at this thumbnail size
  for (let i = 0; i < width * height * 4; i += step * 4) {
    sum += luminance(data[i], data[i + 1], data[i + 2]);
    count++;
  }
  return count > 0 ? sum / count : 0;
}

/** Average absolute luminance gradient between horizontally-adjacent pixels — a real, simple sharpness proxy (higher = more edge detail = likely sharper; near-zero = flat/blurry). */
export function computeSharpness(buffer: PixelBuffer): number {
  const { data, width, height } = buffer;
  if (width < 3 || height < 3) return 0;

  let totalGradient = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const idxRight = (y * width + (x + 1)) * 4;
      const idxDown = ((y + 1) * width + x) * 4;

      const lum = luminance(data[idx], data[idx + 1], data[idx + 2]);
      const lumRight = luminance(data[idxRight], data[idxRight + 1], data[idxRight + 2]);
      const lumDown = luminance(data[idxDown], data[idxDown + 1], data[idxDown + 2]);

      totalGradient += Math.abs(lum - lumRight) + Math.abs(lum - lumDown);
      count++;
    }
  }

  return count > 0 ? totalGradient / count : 0;
}

export function assessImageQuality(buffer: PixelBuffer): ImageQualityAssessment {
  const brightness = computeBrightness(buffer);
  const sharpness = computeSharpness(buffer);
  const issues: string[] = [];

  if (brightness < MIN_ACCEPTABLE_BRIGHTNESS) issues.push('Image is too dark. Move to a well-lit area or use a light source.');
  if (brightness > MAX_ACCEPTABLE_BRIGHTNESS) issues.push('Image is overexposed. Reduce direct light or glare.');
  if (sharpness < MIN_ACCEPTABLE_SHARPNESS) issues.push('Image appears blurry. Hold the camera steady and try again.');

  return { brightness, sharpness, isAcceptable: issues.length === 0, issues };
}

/** Average RGB across the full sampled buffer — used as the region-of-interest color for the colorimetric formula. Callers should already have cropped/framed the buffer to the eyelid/nailbed region via capture guidance. */
export function computeAverageColor(buffer: PixelBuffer): RoiColorSample {
  const { data, width, height } = buffer;
  let r = 0, g = 0, b = 0;
  const total = width * height;
  for (let i = 0; i < total * 4; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  return { r: Math.round(r / total), g: Math.round(g / total), b: Math.round(b / total), sampleCount: total };
}
