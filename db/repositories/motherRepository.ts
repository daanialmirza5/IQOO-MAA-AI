import { getDatabase } from '../client';
import { generateId, nowIso } from '../id';
import { syncOutboxRepository } from './syncOutboxRepository';
import {
  Mother,
  RiskLevel,
  TimelineEvent,
  TimelineEventType,
  LongitudinalReading,
} from '../../types/mother';

/**
 * Read-model repository for mothers.
 *
 * Storage underneath is fully normalized (mothers / pregnancies / vitals /
 * activity_log tables — see db/schema.ts), but this repository assembles and
 * returns objects shaped like the app's existing `Mother` type (with
 * `timeline`/`readings` populated via real joins/queries, not embedded JSON
 * blobs) so the ~15 screens that already consume that shape don't need a
 * ground-up rewrite. Writes are decomposed across the normalized tables.
 */

interface MotherRow {
  id: string;
  name: string;
  age: number;
  phone: string;
  village: string;
  emergency_contact: string;
  blood_group: string | null;
  risk_level: RiskLevel;
  risk_reason: string | null;
  is_demo_data: number;
  created_at: string;
  updated_at: string;
}

interface PregnancyRow {
  id: string;
  mother_id: string;
  gestational_age_weeks: number;
  gestational_age_as_of: string;
  expected_delivery_date: string;
  gravida: number;
  para: number;
  previous_complications: string | null;
  existing_conditions_json: string | null;
  status: string;
}

interface VitalRow {
  id: string;
  gestational_week: number | null;
  recorded_date: string;
  hemoglobin: number | null;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  weight_kg: number | null;
  risk_level: RiskLevel;
  source: string;
  notes: string | null;
}

interface ActivityRow {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  risk_level: RiskLevel | null;
  metadata_json: string | null;
  created_at: string;
}

interface SymptomRow {
  symptom: string;
}

function bpString(systolic: number | null, diastolic: number | null): string | undefined {
  if (systolic == null || diastolic == null) return undefined;
  return `${systolic}/${diastolic}`;
}

function parseBp(bp?: string): { systolic: number | null; diastolic: number | null } {
  if (!bp) return { systolic: null, diastolic: null };
  const [s, d] = bp.split('/').map((v) => parseInt(v.trim(), 10));
  return { systolic: Number.isFinite(s) ? s : null, diastolic: Number.isFinite(d) ? d : null };
}

/** Real trend computation from the last two chronological readings — not a guess. */
export function computeHbTrend(readings: LongitudinalReading[]): Mother['hbTrend'] {
  const withHb = readings.filter((r) => typeof r.hemoglobin === 'number');
  if (withHb.length < 2) return undefined;
  const sorted = [...withHb].sort((a, b) => a.week - b.week);
  const last = sorted[sorted.length - 1].hemoglobin!;
  const prev = sorted[sorted.length - 2].hemoglobin!;
  const delta = last - prev;
  if (delta <= -0.4) return 'DECLINING';
  if (delta >= 0.4) return 'IMPROVING';
  return 'STABLE';
}

export function computeBpTrend(readings: LongitudinalReading[]): Mother['bpTrend'] {
  const withBp = readings.filter((r) => !!r.bloodPressure);
  if (withBp.length < 1) return undefined;
  const sorted = [...withBp].sort((a, b) => a.week - b.week);
  const latest = sorted[sorted.length - 1];
  const [sysStr] = (latest.bloodPressure || '').split('/');
  const systolic = parseInt(sysStr, 10);
  if (!Number.isFinite(systolic)) return undefined;
  if (systolic >= 140) return 'HIGH';
  if (sorted.length >= 2) {
    const [prevSysStr] = (sorted[sorted.length - 2].bloodPressure || '').split('/');
    const prevSystolic = parseInt(prevSysStr, 10);
    if (Number.isFinite(prevSystolic) && systolic - prevSystolic >= 12) return 'ELEVATING';
  }
  return 'NORMAL';
}

