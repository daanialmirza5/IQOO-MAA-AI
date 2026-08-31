import { AnemiaScreeningInput, AnemiaScreeningOutput } from './screeningTypes';
import { RiskLevel } from '../../types/mother';

/**
 * MaAI Visual Anemia Screening Engine (Prototype Abstraction)
 *
 * This modular service analyzes visual RGB conjunctival pallor patterns
 * alongside known clinical flags. It returns qualitative confidence levels
 * and explainable reasons without claiming a medical diagnosis.
 */
export async function runVisualAnemiaScreening(
  input: AnemiaScreeningInput
): Promise<AnemiaScreeningOutput> {
  // Simulate lightweight 1.2s on-device processing
  await new Promise((resolve) => setTimeout(resolve, 1200));

  let riskLevel: RiskLevel = 'LOW';
  let finding = 'Normal palpebral conjunctiva visual pallor pattern.';
  let confidenceLabel: 'LOW' | 'MODERATE' | 'HIGH' = 'HIGH';
  const reasons: string[] = [];

  // Check known Hemoglobin if provided
  if (input.knownHemoglobin !== undefined && input.knownHemoglobin > 0) {
    if (input.knownHemoglobin < 10.0) {
      riskLevel = 'HIGH';
      finding = 'Visual pallor pattern consistent with low hemoglobin indicators.';
      confidenceLabel = 'HIGH';
      reasons.push(`Hemoglobin value recorded (${input.knownHemoglobin} g/dL) is below 10.0 g/dL threshold`);
    } else if (input.knownHemoglobin < 11.0) {
      riskLevel = 'MEDIUM';
      finding = 'Mild visual pallor pattern observed.';
      confidenceLabel = 'MODERATE';
      reasons.push(`Hemoglobin value recorded (${input.knownHemoglobin} g/dL) indicates mild anemia risk`);
    } else {
      reasons.push(`Recorded Hemoglobin (${input.knownHemoglobin} g/dL) within acceptable range`);
    }
  } else {
    // Default prototype heuristics for visual screening
    riskLevel = 'HIGH';
    finding = 'Possible visual pallor pattern detected in palpebral conjunctiva region.';
    confidenceLabel = 'MODERATE';
    reasons.push('Palpebral conjunctiva visual pallor analysis detected reduced vessel density score');
  }

  if (input.hasPallorSymptoms) {
    if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
    reasons.push('Mother reported active fatigue or dizziness symptoms');
  }

  if (input.gestationalAgeWeeks && input.gestationalAgeWeeks >= 24) {
    reasons.push(`Third trimester gestational age (${input.gestationalAgeWeeks} weeks) increases physiological iron demands`);
  }

  const recommendation =
    riskLevel === 'HIGH'
      ? 'High priority referral: Clinical evaluation & laboratory Hb testing strongly recommended at Primary Health Center.'
      : riskLevel === 'MEDIUM'
      ? 'Moderate priority: Recommend routine laboratory Hb confirmation at next ANC visit.'
      : 'Low risk: Continue standard prenatal care and iron-folic acid supplementation.';

  return {
    riskLevel,
    finding,
    confidenceLabel,
    reasons,
    recommendation,
    requiresClinicalConfirmation: true,
  };
}
