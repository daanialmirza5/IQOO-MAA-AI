import { Mother, RiskLevel } from '../../types/mother';
import { EvidenceItem } from '../../types/domain';

/**
 * MaAI's single canonical risk engine. Previously the codebase had two
 * separate engines (`maternalRiskEngine` used by the live screening flow,
 * `pregnancyRiskEngine` used only by the standalone risk-check form) with
 * different scoring scales — consolidated here into one engine so there is
 * exactly one source of truth for "how risky is this mother."
 *
 * This is deliberately a transparent, deterministic, additive rule engine —
 * not a trained model. That is a feature for a clinical decision-support
 * tool (auditable, explainable, testable) — see PROJECT.md for why nothing
 * here should be described to end users as "AI diagnosis."
 */

export const ENGINE_VERSION = '2.0.0';

/** Canonical danger-sign vocabulary. Matched by exact string equality
 * against structured symptom values (from the symptom checklist or a
 * confirmed voice/OCR extraction) — never by loose substring matching,
 * which previously caused false positives (e.g. "dard" alone matching
 * inside unrelated phrases). */
export const DANGER_SIGNS = [
  'Severe headache',
  'Blurred vision',
  'Excessive swelling',
  'Vaginal bleeding',
  'High fever',
  'Reduced fetal movement',
  'Convulsions',
  'Severe abdominal pain',
] as const;

export const RISK_WEIGHTS = {
  hbDeclineTrajectory: 2.5,
  bpRisingTrajectory: 1.5,
  visualHigh: 3,
  visualMedium: 1.5,
  hbSevere: 4, // Hb < 10.0 — an absolute clinical red flag, sufficient alone to reach HIGH
  hbMild: 1.5, // Hb 10.0–10.99
  bpHigh: 4, // sys >= 140 or dia >= 90 — the clinical hypertension/pre-eclampsia threshold, sufficient alone to reach HIGH
  bpBorderline: 1, // sys >= 130 or dia >= 85
  previousComplication: 2,
  overdueVisit: 1.5,
  dangerSign: 3, // also short-circuits to HIGH regardless of total score
  activeSymptom: 1,
  ageOutOfRange: 1,
} as const;

export const RISK_THRESHOLDS = {
  high: 3.5,
  medium: 1.5,
} as const;

export interface UnifiedRiskInput {
  mother: Mother;
  visualScreeningRisk?: RiskLevel;
  visualScreeningFinding?: string;
  customBp?: string;
  customHb?: number;
  customSymptoms?: string[];
  missedVisitsCount?: number;
}

export interface EvidenceBreakdown {
  clinical: string[];
  visual: string[];
  voice: string[];
  trajectory: string[];
}

export interface UnifiedRiskAssessment {
  overallRisk: RiskLevel;
  score: number;
  riskFactors: string[];
  whyFlagged: string[];
  priorityAction: string;
  recommendation: string;
  referralRecommended: boolean;
  followUpRequired: boolean;
  requiresClinicalConfirmation: boolean;
  trajectoryTrend?: 'STABLE' | 'IMPROVING' | 'DECLINING';
  trajectorySummary?: string;
  evidenceBreakdown: EvidenceBreakdown;
  evidenceItems: EvidenceItem[];
  engineVersion: string;
}

