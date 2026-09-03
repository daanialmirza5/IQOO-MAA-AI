/** A small RGBA pixel buffer, platform-agnostic once extracted. */
export interface PixelBuffer {
  data: Uint8Array; // RGBA, 4 bytes per pixel
  width: number;
  height: number;
}

export interface ImageQualityAssessment {
  brightness: number; // 0-255 average luminance
  sharpness: number; // relative edge-energy score, higher = sharper
  isAcceptable: boolean;
  issues: string[];
}

export interface RoiColorSample {
  r: number;
  g: number;
  b: number;
  sampleCount: number;
}
