import { ExtractedLabFields, FieldExtractionResult } from './types';

/** Physiologically plausible ranges — values outside these are flagged, never silently trusted. */
const RANGES = {
  hemoglobin: { min: 3, max: 20 },
  bpSystolic: { min: 70, max: 220 },
  bpDiastolic: { min: 40, max: 140 },
  gestationalAgeWeeks: { min: 1, max: 42 },
  glucose: { min: 40, max: 400 },
};

/**
 * Real regex-based parsing of OCR'd (or manually typed) lab report text into
 * structured fields. Deliberately permissive patterns since real-world
 * report formats vary a lot — every match is still surfaced to the user for
 * confirmation before it's ever saved (see ReportScannerModal), so a
 * mis-parse is caught by a human, not silently trusted.
 */
export function extractFieldsFromText(text: string): FieldExtractionResult {
  const fields: ExtractedLabFields = {};
  const fieldsFound: (keyof ExtractedLabFields)[] = [];
  const outOfRangeWarnings: string[] = [];

  const hbMatch = text.match(/h[ae]?mo?g?l?o?b?i?n?\.?\s*\(?hb\)?\s*[:\-]?\s*(\d{1,2}(?:\.\d{1,2})?)/i) || text.match(/\bhb\b\s*[:\-]?\s*(\d{1,2}(?:\.\d{1,2})?)/i);
  if (hbMatch) {
    const value = parseFloat(hbMatch[1]);
    fields.hemoglobin = value;
    fieldsFound.push('hemoglobin');
    if (value < RANGES.hemoglobin.min || value > RANGES.hemoglobin.max) {
      outOfRangeWarnings.push(`Hemoglobin ${value} g/dL is outside the plausible range (${RANGES.hemoglobin.min}-${RANGES.hemoglobin.max}) — please verify.`);
    }
  }

  const bpMatch = text.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
  if (bpMatch) {
    const systolic = parseInt(bpMatch[1], 10);
    const diastolic = parseInt(bpMatch[2], 10);
    fields.bloodPressure = `${systolic}/${diastolic}`;
    fieldsFound.push('bloodPressure');
    if (systolic < RANGES.bpSystolic.min || systolic > RANGES.bpSystolic.max || diastolic < RANGES.bpDiastolic.min || diastolic > RANGES.bpDiastolic.max) {
      outOfRangeWarnings.push(`Blood pressure ${systolic}/${diastolic} mmHg is outside the plausible range — please verify.`);
    }
  }

  const gaMatch = text.match(/(\d{1,2})\s*(?:weeks|wks|w\b)/i);
  if (gaMatch) {
    const value = parseInt(gaMatch[1], 10);
    fields.gestationalAgeWeeks = value;
    fieldsFound.push('gestationalAgeWeeks');
    if (value < RANGES.gestationalAgeWeeks.min || value > RANGES.gestationalAgeWeeks.max) {
      outOfRangeWarnings.push(`Gestational age ${value} weeks is outside the plausible range — please verify.`);
    }
  }

  const albuminMatch = text.match(/album[i1]n\s*[:\-]?\s*(nil|trace|absent|\d\+)/i);
  if (albuminMatch) {
    fields.albumin = albuminMatch[1].charAt(0).toUpperCase() + albuminMatch[1].slice(1).toLowerCase();
    fieldsFound.push('albumin');
  }

  const glucoseMatch = text.match(/glucose\s*[:\-]?\s*(\d{2,3})/i);
  if (glucoseMatch) {
    const value = parseInt(glucoseMatch[1], 10);
    fields.glucose = value;
    fieldsFound.push('glucose');
    if (value < RANGES.glucose.min || value > RANGES.glucose.max) {
      outOfRangeWarnings.push(`Glucose ${value} mg/dL is outside the plausible range — please verify.`);
    }
  }

  return { fields, fieldsFound, outOfRangeWarnings };
}

export function isValueInRange(field: keyof typeof RANGES, value: number): boolean {
  const range = RANGES[field];
  return value >= range.min && value <= range.max;
}
