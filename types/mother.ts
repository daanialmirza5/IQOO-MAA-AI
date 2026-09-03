export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type TimelineEventType =
  | 'REGISTRATION'
  | 'ANC_VISIT'
  | 'SCREENING'
  | 'REPORT_OCR'
  | 'VOICE_SYMPTOM'
  | 'FOLLOW_UP_MISSED'
  | 'RISK_CHANGED'
  | 'REFERRAL_CREATED';

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  riskLevel?: RiskLevel;
  type: TimelineEventType;
  metadata?: Record<string, any>;
}

export interface LongitudinalReading {
  id: string;
  week: number;
  date: string;
  hemoglobin?: number;
  bloodPressure?: string;
  weight?: number;
  riskLevel: RiskLevel;
  notes?: string;
  source: 'REPORT_OCR' | 'CLINICAL_VISIT' | 'VISUAL_SCREENING' | 'VOICE_CHECKIN' | 'REGISTRATION';
}

export interface Mother {
  id: string;
  name: string;
  age: number;
  phone: string;
  village: string;
  emergencyContact: string;
  gestationalAgeWeeks: number;
  expectedDeliveryDate: string;
  gravida: number;
  para: number;
  previousComplications?: string;
  bloodGroup?: string;
  hemoglobin?: number;
  bloodPressure?: string;
  weight?: number;
  existingConditions?: string[];
  currentSymptoms?: string[];
  riskLevel: RiskLevel;
  riskReason?: string;
  hbTrend?: 'STABLE' | 'IMPROVING' | 'DECLINING';
  bpTrend?: 'NORMAL' | 'ELEVATING' | 'HIGH';
  lastScreeningDate?: string;
  dueToday?: boolean;
  needsFollowUp?: boolean;
  createdAt: string;
  updatedAt: string;
  timeline?: TimelineEvent[];
  readings?: LongitudinalReading[];
}

