export interface OcrRecognitionResult {
  rawText: string;
  confidence: number; // 0-1, from the OCR engine itself
}

export interface ExtractedLabFields {
  hemoglobin?: number;
  bloodPressure?: string;
  gestationalAgeWeeks?: number;
  albumin?: string;
  glucose?: number;
}

export interface FieldExtractionResult {
  fields: ExtractedLabFields;
  /** Which fields were actually found in the text vs. left blank. */
  fieldsFound: (keyof ExtractedLabFields)[];
  /** Values that parsed but fall outside a plausible physiological range — flagged, never silently accepted. */
  outOfRangeWarnings: string[];
}
