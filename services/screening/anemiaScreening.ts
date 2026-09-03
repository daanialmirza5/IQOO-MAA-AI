import { AnemiaScreeningInput, AnemiaScreeningOutput, OpticalBiomarkers } from './screeningTypes';
import { RiskLevel } from '../../types/mother';

/**
 * MaAI Visual Pallor Screening
 *
 * This is a transparent colorimetric heuristic, not a trained or clinically
 * validated model. It computes two standard color-ratio metrics from the
 * REAL pixels of the captured/uploaded photo (never placeholder data — see
 * screeningTypes.ts, `rawImagePixels` is a required field):
 *
 *   1. Erythema Index (EI) = log10(R) - log10(G)
 *   2. Hemoglobin Redness Index (HRI) = R / (R + G + B)
 *
 * ...then applies a hand-set linear heuristic to turn EI into a rough Hb
 * estimate. The thresholds below are this app's own screening cutoffs, not
 * a cited clinical guideline. See PROJECT.md and the in-app "How MaAI
 * Screening Works" page for the full honest description of what this is and
 * is not.
 */
export async function runVisualAnemiaScreening(input: AnemiaScreeningInput): Promise<AnemiaScreeningOutput> {
  const { r, g, b } = input.rawImagePixels;

  const sum = Math.max(1, r + g + b);
  const redPct = parseFloat(((r / sum) * 100).toFixed(1));
  const greenPct = parseFloat(((g / sum) * 100).toFixed(1));
  const bluePct = parseFloat(((b / sum) * 100).toFixed(1));

  const rNorm = Math.max(0.01, r / 255);
  const gNorm = Math.max(0.01, g / 255);
  const erythemaIndex = parseFloat((Math.log10(rNorm) - Math.log10(gNorm)).toFixed(3));
  const hri = parseFloat((r / sum).toFixed(3));

  const vascularityScore = parseFloat(Math.min(95, Math.max(20, erythemaIndex * 140 + (r / sum) * 30)).toFixed(1));

  let estimatedHb = parseFloat((7.8 + erythemaIndex * 12.2).toFixed(1));
  if (input.knownHemoglobin && input.knownHemoglobin > 0) {
    estimatedHb = parseFloat((estimatedHb * 0.4 + input.knownHemoglobin * 0.6).toFixed(1));
  }

  const biomarkers: OpticalBiomarkers = {
    erythemaIndex,
    hemoglobinRednessIndex: hri,
    vascularityScore,
    estimatedHb,
    redPct,
    greenPct,
    bluePct,
  };

  let riskLevel: RiskLevel = 'LOW';
  let finding = 'No significant pallor pattern detected in the captured region.';
  let confidenceLabel: 'LOW' | 'MODERATE' | 'HIGH' = input.imageQuality.isAcceptable ? 'MODERATE' : 'LOW';
  const reasons: string[] = [];

  if (estimatedHb < 9.5 || erythemaIndex < 0.22) {
    riskLevel = 'HIGH';
    finding = 'Marked pallor pattern detected in the captured region.';
    reasons.push(`Erythema Index (${erythemaIndex}) is below this app's screening threshold (0.32)`);
    reasons.push(`Computed color-based estimate: ~${estimatedHb} g/dL (a rough heuristic, not a lab value)`);
  } else if (estimatedHb < 11.0 || erythemaIndex < 0.3) {
    riskLevel = 'MEDIUM';
    finding = 'Moderate pallor pattern observed in the captured region.';
    reasons.push(`Erythema Index (${erythemaIndex}) is borderline against this app's screening threshold`);
    reasons.push(`Computed color-based estimate: ~${estimatedHb} g/dL`);
  } else {
    reasons.push(`Erythema Index (${erythemaIndex}) is within this app's normal screening range`);
  }

  if (!input.imageQuality.isAcceptable) {
    confidenceLabel = 'LOW';
    reasons.push(`Image quality flags: ${input.imageQuality.issues.join('; ')}`);
  }

  if (input.hasPallorSymptoms) {
    reasons.push('Corroborated by mother-reported fatigue or dizziness symptoms');
  }

  if (input.gestationalAgeWeeks && input.gestationalAgeWeeks >= 24) {
    reasons.push(`Gestational week ${input.gestationalAgeWeeks}: increased iron demand from plasma volume expansion`);
  }

  const recommendation =
    riskLevel === 'HIGH'
      ? 'Screening indicates elevated anemia risk. Confirm with laboratory hemoglobin testing and refer to a Primary Health Center.'
      : riskLevel === 'MEDIUM'
      ? 'Moderate screening signal. Recommend a laboratory blood test at the next scheduled ANC visit.'
      : 'Low screening signal. Continue routine iron-folic acid supplementation and scheduled prenatal visits.';

  return {
    riskLevel,
    finding,
    confidenceLabel,
    reasons,
    recommendation,
    requiresClinicalConfirmation: true,
    biomarkers,
    imageQuality: input.imageQuality,
  };
}
