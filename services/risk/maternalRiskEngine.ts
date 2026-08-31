import { Mother, RiskLevel } from '../../types/mother';

export interface UnifiedRiskInput {
  mother: Mother;
  visualScreeningRisk?: RiskLevel;
  visualScreeningFinding?: string;
  customBp?: string;
  customHb?: number;
  customSymptoms?: string[];
  missedVisitsCount?: number;
}

export interface UnifiedRiskAssessment {
  overallRisk: RiskLevel;
  riskFactors: string[];
  whyFlagged: string[]; // 2 to 4 clear, concrete reasons
  priorityAction: string;
  recommendation: string;
  referralRecommended: boolean;
  followUpRequired: boolean;
  requiresClinicalConfirmation: boolean;
}

/**
 * Unified Multi-Signal Maternal Risk Engine
 * Evaluates 8 distinct health signals to synthesize explainable risk support.
 */
export function evaluateUnifiedMaternalRisk(
  input: UnifiedRiskInput
): UnifiedRiskAssessment {
  const { mother, visualScreeningRisk, visualScreeningFinding, customBp, customHb, customSymptoms, missedVisitsCount } = input;

  const whyFlagged: string[] = [];
  const riskFactors: string[] = [];

  let riskPoints = 0;

  // Signal 1: Visual Screening Result
  if (visualScreeningRisk === 'HIGH') {
    riskPoints += 3;
    whyFlagged.push('Possible visual pallor pattern detected on camera screening');
    riskFactors.push('Visual Conjunctival Pallor');
  } else if (visualScreeningRisk === 'MEDIUM') {
    riskPoints += 1.5;
    whyFlagged.push('Moderate visual pallor indicators observed');
    riskFactors.push('Moderate Visual Pallor');
  }

  // Signal 2: Hemoglobin
  const hb = customHb !== undefined ? customHb : mother.hemoglobin;
  if (hb !== undefined && hb > 0) {
    if (hb < 10.0) {
      riskPoints += 3;
      whyFlagged.push(`Recorded Hemoglobin (${hb} g/dL) is below severe threshold (< 10.0 g/dL)`);
      riskFactors.push('Low Hemoglobin');
    } else if (hb < 11.0) {
      riskPoints += 1.5;
      whyFlagged.push(`Hemoglobin (${hb} g/dL) indicates mild/moderate anemia (< 11.0 g/dL)`);
      riskFactors.push('Mild Low Hemoglobin');
    }
  }

  // Signal 3: Blood Pressure (Pre-eclampsia check)
  const bp = customBp || mother.bloodPressure;
  if (bp) {
    const parts = bp.split('/');
    if (parts.length === 2) {
      const sys = parseInt(parts[0], 10);
      const dia = parseInt(parts[1], 10);
      if (sys >= 140 || dia >= 90) {
        riskPoints += 3;
        whyFlagged.push(`Elevated blood pressure recorded (${bp} mmHg)`);
        riskFactors.push('Hypertension / Pre-eclampsia Risk');
      } else if (sys >= 130 || dia >= 85) {
        riskPoints += 1;
        whyFlagged.push(`Borderline blood pressure (${bp} mmHg)`);
        riskFactors.push('Borderline BP');
      }
    }
  }

  // Signal 4: Previous Pregnancy Complications
  if (mother.previousComplications && mother.previousComplications.trim().length > 0) {
    riskPoints += 2;
    whyFlagged.push(`History of pregnancy complications: "${mother.previousComplications}"`);
    riskFactors.push('Previous Pregnancy Complication');
  }

  // Signal 5: Missed Visits / ANC Follow-ups Overdue
  const missedCount = missedVisitsCount !== undefined ? missedVisitsCount : (mother.needsFollowUp || mother.dueToday ? 1 : 0);
  if (missedCount > 0) {
    riskPoints += 2;
    whyFlagged.push('ANC follow-up or scheduled visit overdue');
    riskFactors.push('Overdue ANC Visit');
  }

  // Signal 6: Current Symptoms (Danger Signs)
  const symptoms = customSymptoms || mother.currentSymptoms || [];
  const dangerSymptoms = symptoms.filter((s) =>
    ['Severe headache', 'Blurred vision', 'Excessive swelling', 'Bleeding', 'Fever', 'Reduced fetal movement'].some(
      (d) => s.toLowerCase().includes(d.toLowerCase())
    )
  );

  if (dangerSymptoms.length > 0) {
    riskPoints += 3;
    whyFlagged.push(`Maternal danger sign reported: ${dangerSymptoms.join(', ')}`);
    riskFactors.push('Maternal Danger Sign');
  } else if (symptoms.length > 0) {
    riskPoints += 1;
    whyFlagged.push(`Active reported symptoms: ${symptoms.join(', ')}`);
    riskFactors.push('Active Symptoms');
  }

  // Signal 7: Gestational Age Risk Factors
  if (mother.gestationalAgeWeeks >= 34) {
    riskFactors.push('Late Gestational Stage (34+ Weeks)');
  }

  // Signal 8: High Risk Age (< 18 or > 35)
  if (mother.age < 18 || mother.age > 35) {
    riskPoints += 1;
    whyFlagged.push(`Maternal age (${mother.age} yrs) requires heightened ANC vigilance`);
    riskFactors.push('Maternal Age Risk');
  }

  // Fallback if no specific flags
  if (whyFlagged.length === 0) {
    whyFlagged.push('Routine gestational monitoring');
  }

  // Synthesize Overall Risk Level
  let overallRisk: RiskLevel = 'LOW';
  if (riskPoints >= 3 || dangerSymptoms.length > 0) {
    overallRisk = 'HIGH';
  } else if (riskPoints >= 1.5) {
    overallRisk = 'MEDIUM';
  }

  const referralRecommended = overallRisk === 'HIGH';
  const followUpRequired = overallRisk !== 'LOW';

  const priorityAction =
    overallRisk === 'HIGH'
      ? 'IMMEDIATE CLINICAL REFERRAL'
      : overallRisk === 'MEDIUM'
      ? 'SCHEDULE ANC FOLLOW-UP VISIT'
      : 'ROUTINE PRENATAL CARE';

  const recommendation =
    overallRisk === 'HIGH'
      ? 'Clinical evaluation recommended. Confirm visual screening findings through laboratory Hb testing and physician examination.'
      : overallRisk === 'MEDIUM'
      ? 'Schedule a follow-up ANC visit within 3-5 days for blood pressure check & nutritional monitoring.'
      : 'Continue regular iron-folic acid supplementation and standard prenatal care visits.';

  return {
    overallRisk,
    riskFactors,
    whyFlagged: whyFlagged.slice(0, 4), // Ensure top 2-4 concrete reasons
    priorityAction,
    recommendation,
    referralRecommended,
    followUpRequired,
    requiresClinicalConfirmation: true,
  };
}
