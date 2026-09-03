import { RiskLevel } from './mother';

export type ScreeningType =
  | 'VISUAL_ANEMIA'
  | 'REPORT_OCR'
  | 'VOICE_CHECKIN'
  | 'PREGNANCY_RISK'
  | 'SYMPTOM_CHECK'
  | 'COMBINED';

export interface ScreeningResult {
  id: string;
  motherId: string;
  motherName: string;
  gestationalAgeWeeks: number;
  timestamp: string;
  type: ScreeningType;
  overallRisk: RiskLevel;
  anemiaRisk: RiskLevel;
  anemiaReason?: string;
  pregnancyRisk: RiskLevel;
  pregnancyRiskReasons?: string[];
  symptomRisk: RiskLevel;
  symptomsChecked?: string[];
  reasons: string[];
  recommendation: string;
  capturedImageUri?: string;
  isPrototypeEngine: boolean;
  // Report OCR specifics
  extractedHb?: number;
  extractedBp?: string;
  previousHb?: number;
  hbDelta?: number;
  hbTrend?: 'STABLE' | 'IMPROVING' | 'DECLINING';
  // Voice specifics
  voiceTranscript?: string;
  extractedSymptoms?: string[];
  detectedLanguage?: string;
}

