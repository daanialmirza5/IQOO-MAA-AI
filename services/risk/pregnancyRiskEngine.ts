import { RiskLevel } from '../../types/mother';

export interface PregnancyRiskInput {
  age: number;
  gestationalAgeWeeks: number;
  gravida: number;
  para: number;
  previousComplications?: string;
  hemoglobin?: number;
  bloodPressure?: string;
  weight?: number;
  symptoms?: string[];
  missedVisitsCount?: number;
}

export interface PregnancyRiskAssessment {
  overallRisk: RiskLevel;
  reasons: string[];
  recommendedAction: string;
  highPriorityFlags: string[];
}

export function calculatePregnancyRisk(input: PregnancyRiskInput): PregnancyRiskAssessment {
  const reasons: string[] = [];
  const flags: string[] = [];

  let riskScore = 0;

  // 1. Age risk factor
  if (input.age < 18 || input.age > 35) {
    riskScore += 2;
    reasons.push(`Maternal age (${input.age} yrs) outside optimal range (<18 or >35)`);
  }

  // 2. High Parity / Gravida
  if (input.gravida >= 4) {
    riskScore += 2;
    reasons.push(`High parity / gravida (${input.gravida} pregnancies)`);
  }

  // 3. Previous complications
  if (input.previousComplications && input.previousComplications.trim() !== '' && input.previousComplications !== 'None') {
    riskScore += 3;
    reasons.push(`Previous pregnancy complication recorded: ${input.previousComplications}`);
  }

  // 4. Blood pressure check
  if (input.bloodPressure) {
    const parts = input.bloodPressure.split('/');
    if (parts.length === 2) {
      const sys = parseInt(parts[0], 10);
      const dia = parseInt(parts[1], 10);
      if (sys >= 140 || dia >= 90) {
        riskScore += 4;
        reasons.push(`Elevated blood pressure recorded (${input.bloodPressure} mmHg)`);
        flags.push('Elevated BP');
      } else if (sys >= 130 || dia >= 85) {
        riskScore += 2;
        reasons.push(`Borderline blood pressure (${input.bloodPressure} mmHg)`);
      }
    }
  }

  // 5. Hemoglobin check
  if (input.hemoglobin !== undefined) {
    if (input.hemoglobin < 9.0) {
      riskScore += 4;
      reasons.push(`Severe low hemoglobin recorded (${input.hemoglobin} g/dL)`);
      flags.push('Severe Anemia Risk');
    } else if (input.hemoglobin < 11.0) {
      riskScore += 2;
      reasons.push(`Possible anemia risk (Hb ${input.hemoglobin} g/dL)`);
    }
  }

  // 6. Symptoms
  if (input.symptoms && input.symptoms.length > 0) {
    const criticalSymptoms = ['Severe headache', 'Blurred vision', 'Excessive swelling', 'Bleeding', 'Reduced fetal movement'];
    const selectedCritical = input.symptoms.filter((s) => criticalSymptoms.includes(s));
    
    if (selectedCritical.length > 0) {
      riskScore += 4;
      reasons.push(`Critical symptoms present: ${selectedCritical.join(', ')}`);
      flags.push('Critical Warning Symptoms');
    } else {
      riskScore += input.symptoms.length;
      reasons.push(`Symptoms reported: ${input.symptoms.join(', ')}`);
    }
  }

  // 7. Missed visits
  if (input.missedVisitsCount && input.missedVisitsCount > 0) {
    riskScore += 2;
    reasons.push(`Missed ${input.missedVisitsCount} scheduled ANC follow-up visit(s)`);
  }

  // Determine final risk level
  let overallRisk: RiskLevel = 'LOW';
  let recommendedAction = 'Routine antenatal care and regular follow-up schedule.';

  if (riskScore >= 5 || flags.length > 0) {
    overallRisk = 'HIGH';
    recommendedAction = 'Referral to healthcare facility (PHC / CHC) for clinical evaluation recommended.';
  } else if (riskScore >= 2) {
    overallRisk = 'MEDIUM';
    recommendedAction = 'Close monitoring and follow-up screening recommended within 7 days.';
  }

  if (reasons.length === 0) {
    reasons.push('All parameters within standard reference ranges.');
  }

  return {
    overallRisk,
    reasons,
    recommendedAction,
    highPriorityFlags: flags,
  };
}
