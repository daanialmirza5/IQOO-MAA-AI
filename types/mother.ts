export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type TimelineEventType =
  | 'REGISTRATION'
  | 'ANC_VISIT'
  | 'SCREENING'
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
  lastScreeningDate?: string;
  dueToday?: boolean;
  needsFollowUp?: boolean;
  createdAt: string;
  updatedAt: string;
  timeline?: TimelineEvent[];
}
