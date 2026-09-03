import { getDatabase } from '../client';
import { generateId, nowIso } from '../id';
import { syncOutboxRepository } from './syncOutboxRepository';
import { Visit, Referral } from '../../types/domain';
import { RiskLevel } from '../../types/mother';

/** Visits + referrals — both are simple append-only care-event logs. */
export const careRepository = {
  async addVisit(input: { motherId: string; visitType: Visit['visitType']; notes?: string; createdBy?: string }): Promise<void> {
    const db = await getDatabase();
    const id = generateId('vis');
    await db.runAsync(
      `INSERT INTO visits (id, mother_id, visit_type, notes, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, input.motherId, input.visitType, input.notes ?? null, input.createdBy ?? null, nowIso()]
    );
    await syncOutboxRepository.enqueue({ entityType: 'visit', entityId: id, operation: 'CREATE', payload: input });
  },

  async listVisits(motherId: string): Promise<Visit[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string; mother_id: string; visit_type: Visit['visitType']; notes: string | null; created_by: string | null; created_at: string;
    }>(`SELECT * FROM visits WHERE mother_id = ? ORDER BY created_at DESC`, [motherId]);
    return rows.map((r) => ({
      id: r.id,
      motherId: r.mother_id,
      visitType: r.visit_type,
      notes: r.notes ?? undefined,
      createdBy: r.created_by ?? undefined,
      createdAt: r.created_at,
    }));
  },

  async createReferral(input: {
    motherId: string;
    screeningId?: string;
    riskLevel: RiskLevel;
    findings: string[];
    recommendation: string;
    createdBy?: string;
  }): Promise<Referral> {
    const db = await getDatabase();
    const id = generateId('ref');
    const createdAt = nowIso();
    await db.runAsync(
      `INSERT INTO referrals (id, mother_id, screening_id, risk_level, findings_json, recommendation, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.motherId, input.screeningId ?? null, input.riskLevel, JSON.stringify(input.findings), input.recommendation, input.createdBy ?? null, createdAt]
    );
    await db.runAsync(
      `INSERT INTO activity_log (id, mother_id, type, title, description, risk_level, created_at)
       VALUES (?, ?, 'REFERRAL_CREATED', 'Referral Generated', ?, ?, ?)`,
      [generateId('act'), input.motherId, `PHC referral created — ${input.riskLevel} risk`, input.riskLevel, createdAt]
    );
    await syncOutboxRepository.enqueue({
      entityType: 'referral',
      entityId: id,
      operation: 'CREATE',
      payload: { motherId: input.motherId, riskLevel: input.riskLevel },
    });
    return { id, motherId: input.motherId, screeningId: input.screeningId, riskLevel: input.riskLevel, findings: input.findings, recommendation: input.recommendation, createdBy: input.createdBy, createdAt };
  },

  async listReferrals(motherId: string): Promise<Referral[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string; mother_id: string; screening_id: string | null; risk_level: RiskLevel; findings_json: string; recommendation: string; created_by: string | null; created_at: string;
    }>(`SELECT * FROM referrals WHERE mother_id = ? ORDER BY created_at DESC`, [motherId]);
    return rows.map((r) => ({
      id: r.id,
      motherId: r.mother_id,
      screeningId: r.screening_id ?? undefined,
      riskLevel: r.risk_level,
      findings: JSON.parse(r.findings_json),
      recommendation: r.recommendation,
      createdBy: r.created_by ?? undefined,
      createdAt: r.created_at,
    }));
  },

  async listAllReferrals(): Promise<(Referral & { motherName: string })[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string; mother_id: string; screening_id: string | null; risk_level: RiskLevel; findings_json: string; recommendation: string; created_by: string | null; created_at: string; mother_name: string;
    }>(
      `SELECT referrals.*, mothers.name as mother_name FROM referrals
       JOIN mothers ON mothers.id = referrals.mother_id
       ORDER BY referrals.created_at DESC`
    );
    return rows.map((r) => ({
      id: r.id,
      motherId: r.mother_id,
      motherName: r.mother_name,
      screeningId: r.screening_id ?? undefined,
      riskLevel: r.risk_level,
      findings: JSON.parse(r.findings_json),
      recommendation: r.recommendation,
      createdBy: r.created_by ?? undefined,
      createdAt: r.created_at,
    }));
  },

  async listAllVisits(): Promise<(Visit & { motherName: string })[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string; mother_id: string; visit_type: Visit['visitType']; notes: string | null; created_by: string | null; created_at: string; mother_name: string;
    }>(
      `SELECT visits.*, mothers.name as mother_name FROM visits
       JOIN mothers ON mothers.id = visits.mother_id
       ORDER BY visits.created_at DESC`
    );
    return rows.map((r) => ({
      id: r.id,
      motherId: r.mother_id,
      motherName: r.mother_name,
      visitType: r.visit_type,
      notes: r.notes ?? undefined,
      createdBy: r.created_by ?? undefined,
      createdAt: r.created_at,
    }));
  },
};
