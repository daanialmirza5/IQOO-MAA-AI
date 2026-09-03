import { OcrRecognitionResult } from './types';

let workerPromise: Promise<import('tesseract.js').Worker> | null = null;

async function getWorker() {
  if (!workerPromise) {
    // Dynamic import so Tesseract's WASM/worker assets are only ever
    // fetched on web, in this platform-specific (.web.ts) module.
    workerPromise = import('tesseract.js').then(({ createWorker }) => createWorker('eng'));
  }
  return workerPromise;
}

/**
 * Real, client-side OCR using Tesseract.js — runs entirely in the browser,
 * no backend or API key. This is the one platform in this build where OCR
 * genuinely happens; see ocrEngine.ts (native) for why mobile does not.
 */
export async function recognizeText(imageUri: string): Promise<OcrRecognitionResult> {
  const worker = await getWorker();
  const { data } = await worker.recognize(imageUri);
  return {
    rawText: data.text,
    confidence: (data.confidence ?? 0) / 100,
  };
}
