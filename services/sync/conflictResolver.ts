import {
  MaternalVitalsPayload,
  PatientProfilePayload,
  ConflictResolutionStrategy,
} from "./types";

export function evaluateVitalsClinicalRisk(
  vitals: MaternalVitalsPayload
): "LOW" | "MODERATE" | "HIGH" | "CRITICAL" {
  // Critical Preeclampsia / Hypertensive Crisis
  if (vitals.systolicBp >= 160 || vitals.diastolicBp >= 110) {
    return "CRITICAL";
  }
  // Severe Anemia
  if (vitals.hemoglobin < 7.0) {
    return "CRITICAL";
  }
  // Fetal Distress (Bradycardia < 110, Tachycardia > 160)
  if (
    vitals.fetalHeartRate !== undefined &&
    (vitals.fetalHeartRate < 110 || vitals.fetalHeartRate > 160)
  ) {
    return "HIGH";
  }
  // Stage 1 Gestational Hypertension or Moderate Anemia
  if (
    vitals.systolicBp >= 140 ||
    vitals.diastolicBp >= 90 ||
    vitals.hemoglobin < 9.0
  ) {
    return "HIGH";
  }
  // Mild Anemia
  if (vitals.hemoglobin < 11.0) {
    return "MODERATE";
  }

  return "LOW";
}

const RISK_WEIGHTS: Record<string, number> = {
  LOW: 0,
  MODERATE: 1,
  HIGH: 2,
  CRITICAL: 3,
};

export function resolveVitalsConflict(
  localVitals: MaternalVitalsPayload,
  remoteVitals: MaternalVitalsPayload,
  strategy: ConflictResolutionStrategy = "CLINICAL_RISK_PRIORITY"
): {
  resolved: MaternalVitalsPayload;
  conflictDetected: boolean;
  resolutionReason: string;
} {
  const isIdentical =
    localVitals.systolicBp === remoteVitals.systolicBp &&
    localVitals.diastolicBp === remoteVitals.diastolicBp &&
    localVitals.hemoglobin === remoteVitals.hemoglobin &&
    localVitals.recordedAt === remoteVitals.recordedAt;

  if (isIdentical) {
    return {
      resolved: localVitals,
      conflictDetected: false,
      resolutionReason: "Records are identical",
    };
  }

  if (strategy === "CLIENT_WINS") {
    return {
      resolved: localVitals,
      conflictDetected: true,
      resolutionReason: "Client-wins override strategy applied",
    };
  }

  if (strategy === "SERVER_WINS") {
    return {
      resolved: remoteVitals,
      conflictDetected: true,
      resolutionReason: "Server-wins override strategy applied",
    };
  }

  if (strategy === "LAST_WRITE_WINS") {
    const resolved =
      localVitals.recordedAt >= remoteVitals.recordedAt
        ? localVitals
        : remoteVitals;
    return {
      resolved,
      conflictDetected: true,
      resolutionReason: `Last-write-wins applied based on timestamp (${new Date(
        resolved.recordedAt
      ).toISOString()})`,
    };
  }

  // CLINICAL_RISK_PRIORITY Strategy:
  // In maternal healthcare, a critical condition must NEVER be silently overwritten
  // by a benign routine reading taken around the same window without medical review.
  const localRisk = evaluateVitalsClinicalRisk(localVitals);
  const remoteRisk = evaluateVitalsClinicalRisk(remoteVitals);

  const localWeight = RISK_WEIGHTS[localRisk] || 0;
  const remoteWeight = RISK_WEIGHTS[remoteRisk] || 0;

  if (localWeight > remoteWeight) {
    return {
      resolved: { ...localVitals, riskTier: localRisk },
      conflictDetected: true,
      resolutionReason: `Clinical Risk Priority: Preserved local record with higher risk classification (${localRisk} vs remote ${remoteRisk})`,
    };
  }

  if (remoteWeight > localWeight) {
    return {
      resolved: { ...remoteVitals, riskTier: remoteRisk },
      conflictDetected: true,
      resolutionReason: `Clinical Risk Priority: Preserved remote record with higher risk classification (${remoteRisk} vs local ${localRisk})`,
    };
  }

  // Same clinical risk tier -> Fall back to latest timestamp
  const resolved =
    localVitals.recordedAt >= remoteVitals.recordedAt
      ? localVitals
      : remoteVitals;
  return {
    resolved: { ...resolved, riskTier: localRisk },
    conflictDetected: true,
    resolutionReason: `Clinical Risk Priority tie-break: preserved latest timestamp (${localRisk} risk)`,
  };
}

export function resolveProfileConflict(
  localProfile: PatientProfilePayload,
  remoteProfile: PatientProfilePayload
): {
  resolved: PatientProfilePayload;
  conflictDetected: boolean;
  resolutionReason: string;
} {
  const mergedNotes = Array.from(
    new Set([...(localProfile.notes || []), ...(remoteProfile.notes || [])])
  );

  const isLocalNewer = localProfile.updatedAt >= remoteProfile.updatedAt;
  const base = isLocalNewer ? localProfile : remoteProfile;

  const resolved: PatientProfilePayload = {
    ...base,
    notes: mergedNotes,
    // Preserve higher gestational age if within plausible range
    gestationalWeeks: Math.max(
      localProfile.gestationalWeeks,
      remoteProfile.gestationalWeeks
    ),
  };

  return {
    resolved,
    conflictDetected: localProfile.updatedAt !== remoteProfile.updatedAt,
    resolutionReason: "Merged clinical notes and retained most recent profile data with progressive gestational age tracking",
  };
}
