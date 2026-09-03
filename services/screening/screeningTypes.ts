import { RiskLevel } from '../../types/mother';
import { ImageQualityAssessment } from '../imaging/types';

export type QualitativeConfidence = 'LOW' | 'MODERATE' | 'HIGH';

export interface OpticalBiomarkers {
  erythemaIndex: number; // EI = log(R) - log(G)
  hemoglobinRednessIndex: number; // HRI = R / (R + G + B)
  vascularityScore: number; // Heuristic microcapillary density estimate (%)
  estimatedHb: number; // Heuristic continuous estimate, NOT a lab-equivalent value
  redPct: number;
  greenPct: number;
  bluePct: number;
}

export interface AnemiaScreeningInput {
  motherId: string;
  knownHemoglobin?: number;
  hasPallorSymptoms?: boolean;
  gestationalAgeWeeks?: number;
  targetType?: 'eyelid' | 'nailbed';
  /** Real pixels sampled from the actual captured/uploaded photo. Required — this
   * screening never runs on placeholder or fabricated color data. */
  rawImagePixels: { r: number; g: number; b: number };
  imageQuality: ImageQualityAssessment;
}

export interface AnemiaScreeningOutput {
  riskLevel: RiskLevel;
  finding: string;
  confidenceLabel: QualitativeConfidence;
  reasons: string[];
  recommendation: string;
  requiresClinicalConfirmation: boolean;
  biomarkers: OpticalBiomarkers;
  imageQuality: ImageQualityAssessment;
}