async function assembleMother(row: MotherRow): Promise<Mother> {
  const db = await getDatabase();

  const pregnancy = await db.getFirstAsync<PregnancyRow>(
    `SELECT * FROM pregnancies WHERE mother_id = ? AND status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1`,
    [row.id]
  );

  const vitalRows = await db.getAllAsync<VitalRow>(
    `SELECT * FROM vitals WHERE mother_id = ? ORDER BY recorded_date ASC`,
    [row.id]
  );
  const readings: LongitudinalReading[] = vitalRows.map((v) => ({
    id: v.id,
    week: v.gestational_week ?? 0,
    date: v.recorded_date,
    hemoglobin: v.hemoglobin ?? undefined,
    bloodPressure: bpString(v.bp_systolic, v.bp_diastolic),
    weight: v.weight_kg ?? undefined,
    riskLevel: v.risk_level,
    notes: v.notes ?? undefined,
    source: v.source as LongitudinalReading['source'],
  }));

  const activityRows = await db.getAllAsync<ActivityRow>(
    `SELECT * FROM activity_log WHERE mother_id = ? ORDER BY created_at DESC`,
    [row.id]
  );
  const timeline: TimelineEvent[] = activityRows.map((a) => ({
    id: a.id,
    date: a.created_at,
    title: a.title,
    description: a.description,
    riskLevel: a.risk_level ?? undefined,
    type: a.type,
    metadata: a.metadata_json ? JSON.parse(a.metadata_json) : undefined,
  }));

  const symptomRows = await db.getAllAsync<SymptomRow>(
    `SELECT symptom FROM symptoms WHERE mother_id = ? ORDER BY created_at DESC LIMIT 10`,
    [row.id]
  );

  const latestVital = vitalRows[vitalRows.length - 1];

  const mother: Mother = {
    id: row.id,
    name: row.name,
    age: row.age,
    phone: row.phone,
    village: row.village,
    emergencyContact: row.emergency_contact,
    gestationalAgeWeeks: pregnancy?.gestational_age_weeks ?? 0,
    expectedDeliveryDate: pregnancy?.expected_delivery_date ?? '',
    gravida: pregnancy?.gravida ?? 1,
    para: pregnancy?.para ?? 0,
    previousComplications: pregnancy?.previous_complications ?? undefined,
    bloodGroup: row.blood_group ?? undefined,
    hemoglobin: latestVital?.hemoglobin ?? undefined,
    bloodPressure: latestVital ? bpString(latestVital.bp_systolic, latestVital.bp_diastolic) : undefined,
    weight: latestVital?.weight_kg ?? undefined,
    existingConditions: pregnancy?.existing_conditions_json
      ? JSON.parse(pregnancy.existing_conditions_json)
      : undefined,
    currentSymptoms: symptomRows.map((s) => s.symptom),
    riskLevel: row.risk_level,
    riskReason: row.risk_reason ?? undefined,
    hbTrend: computeHbTrend(readings),
    bpTrend: computeBpTrend(readings),
    lastScreeningDate: readings.length ? readings[readings.length - 1].date : undefined,
    dueToday: false,
    needsFollowUp: row.risk_level !== 'LOW',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    timeline,
    readings,
  };

  return mother;
}

