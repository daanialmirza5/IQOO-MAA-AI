import { Platform } from 'react-native';
import { Mother } from '../../types/mother';
import { recognizeText } from './ocrEngine';
import { extractFieldsFromText } from './fieldExtraction';
import { ExtractedLabFields } from './types';

export interface ExtractedRecordResult {
  reportName: string;
  extractionMethod: 'OCR_WEB' | 'MANUAL_ENTRY';
  fields: ExtractedLabFields;
  fieldsFound: (keyof ExtractedLabFields)[];
  outOfRangeWarnings: string[];
  ocrConfidence?: number;
  rawText?: string;
  previousHb?: number;
  hbTrend: 'STABLE' | 'IMPROVING' | 'DECLINING';
  explanation: string;
}

export const isOcrAvailableOnThisPlatform = Platform.OS === 'web';

function computeTrend(current: number | undefined, previous: number | undefined): 'STABLE' | 'IMPROVING' | 'DECLINING' {
  if (current === undefined || previous === undefined) return 'STABLE';
  const delta = current - previous;
  if (delta <= -0.5) return 'DECLINING';
  if (delta >= 0.5) return 'IMPROVING';
  return 'STABLE';
}

/**
 * Runs real OCR (web only — see ocrEngine.ts) against a captured/uploaded
 * report photo, extracts structured fields from the recognized text, and
 * compares against the mother's most recent prior reading. Every field is
 * returned for the caller to show as an editable confirm-before-save form —
 * nothing here is written to a record directly.
 */
export async function analyzeReportDocument(mother: Mother, imageUri: string, reportLabel: string): Promise<ExtractedRecordResult> {
  const previousHb = mother.hemoglobin;

  const ocr = await recognizeText(imageUri);
  const extraction = extractFieldsFromText(ocr.rawText);

  const explanation =
    extraction.fieldsFound.length === 0
      ? 'No recognizable lab values were found in this photo. You can enter values manually below.'
      : `Extracted ${extraction.fieldsFound.length} field(s) from the report. Please review each value before saving.`;

  return {
    reportName: reportLabel,
    extractionMethod: 'OCR_WEB',
    fields: extraction.fields,
    fieldsFound: extraction.fieldsFound,
    outOfRangeWarnings: extraction.outOfRangeWarnings,
    ocrConfidence: ocr.confidence,
    rawText: ocr.rawText,
    previousHb,
    hbTrend: computeTrend(extraction.fields.hemoglobin, previousHb),
    explanation,
  };
}

/** Native path: no OCR runs at all — this just packages the mother's prior Hb for trend comparison once the user finishes manual entry. */
export function buildManualEntryContext(mother: Mother): { previousHb?: number; reportLabel: string } {
  return { previousHb: mother.hemoglobin, reportLabel: 'Manually entered report' };
}
