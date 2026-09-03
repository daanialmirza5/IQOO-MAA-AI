import { RiskLevel } from './mother';

/** A mother's pregnancy record — normalized out of the old embedded-on-Mother fields. */
export interface Pregnancy {
  id: string;
  motherId: string;
  gestationalAgeWeeks: number;
  gestationalAgeAsOf: string;
  expectedDeliveryDate: string;
  gravida: number;
  para: number;
  previousComplications?: string;
  existingConditions?: string[];
  status: 'ACTIVE' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

export type ExtractionMethod = 'OCR_WEB' | 'MANUAL_ENTRY' | 'MANUAL_WITH_PHOTO';
export type LabReportStatus = 'PENDING_CONFIRMATION' | 'CONFIRMED';

export interface LabReportFields {
  hemoglobin?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  gestationalAgeWeeks?: number;
  albumin?: string;
  glucose?: number;
}

export interface LabReport {
  id: string;
  motherId: string;
  sourceImageUri?: string;
  extractionMethod: ExtractionMethod;
  rawFields: LabReportFields;
  confirmedFields?: LabReportFields;
  ocrConfidence?: number;
  status: LabReportStatus;
  createdAt: string;
}

export type SymptomSource = 'VOICE' | 'MANUAL' | 'SYMPTOM_CHECKLIST';

export interface Symptom {
  id: string;
  motherId: string;
  symptom: string;
  isDangerSign: boolean;
  source: SymptomSource;
  rawText?: string;
  language?: string;
  createdAt: string;
}

export interface EvidenceItem {
  label: string;
  detail: string;
  points: number;
}

export interface RiskAssessment {
  id: string;
  motherId: string;
  screeningId?: string;
  overallRisk: RiskLevel;
  score: number;
  reasons: string[];
  evidence: EvidenceItem[];
  engineVersion: string;
  createdAt: string;
}

export interface Visit {
  id: string;
  motherId: string;
  visitType: 'ANC' | 'HOME_VISIT' | 'FOLLOW_UP' | 'OTHER';
  notes?: string;
  createdBy?: string;
  createdAt: string;
}

export interface Referral {
  id: string;
  motherId: string;
  screeningId?: string;
  riskLevel: RiskLevel;
  findings: string[];
  recommendation: string;
  createdBy?: string;
  createdAt: string;
}

export type AlertStatus = 'OPEN' | 'REVIEWED' | 'RESOLVED' | 'SNOOZED';

export type SyncEntityType =
  | 'mother'
  | 'pregnancy'
  | 'vital'
  | 'lab_report'
  | 'symptom'
  | 'screening'
  | 'risk_assessment'
  | 'alert'
  | 'visit'
  | 'referral';

export interface SyncOutboxEntry {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: unknown;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  attemptCount: number;
  createdAt: string;
  syncedAt?: string;
}
