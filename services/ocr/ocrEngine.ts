import { OcrRecognitionResult } from './types';

/**
 * Native (iOS/Android) has no on-device OCR in this build. Real OCR on
 * native requires either a native ML module (e.g. ML Kit text recognition)
 * — which needs a custom dev-client/EAS build not available in this
 * environment — or a paid cloud OCR API, which would need backend
 * infrastructure this app doesn't have. Rather than fake a result, this
 * throws a typed error the UI uses to route to a manual-entry-with-photo
 * flow instead. See services/ocr/ocrEngine.web.ts for the real
 * implementation that does run on web.
 */
export async function recognizeText(_imageUri: string): Promise<OcrRecognitionResult> {
  throw new Error('OCR_NOT_AVAILABLE_ON_THIS_PLATFORM');
}
