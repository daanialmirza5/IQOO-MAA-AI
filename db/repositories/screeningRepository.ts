import { getDatabase } from '../client';
import { generateId, nowIso } from '../id';
import { syncOutboxRepository } from './syncOutboxRepository';
import { ScreeningResult, ScreeningType } from '../../types/screening';
import { RiskLevel } from '../../types/mother';
import { EvidenceItem, LabReport, LabReportFields, LabReportStatus, ExtractionMethod } from '../../types/domain';

interface ScreeningRow {
  id: string;
  mother_id: string;
  type: ScreeningType;
  overall_risk: RiskLevel;
  reasons_json: string;
  recommendation: string;
  is_prototype_engine: number;
  metadata_json: string | null;
  created_at: string;
}

function toScreening(row: ScreeningRow, motherName: string, gestationalAgeWeeks: number): ScreeningResult {
  const metadata = row.metadata_json ? JSON.parse(row.metadata_json) : {};
  return {
    id: row.id,
    motherId: row.mother_id,
    motherName,
    gestationalAgeWeeks,
    timestamp: row.created_at,
    type: row.type,
    overallRisk: row.overall_risk,
    anemiaRisk: metadata.anemiaRisk ?? row.overall_risk,
    anemiaReason: metadata.anemiaReason,
    pregnancyRisk: metadata.pregnancyRisk ?? row.overall_risk,
    pregnancyRiskReasons: metadata.pregnancyRiskReasons,
    symptomRisk: metadata.symptomRisk ?? row.overall_risk,
    symptomsChecked: metadata.symptomsChecked,
    reasons: JSON.parse(row.reasons_json),
    recommendation: row.recommendation,
    capturedImageUri: metadata.capturedImageUri,
    isPrototypeEngine: !!row.is_prototype_engine,
    extractedHb: metadata.extractedHb,
    extractedBp: metadata.extractedBp,
    previousHb: metadata.previousHb,
    hbDelta: metadata.hbDelta,
    hbTrend: metadata.hbTrend,
    voiceTranscript: metadata.voiceTranscript,
    extractedSymptoms: metadata.extractedSymptoms,
    detectedLanguage: metadata.detectedLanguage,
  };
}

