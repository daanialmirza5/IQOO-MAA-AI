import { extractSymptomsFromText } from './symptomExtraction';

export interface VoiceAnalysisResult {
  transcript: string;
  detectedLanguage: string;
  extractedSymptoms: string[];
  dangerSigns: string[];
  riskContribution: 'LOW' | 'MEDIUM' | 'HIGH';
  clinicalNote: string;
}

/**
 * Runs the transparent keyword-matching symptom extractor (see
 * symptomExtraction.ts) against a REAL transcript — either real speech
 * recognized by the browser's Web Speech API (web) or text the user typed
 * themselves. This is never presented as a trained NLP model; it's an
 * auditable dictionary match, which is exactly what's shown to the user for
 * confirmation before anything is saved.
 */
export function analyzeVoiceTranscript(transcript: string, language: 'Hindi' | 'English'): VoiceAnalysisResult {
  const { symptoms, dangerSigns } = extractSymptomsFromText(transcript);

  const riskContribution: VoiceAnalysisResult['riskContribution'] = dangerSigns.length > 0 ? 'HIGH' : symptoms.length > 0 ? 'MEDIUM' : 'LOW';

  const clinicalNote =
    dangerSigns.length > 0
      ? `Danger sign(s) reported: ${dangerSigns.join(', ')}. Immediate clinical evaluation recommended.`
      : symptoms.length > 0
      ? `Reported symptoms noted: ${symptoms.join(', ')}. Add to longitudinal record and monitor.`
      : 'No specific symptoms detected in this check-in.';

  return {
    transcript,
    detectedLanguage: language,
    extractedSymptoms: symptoms,
    dangerSigns,
    riskContribution,
    clinicalNote,
  };
}

/** Native path (no transcript exists) — builds the same result shape directly from a manual quick-select, so downstream code (risk engine, saving) doesn't need to know which input path was used. */
export function buildResultFromManualSelection(selectedSymptoms: string[], dangerSigns: string[], notes: string, language: 'Hindi' | 'English'): VoiceAnalysisResult {
  const riskContribution: VoiceAnalysisResult['riskContribution'] = dangerSigns.length > 0 ? 'HIGH' : selectedSymptoms.length > 0 ? 'MEDIUM' : 'LOW';
  return {
    transcript: notes || selectedSymptoms.join(', '),
    detectedLanguage: language,
    extractedSymptoms: selectedSymptoms,
    dangerSigns,
    riskContribution,
    clinicalNote:
      dangerSigns.length > 0
        ? `Danger sign(s) reported: ${dangerSigns.join(', ')}. Immediate clinical evaluation recommended.`
        : selectedSymptoms.length > 0
        ? `Reported symptoms noted: ${selectedSymptoms.join(', ')}.`
        : 'No specific symptoms selected.',
  };
}
