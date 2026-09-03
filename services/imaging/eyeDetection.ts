import { EyeDetectionResult } from './eyeDetection.types';

/**
 * Native (iOS/Android): real face/eye landmark detection would need a
 * native ML module (e.g. ML Kit Face Detection or MediaPipe's native
 * runtime), which requires a custom Expo dev-client/EAS build not available
 * in this environment (same constraint as native OCR/STT — see
 * PROJECT.md). Rather than fabricate a detection result, this reports
 * itself unavailable so the camera flow falls back to the manual alignment
 * guide (reticle) honestly instead of pretending to auto-detect.
 */
export async function detectEyeRegion(_imageUri: string): Promise<EyeDetectionResult> {
  return { isAvailable: false, found: false };
}