export const screeningRepository = {
  async listForMother(motherId: string): Promise<ScreeningResult[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ScreeningRow & { mother_name: string; gestational_age_weeks: number | null }>(
      `SELECT screenings.*, mothers.name as mother_name, pregnancies.gestational_age_weeks as gestational_age_weeks
       FROM screenings
       JOIN mothers ON mothers.id = screenings.mother_id
       LEFT JOIN pregnancies ON pregnancies.mother_id = mothers.id AND pregnancies.status = 'ACTIVE'
       WHERE screenings.mother_id = ?
       ORDER BY screenings.created_at DESC`,
      [motherId]
    );
    return rows.map((r) => toScreening(r, r.mother_name, r.gestational_age_weeks ?? 0));
  },

  async listAll(): Promise<ScreeningResult[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ScreeningRow & { mother_name: string; gestational_age_weeks: number | null }>(
      `SELECT screenings.*, mothers.name as mother_name, pregnancies.gestational_age_weeks as gestational_age_weeks
       FROM screenings
       JOIN mothers ON mothers.id = screenings.mother_id
       LEFT JOIN pregnancies ON pregnancies.mother_id = mothers.id AND pregnancies.status = 'ACTIVE'
       ORDER BY screenings.created_at DESC`
    );
    return rows.map((r) => toScreening(r, r.mother_name, r.gestational_age_weeks ?? 0));
  },

  async create(screening: Omit<ScreeningResult, 'id' | 'timestamp'>): Promise<string> {
    const db = await getDatabase();
    const id = generateId('scr');
    const metadata = {
      anemiaRisk: screening.anemiaRisk,
      anemiaReason: screening.anemiaReason,
      pregnancyRisk: screening.pregnancyRisk,
      pregnancyRiskReasons: screening.pregnancyRiskReasons,
      symptomRisk: screening.symptomRisk,
      symptomsChecked: screening.symptomsChecked,
      capturedImageUri: screening.capturedImageUri,
      extractedHb: screening.extractedHb,
      extractedBp: screening.extractedBp,
      previousHb: screening.previousHb,
      hbDelta: screening.hbDelta,
      hbTrend: screening.hbTrend,
      voiceTranscript: screening.voiceTranscript,
      extractedSymptoms: screening.extractedSymptoms,
      detectedLanguage: screening.detectedLanguage,
    };
    await db.runAsync(
      `INSERT INTO screenings (id, mother_id, type, overall_risk, reasons_json, recommendation, is_prototype_engine, metadata_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        screening.motherId,
        screening.type,
        screening.overallRisk,
        JSON.stringify(screening.reasons),
        screening.recommendation,
        screening.isPrototypeEngine ? 1 : 0,
        JSON.stringify(metadata),
        nowIso(),
      ]
    );
    await syncOutboxRepository.enqueue({
      entityType: 'screening',
      entityId: id,
      operation: 'CREATE',
      payload: { motherId: screening.motherId, type: screening.type, overallRisk: screening.overallRisk },
    });
    return id;
  },

  async createRiskAssessment(input: {
    motherId: string;
    screeningId?: string;
    overallRisk: RiskLevel;
    score: number;
    reasons: string[];
    evidence: EvidenceItem[];
    engineVersion: string;
  }): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO risk_assessments (id, mother_id, screening_id, overall_risk, score, reasons_json, evidence_json, engine_version, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generateId('risk'),
        input.motherId,
        input.screeningId ?? null,
        input.overallRisk,
        input.score,
        JSON.stringify(input.reasons),
        JSON.stringify(input.evidence),
        input.engineVersion,
        nowIso(),
      ]
    );
  },

  async createLabReport(input: {
    motherId: string;
    sourceImageUri?: string;
    extractionMethod: ExtractionMethod;
    rawFields: LabReportFields;
    ocrConfidence?: number;
  }): Promise<string> {
    const db = await getDatabase();
    const id = generateId('lab');
    await db.runAsync(
      `INSERT INTO lab_reports (id, mother_id, source_image_uri, extraction_method, raw_fields_json, ocr_confidence, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING_CONFIRMATION', ?)`,
      [
        id,
        input.motherId,
        input.sourceImageUri ?? null,
        input.extractionMethod,
        JSON.stringify(input.rawFields),
        input.ocrConfidence ?? null,
        nowIso(),
      ]
    );
    return id;
  },

  async confirmLabReport(id: string, confirmedFields: LabReportFields): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE lab_reports SET confirmed_fields_json = ?, status = 'CONFIRMED' WHERE id = ?`,
      [JSON.stringify(confirmedFields), id]
    );
  },

  async getLatestLabReport(motherId: string): Promise<LabReport | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{
      id: string;
      mother_id: string;
      source_image_uri: string | null;
      extraction_method: ExtractionMethod;
      raw_fields_json: string;
      confirmed_fields_json: string | null;
      ocr_confidence: number | null;
      status: LabReportStatus;
      created_at: string;
    }>(`SELECT * FROM lab_reports WHERE mother_id = ? ORDER BY created_at DESC LIMIT 1`, [motherId]);
    if (!row) return null;
    return {
      id: row.id,
      motherId: row.mother_id,
      sourceImageUri: row.source_image_uri ?? undefined,
      extractionMethod: row.extraction_method,
      rawFields: JSON.parse(row.raw_fields_json),
      confirmedFields: row.confirmed_fields_json ? JSON.parse(row.confirmed_fields_json) : undefined,
      ocrConfidence: row.ocr_confidence ?? undefined,
      status: row.status,
      createdAt: row.created_at,
    };
  },
};