export function evaluateUnifiedMaternalRisk(input: UnifiedRiskInput): UnifiedRiskAssessment {
  const { mother, visualScreeningRisk, visualScreeningFinding, customBp, customHb, customSymptoms, missedVisitsCount } = input;

  const whyFlagged: string[] = [];
  const riskFactors: string[] = [];
  const evidenceItems: EvidenceItem[] = [];
  const evidence: EvidenceBreakdown = { clinical: [], visual: [], voice: [], trajectory: [] };

  let score = 0;
  let trajectoryTrend: 'STABLE' | 'IMPROVING' | 'DECLINING' = 'STABLE';
  let trajectorySummary: string | undefined;

  const addFactor = (points: number, label: string, detail: string, bucket: keyof EvidenceBreakdown) => {
    score += points;
    whyFlagged.push(detail);
    riskFactors.push(label);
    evidence[bucket].push(detail);
    evidenceItems.push({ label, detail, points });
  };

  // Signal 1: Longitudinal trajectory ("risk doesn't start at red")
  const readings = mother.readings || [];
  if (readings.length >= 2) {
    const sorted = [...readings].sort((a, b) => a.week - b.week);
    const prev = sorted[sorted.length - 2];
    const curr = sorted[sorted.length - 1];

    if (prev.hemoglobin && curr.hemoglobin) {
      const hbDiff = curr.hemoglobin - prev.hemoglobin;
      if (hbDiff <= -0.5) {
        trajectoryTrend = 'DECLINING';
        addFactor(
          RISK_WEIGHTS.hbDeclineTrajectory,
          'Declining Hb Trajectory',
          `Hb declining (${prev.hemoglobin} → ${curr.hemoglobin} g/dL, Δ${hbDiff.toFixed(1)})`,
          'trajectory'
        );
        trajectorySummary = `Downward Hb trajectory from Week ${prev.week} to Week ${curr.week}`;
      } else if (hbDiff >= 0.5) {
        trajectoryTrend = 'IMPROVING';
        evidence.trajectory.push(`Hb improving (+${hbDiff.toFixed(1)} g/dL)`);
      }
    }

    if (prev.bloodPressure && curr.bloodPressure) {
      const prevSys = parseInt(prev.bloodPressure.split('/')[0], 10);
      const currSys = parseInt(curr.bloodPressure.split('/')[0], 10);
      if (Number.isFinite(prevSys) && Number.isFinite(currSys) && currSys - prevSys >= 15) {
        addFactor(
          RISK_WEIGHTS.bpRisingTrajectory,
          'Upward BP Trajectory',
          `Blood pressure rising (${prev.bloodPressure} → ${curr.bloodPressure} mmHg)`,
          'trajectory'
        );
      }
    }
  }

  // Signal 2: Visual screening (MaAI Vision)
  if (visualScreeningRisk === 'HIGH') {
    addFactor(
      RISK_WEIGHTS.visualHigh,
      'Visual Conjunctival Pallor',
      visualScreeningFinding || 'Elevated pallor pattern detected on camera screening',
      'visual'
    );
  } else if (visualScreeningRisk === 'MEDIUM') {
    addFactor(RISK_WEIGHTS.visualMedium, 'Moderate Visual Pallor', 'Moderate pallor indicators observed on camera screening', 'visual');
  }

  // Signal 3: Clinical hemoglobin
  const hb = customHb !== undefined ? customHb : mother.hemoglobin;
  if (hb !== undefined && hb > 0) {
    if (hb < 10.0) {
      addFactor(RISK_WEIGHTS.hbSevere, 'Low Hemoglobin (< 10.0)', `Hemoglobin (${hb} g/dL) below 10.0 g/dL threshold`, 'clinical');
    } else if (hb < 11.0) {
      addFactor(RISK_WEIGHTS.hbMild, 'Mild Low Hemoglobin', `Hemoglobin (${hb} g/dL) indicates mild/moderate anemia`, 'clinical');
    } else {
      evidence.clinical.push(`Hemoglobin stable at ${hb} g/dL`);
    }
  }

  // Signal 4: Blood pressure
  const bp = customBp || mother.bloodPressure;
  if (bp) {
    const [sysStr, diaStr] = bp.split('/');
    const sys = parseInt(sysStr, 10);
    const dia = parseInt(diaStr, 10);
    if (Number.isFinite(sys) && Number.isFinite(dia)) {
      if (sys >= 140 || dia >= 90) {
        addFactor(RISK_WEIGHTS.bpHigh, 'Hypertension / Pre-eclampsia Risk', `Elevated blood pressure (${bp} mmHg)`, 'clinical');
      } else if (sys >= 130 || dia >= 85) {
        addFactor(RISK_WEIGHTS.bpBorderline, 'Borderline BP', `Borderline elevated blood pressure (${bp} mmHg)`, 'clinical');
      } else {
        evidence.clinical.push(`Blood pressure normal at ${bp} mmHg`);
      }
    }
  }

  // Signal 5: Previous complications
  if (mother.previousComplications && mother.previousComplications.trim().length > 0 && mother.previousComplications !== 'None') {
    addFactor(RISK_WEIGHTS.previousComplication, 'Previous Pregnancy Complication', `History of complications: "${mother.previousComplications}"`, 'clinical');
  }

  // Signal 6: Missed ANC visits
  const missedCount = missedVisitsCount !== undefined ? missedVisitsCount : mother.needsFollowUp || mother.dueToday ? 1 : 0;
  if (missedCount > 0) {
    addFactor(RISK_WEIGHTS.overdueVisit, 'Overdue ANC Visit', 'Scheduled ANC visit or routine follow-up overdue', 'clinical');
  }

  // Signal 7: Reported symptoms (MaAI Voice / symptom checklist) — danger
  // signs are matched by EXACT string equality against the canonical
  // vocabulary, never substring matching.
  const symptoms = customSymptoms || mother.currentSymptoms || [];
  const dangerSymptoms = symptoms.filter((s) => (DANGER_SIGNS as readonly string[]).includes(s));
  const nonDangerSymptoms = symptoms.filter((s) => !dangerSymptoms.includes(s));

  if (dangerSymptoms.length > 0) {
    addFactor(RISK_WEIGHTS.dangerSign, 'Maternal Danger Sign', `Danger sign reported: ${dangerSymptoms.join(', ')}`, 'voice');
  }
  if (nonDangerSymptoms.length > 0) {
    addFactor(RISK_WEIGHTS.activeSymptom, 'Active Reported Symptoms', `Active reported symptoms: ${nonDangerSymptoms.join(', ')}`, 'voice');
  }

  // Signal 8: Age & gestation context
  if (mother.gestationalAgeWeeks >= 32) {
    evidence.clinical.push(`Third trimester (${mother.gestationalAgeWeeks}w) requires heightened vigilance`);
  }
  if (mother.age < 18 || mother.age > 35) {
    addFactor(RISK_WEIGHTS.ageOutOfRange, 'Maternal Age Risk', `Maternal age (${mother.age} yrs) requires increased monitoring`, 'clinical');
  }

  // A danger sign ALWAYS forces HIGH risk regardless of accumulated score —
  // this must never be overridable by a low numerical total.
  let overallRisk: RiskLevel = 'LOW';
  if (score >= RISK_THRESHOLDS.high || dangerSymptoms.length > 0) {
    overallRisk = 'HIGH';
  } else if (score >= RISK_THRESHOLDS.medium || trajectoryTrend === 'DECLINING') {
    overallRisk = 'MEDIUM';
  }

  const referralRecommended = overallRisk === 'HIGH';
  const followUpRequired = overallRisk !== 'LOW';

  const priorityAction =
    overallRisk === 'HIGH'
      ? 'Priority clinical referral & visit'
      : overallRisk === 'MEDIUM'
      ? 'Schedule ANC follow-up visit'
      : 'Continue routine prenatal care';

  const recommendation =
    overallRisk === 'HIGH'
      ? 'Screening indicates elevated risk. Prompt clinical evaluation and laboratory confirmation recommended.'
      : overallRisk === 'MEDIUM'
      ? 'Follow-up recommended within 3–5 days. Trajectory shows early deterioration before an emergency threshold.'
      : 'Low risk. Continue regular iron-folic acid supplementation and standard ANC checkups.';

  if (whyFlagged.length === 0) {
    whyFlagged.push('Routine gestational monitoring — no elevated signals detected.');
  }

  return {
    overallRisk,
    score,
    riskFactors,
    whyFlagged: whyFlagged.slice(0, 4),
    priorityAction,
    recommendation,
    referralRecommended,
    followUpRequired,
    requiresClinicalConfirmation: true,
    trajectoryTrend,
    trajectorySummary,
    evidenceBreakdown: evidence,
    evidenceItems,
    engineVersion: ENGINE_VERSION,
  };
}

/**
 * Convenience wrapper for flows that only have raw form inputs (age, BP, Hb,
 * symptoms...) rather than a full `Mother` record — e.g. the standalone
 * Risk Check screen. Builds a minimal synthetic Mother and delegates to the
 * one canonical engine above instead of maintaining a second scoring scale.
 */
export function evaluateRiskFromRawInputs(input: {
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
}): UnifiedRiskAssessment {
  const syntheticMother: Mother = {
    id: 'transient',
    name: '',
    age: input.age,
    phone: '',
    village: '',
    emergencyContact: '',
    gestationalAgeWeeks: input.gestationalAgeWeeks,
    expectedDeliveryDate: '',
    gravida: input.gravida,
    para: input.para,
    previousComplications: input.previousComplications,
    hemoglobin: input.hemoglobin,
    bloodPressure: input.bloodPressure,
    weight: input.weight,
    currentSymptoms: input.symptoms,
    riskLevel: 'LOW',
    createdAt: '',
    updatedAt: '',
  };
  return evaluateUnifiedMaternalRisk({ mother: syntheticMother, missedVisitsCount: input.missedVisitsCount });
}