export const motherRepository = {
  async list(): Promise<Mother[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<MotherRow>(`SELECT * FROM mothers ORDER BY updated_at DESC`);
    return Promise.all(rows.map(assembleMother));
  },

  async getById(id: string): Promise<Mother | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<MotherRow>(`SELECT * FROM mothers WHERE id = ?`, [id]);
    if (!row) return null;
    return assembleMother(row);
  },

  async search(query: string): Promise<Mother[]> {
    const db = await getDatabase();
    const like = `%${query.toLowerCase()}%`;
    const rows = await db.getAllAsync<MotherRow>(
      `SELECT * FROM mothers
       WHERE lower(name) LIKE ? OR lower(village) LIKE ? OR phone LIKE ?
       ORDER BY updated_at DESC`,
      [like, like, `%${query}%`]
    );
    return Promise.all(rows.map(assembleMother));
  },

  /**
   * Creates a mother + her active pregnancy record in one call (matches the
   * registration form, which collects both at once).
   */
  async create(input: Omit<Mother, 'id' | 'createdAt' | 'updatedAt' | 'timeline' | 'readings'>, isDemoData = false): Promise<Mother> {
    const db = await getDatabase();
    const motherId = generateId('moth');
    const pregnancyId = generateId('preg');
    const ts = nowIso();

    await db.runAsync(
      `INSERT INTO mothers (id, name, age, phone, village, emergency_contact, blood_group, risk_level, risk_reason, is_demo_data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        motherId,
        input.name,
        input.age,
        input.phone,
        input.village,
        input.emergencyContact,
        input.bloodGroup ?? null,
        input.riskLevel,
        input.riskReason ?? null,
        isDemoData ? 1 : 0,
        ts,
        ts,
      ]
    );

    await db.runAsync(
      `INSERT INTO pregnancies (id, mother_id, gestational_age_weeks, gestational_age_as_of, expected_delivery_date, gravida, para, previous_complications, existing_conditions_json, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
      [
        pregnancyId,
        motherId,
        input.gestationalAgeWeeks,
        ts,
        input.expectedDeliveryDate,
        input.gravida,
        input.para,
        input.previousComplications ?? null,
        input.existingConditions ? JSON.stringify(input.existingConditions) : null,
        ts,
        ts,
      ]
    );

    if (input.hemoglobin || input.bloodPressure || input.weight) {
      const { systolic, diastolic } = parseBp(input.bloodPressure);
      await db.runAsync(
        `INSERT INTO vitals (id, mother_id, pregnancy_id, gestational_week, recorded_date, hemoglobin, bp_systolic, bp_diastolic, weight_kg, risk_level, source, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REGISTRATION', ?, ?)`,
        [
          generateId('vit'),
          motherId,
          pregnancyId,
          input.gestationalAgeWeeks,
          ts,
          input.hemoglobin ?? null,
          systolic,
          diastolic,
          input.weight ?? null,
          input.riskLevel,
          'Recorded at registration',
          ts,
        ]
      );
    }

    await db.runAsync(
      `INSERT INTO activity_log (id, mother_id, type, title, description, risk_level, created_at)
       VALUES (?, ?, 'REGISTRATION', ?, ?, ?, ?)`,
      [
        generateId('act'),
        motherId,
        'Initial Field Registration',
        `Registered in ${input.village}. Gestational age ${input.gestationalAgeWeeks} weeks.`,
        input.riskLevel,
        ts,
      ]
    );

    const created = await motherRepository.getById(motherId);
    await syncOutboxRepository.enqueue({
      entityType: 'mother',
      entityId: motherId,
      operation: 'CREATE',
      payload: { name: input.name, village: input.village, riskLevel: input.riskLevel },
    });
    return created!;
  },

  async updateRisk(motherId: string, riskLevel: RiskLevel, riskReason: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE mothers SET risk_level = ?, risk_reason = ?, updated_at = ? WHERE id = ?`,
      [riskLevel, riskReason, nowIso(), motherId]
    );
    await syncOutboxRepository.enqueue({
      entityType: 'mother',
      entityId: motherId,
      operation: 'UPDATE',
      payload: { riskLevel, riskReason },
    });
  },

  async addVital(
    motherId: string,
    reading: Omit<LongitudinalReading, 'id'>
  ): Promise<void> {
    const db = await getDatabase();
    const { systolic, diastolic } = parseBp(reading.bloodPressure);
    const pregnancy = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM pregnancies WHERE mother_id = ? AND status = 'ACTIVE' LIMIT 1`,
      [motherId]
    );
    await db.runAsync(
      `INSERT INTO vitals (id, mother_id, pregnancy_id, gestational_week, recorded_date, hemoglobin, bp_systolic, bp_diastolic, weight_kg, risk_level, source, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generateId('vit'),
        motherId,
        pregnancy?.id ?? null,
        reading.week,
        reading.date,
        reading.hemoglobin ?? null,
        systolic,
        diastolic,
        reading.weight ?? null,
        reading.riskLevel,
        reading.source,
        reading.notes ?? null,
        nowIso(),
      ]
    );
    await db.runAsync(`UPDATE mothers SET updated_at = ? WHERE id = ?`, [nowIso(), motherId]);
    await syncOutboxRepository.enqueue({
      entityType: 'vital',
      entityId: motherId,
      operation: 'CREATE',
      payload: reading,
    });
  },

  async addActivityEvent(
    motherId: string,
    event: Omit<TimelineEvent, 'id' | 'date'>,
    /** Optional backdated timestamp — used by seed data to build a realistic historical narrative instead of clustering everything at "now". */
    occurredAt?: string
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO activity_log (id, mother_id, type, title, description, risk_level, metadata_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generateId('act'),
        motherId,
        event.type,
        event.title,
        event.description,
        event.riskLevel ?? null,
        event.metadata ? JSON.stringify(event.metadata) : null,
        occurredAt || nowIso(),
      ]
    );
  },

  async addSymptoms(motherId: string, symptoms: string[], source: 'VOICE' | 'MANUAL' | 'SYMPTOM_CHECKLIST', dangerSigns: string[] = []): Promise<void> {
    const db = await getDatabase();
    const ts = nowIso();
    for (const symptom of symptoms) {
      await db.runAsync(
        `INSERT INTO symptoms (id, mother_id, symptom, is_danger_sign, source, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [generateId('sym'), motherId, symptom, dangerSigns.includes(symptom) ? 1 : 0, source, ts]
      );
    }
  },

  async count(): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ c: number }>(`SELECT COUNT(*) as c FROM mothers`);
    return row?.c ?? 0;
  },

  async deleteAll(): Promise<void> {
    const db = await getDatabase();
    await db.execAsync(`
      DELETE FROM sync_outbox; DELETE FROM activity_log; DELETE FROM referrals; DELETE FROM visits;
      DELETE FROM alerts; DELETE FROM risk_assessments; DELETE FROM screenings; DELETE FROM symptoms;
      DELETE FROM lab_reports; DELETE FROM vitals; DELETE FROM pregnancies; DELETE FROM mothers;
    `);
  },
};
