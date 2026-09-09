import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  OfflineSyncQueue,
  SyncEngine,
  SyncTransport,
  evaluateVitalsClinicalRisk,
  resolveVitalsConflict,
  resolveProfileConflict,
  MaternalVitalsPayload,
  PatientProfilePayload,
} from "../index";

describe("IQOO-MAA-AI Offline Sync & Conflict Resolution Engine", () => {
  describe("Clinical Risk Assessment & Conflict Resolution", () => {
    it("should classify preeclampsia/hypertensive crisis as CRITICAL risk", () => {
      const vitals: MaternalVitalsPayload = {
        patientId: "PAT-001",
        systolicBp: 165,
        diastolicBp: 112,
        hemoglobin: 11.5,
        recordedAt: Date.now(),
        recordedByAshaId: "ASHA-101",
      };

      const risk = evaluateVitalsClinicalRisk(vitals);
      assert.strictEqual(risk, "CRITICAL");
    });

    it("should classify severe anemia (Hb < 7.0) as CRITICAL risk", () => {
      const vitals: MaternalVitalsPayload = {
        patientId: "PAT-002",
        systolicBp: 120,
        diastolicBp: 80,
        hemoglobin: 6.4,
        recordedAt: Date.now(),
        recordedByAshaId: "ASHA-101",
      };

      const risk = evaluateVitalsClinicalRisk(vitals);
      assert.strictEqual(risk, "CRITICAL");
    });

    it("should preserve CRITICAL local preeclampsia record over benign remote record under CLINICAL_RISK_PRIORITY", () => {
      const localCritical: MaternalVitalsPayload = {
        patientId: "PAT-003",
        systolicBp: 162,
        diastolicBp: 108,
        hemoglobin: 10.2,
        recordedAt: 1000, // Earlier timestamp
        recordedByAshaId: "ASHA-101",
      };

      const remoteBenign: MaternalVitalsPayload = {
        patientId: "PAT-003",
        systolicBp: 118,
        diastolicBp: 78,
        hemoglobin: 11.0,
        recordedAt: 2000, // Later timestamp
        recordedByAshaId: "PHC-NURSE-02",
      };

      const result = resolveVitalsConflict(localCritical, remoteBenign, "CLINICAL_RISK_PRIORITY");

      assert.strictEqual(result.conflictDetected, true);
      assert.strictEqual(result.resolved.systolicBp, 162, "Must preserve the high-risk blood pressure");
      assert.strictEqual(result.resolved.riskTier, "CRITICAL");
      assert.match(result.resolutionReason, /Clinical Risk Priority/);
    });

    it("should merge clinical notes and progressive gestational age on profile conflict", () => {
      const localProf: PatientProfilePayload = {
        patientId: "PAT-004",
        name: "Sunita Sharma",
        age: 24,
        gestationalWeeks: 28,
        rchId: "RCH-98421",
        village: "Khed",
        phcId: "PHC-04",
        updatedAt: 5000,
        notes: ["Prescribed iron folic acid tablets", "Complains of mild headache"],
      };

      const remoteProf: PatientProfilePayload = {
        patientId: "PAT-004",
        name: "Sunita Sharma",
        age: 24,
        gestationalWeeks: 26,
        rchId: "RCH-98421",
        village: "Khed",
        phcId: "PHC-04",
        updatedAt: 4000,
        notes: ["Prescribed iron folic acid tablets", "ANC Visit 2 completed"],
      };

      const result = resolveProfileConflict(localProf, remoteProf);
      assert.strictEqual(result.conflictDetected, true);
      assert.strictEqual(result.resolved.gestationalWeeks, 28);
      assert.strictEqual(result.resolved.notes?.length, 3, "Notes should be union deduplicated");
    });
  });

  describe("Offline Queue Priority & Deduplication", () => {
    let queue: OfflineSyncQueue;

    beforeEach(() => {
      queue = new OfflineSyncQueue(500, 10000);
    });

    it("should prioritize EMERGENCY_ALERT (P0) over VITALS (P1) and PATIENT (P2)", () => {
      queue.enqueue("REGISTER_PATIENT", { name: "A" }, "KEY-P");
      queue.enqueue("RECORD_VITALS", { sbp: 120 }, "KEY-V");
      queue.enqueue("DISPATCH_EMERGENCY_ALERT", { alert: "Eclampsia" }, "KEY-E");

      const ready = queue.getReadyItems();
      assert.strictEqual(ready.length, 3);
      assert.strictEqual(ready[0].actionType, "DISPATCH_EMERGENCY_ALERT", "P0 must be first");
      assert.strictEqual(ready[1].actionType, "RECORD_VITALS", "P1 must be second");
      assert.strictEqual(ready[2].actionType, "REGISTER_PATIENT", "P2 must be third");
    });

    it("should deduplicate actions with identical idempotency keys", () => {
      const first = queue.enqueue("RECORD_VITALS", { sbp: 120 }, "IDEM-001");
      const duplicate = queue.enqueue("RECORD_VITALS", { sbp: 120 }, "IDEM-001");

      assert.strictEqual(first.enqueued, true);
      assert.strictEqual(duplicate.enqueued, false);
      assert.strictEqual(queue.size(), 1);
    });

    it("should calculate exponential backoff with jitter on retries", () => {
      const delay0 = queue.calculateBackoffDelay(0);
      const delay1 = queue.calculateBackoffDelay(1);
      const delay2 = queue.calculateBackoffDelay(2);

      assert.ok(delay1 > delay0, "Delay must increase with retry count");
      assert.ok(delay2 > delay1, "Delay must continue exponential growth");
    });
  });

  describe("SyncEngine Flush Orchestration", () => {
    it("should flush queue and report success counts when transport succeeds", async () => {
      const queue = new OfflineSyncQueue();
      queue.enqueue("RECORD_VITALS", { sbp: 120, dbp: 80 }, "KEY-1");
      queue.enqueue("RECORD_VITALS", { sbp: 130, dbp: 85 }, "KEY-2");

      const mockTransport: SyncTransport = {
        sendAction: async () => ({ success: true }),
      };

      const engine = new SyncEngine(queue, mockTransport);
      const batchResult = await engine.flushQueue();

      assert.strictEqual(batchResult.totalProcessed, 2);
      assert.strictEqual(batchResult.succeeded, 2);
      assert.strictEqual(batchResult.failed, 0);
      assert.strictEqual(queue.size(), 0);
    });

    it("should handle server conflict, resolve clinically, and retransmit successfully", async () => {
      const queue = new OfflineSyncQueue();
      const localVitals: MaternalVitalsPayload = {
        patientId: "PAT-009",
        systolicBp: 165,
        diastolicBp: 110,
        hemoglobin: 11.0,
        recordedAt: 1000,
        recordedByAshaId: "ASHA-01",
      };

      queue.enqueue("RECORD_VITALS", localVitals, "KEY-CONFLICT");

      let attempts = 0;
      const mockTransport: SyncTransport = {
        sendAction: async (item) => {
          attempts += 1;
          if (attempts === 1) {
            // First attempt encounters conflict
            return {
              success: false,
              conflict: {
                type: "VITALS",
                remoteData: {
                  patientId: "PAT-009",
                  systolicBp: 120,
                  diastolicBp: 80,
                  hemoglobin: 11.0,
                  recordedAt: 2000,
                  recordedByAshaId: "PHC-02",
                },
              },
            };
          }
          // Second attempt with resolved payload succeeds
          return { success: true };
        },
      };

      const engine = new SyncEngine(queue, mockTransport);
      const batchResult = await engine.flushQueue();

      assert.strictEqual(batchResult.conflictsResolved, 1);
      assert.strictEqual(batchResult.succeeded, 1);
      assert.strictEqual(queue.size(), 0);
    });
  });
});
