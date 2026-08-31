import { RiskLevel } from '../../types/mother';

export type QualitativeConfidence = 'LOW' | 'MODERATE' | 'HIGH';

export interface AnemiaScreeningInput {
  motherId: string;
  knownHemoglobin?: number;
  hasPallorSymptoms?: boolean;
  gestationalAgeWeeks?: number;
  targetType?: 'eyelid' | 'nailbed';
}

export interface AnemiaScreeningOutput {
  riskLevel: RiskLevel;
  finding: string;
  confidenceLabel: QualitativeConfidence;
  reasons: string[];
  recommendation: string;
  requiresClinicalConfirmation: boolean;
}
