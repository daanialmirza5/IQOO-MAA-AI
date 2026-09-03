import { getDatabase } from '../client';
import { generateId, nowIso } from '../id';
import { syncOutboxRepository } from './syncOutboxRepository';
import { HealthAlert, AlertPriority } from '../../types/alert';
import { AlertStatus } from '../../types/domain';

interface AlertRow {
  id: string;
  mother_id: string;
  priority: AlertPriority;
  title: string;
  description: string;
  action_required: string;
  category: string | null;
  status: AlertStatus;
  snoozed_until: string | null;
  created_at: string;
  resolved_at: string | null;
}

function toAlert(row: AlertRow, motherName: string, gestationalAgeWeeks?: number): HealthAlert {
  return {
    id: row.id,
    motherId: row.mother_id,
    motherName,
    gestationalAgeWeeks,
    priority: row.priority,
    title: row.title,
    description: row.description,
    actionRequired: row.action_required,
    timestamp: row.created_at,
    dateCreated: row.created_at,
    isResolved: row.status === 'RESOLVED',
    category: row.category ?? undefined,
  };
}

export const alertRepository = {
  async list(): Promise<HealthAlert[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<AlertRow & { mother_name: string; gestational_age_weeks: number | null }>(
      `SELECT alerts.*, mothers.name as mother_name, pregnancies.gestational_age_weeks as gestational_age_weeks
       FROM alerts
       JOIN mothers ON mothers.id = alerts.mother_id
       LEFT JOIN pregnancies ON pregnancies.mother_id = mothers.id AND pregnancies.status = 'ACTIVE'
       WHERE alerts.status != 'SNOOZED' OR alerts.snoozed_until <= ?
       ORDER BY
         CASE alerts.priority WHEN 'URGENT' THEN 0 WHEN 'HIGH_PRIORITY' THEN 1 ELSE 2 END,
         alerts.created_at DESC`,
      [nowIso()]
    );
    return rows.map((r) => toAlert(r, r.mother_name, r.gestational_age_weeks ?? undefined));
  },

  async create(input: {
    motherId: string;
    priority: AlertPriority;
    title: string;
    description: string;
    actionRequired: string;
    category?: string;
  }): Promise<void> {
    const db = await getDatabase();
    const id = generateId('alt');
    await db.runAsync(
      `INSERT INTO alerts (id, mother_id, priority, title, description, action_required, category, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN', ?)`,
      [
        id,
        input.motherId,
        input.priority,
        input.title,
        input.description,
        input.actionRequired,
        input.category ?? null,
        nowIso(),
      ]
    );
    await syncOutboxRepository.enqueue({ entityType: 'alert', entityId: id, operation: 'CREATE', payload: input });
  },

  async resolve(alertId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`UPDATE alerts SET status = 'RESOLVED', resolved_at = ? WHERE id = ?`, [nowIso(), alertId]);
  },

  async markReviewed(alertId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`UPDATE alerts SET status = 'REVIEWED' WHERE id = ?`, [alertId]);
  },

  async snooze(alertId: string, until: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`UPDATE alerts SET status = 'SNOOZED', snoozed_until = ? WHERE id = ?`, [until, alertId]);
  },

  async countOpen(): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ c: number }>(
      `SELECT COUNT(*) as c FROM alerts WHERE status IN ('OPEN', 'REVIEWED')`
    );
    return row?.c ?? 0;
  },
};
