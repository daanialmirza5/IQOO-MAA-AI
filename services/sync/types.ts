/**
 * Offline Synchronization & Conflict Resolution Types for Maternal Healthcare.
 */

export type SyncActionType =
  | "REGISTER_PATIENT"
  | "RECORD_VITALS"
  | "RECORD_SCREENING"
  | "DISPATCH_EMERGENCY_ALERT"
  | "UPDATE_CASE_STATUS";

export type SyncPriority = 0 | 1 | 2; // 0: Critical Emergency (Immediate), 1: Vitals/Screening, 2: Routine Admin

export type ConflictResolutionStrategy =
  | "LAST_WRITE_WINS"
  | "SERVER_WINS"
  | "CLIENT_WINS"
  | "CLINICAL_RISK_PRIORITY";

export interface MaternalVitalsPayload {
  patientId: string;
  systolicBp: number; // mmHg
  diastolicBp: number; // mmHg
  hemoglobin: number; // g/dL
  bloodGlucose?: number; // mg/dL
  fetalHeartRate?: number; // bpm
  recordedAt: number; // UTC timestamp ms
  recordedByAshaId: string;
  riskTier?: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
}

export interface PatientProfilePayload {
  patientId: string;
  name: string;
  age: number;
  gestationalWeeks: number;
  rchId: string; // Reproductive & Child Health ID
  village: string;
  phcId: string;
  updatedAt: number;
  notes?: string[];
}

export interface SyncQueueItem<T = any> {
  id: string;
  actionType: SyncActionType;
  priority: SyncPriority;
  idempotencyKey: string;
  payload: T;
  createdAt: number;
  retryCount: number;
  maxRetries: number;
  lastAttemptAt?: number;
  lastError?: string;
}

export interface SyncBatchResult {
  totalProcessed: number;
  succeeded: number;
  failed: number;
  conflictsResolved: number;
  errors: Array<{ itemId: string; error: string }>;
}
