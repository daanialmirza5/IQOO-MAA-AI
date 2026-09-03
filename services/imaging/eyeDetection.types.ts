export interface EyeRegionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EyeDetectionResult {
  /** false on platforms where real face/eye landmark detection isn't available in this build. */
  isAvailable: boolean;
  found: boolean;
  region?: EyeRegionBox;
}
