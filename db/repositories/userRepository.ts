import { getDatabase } from '../client';
import { nowIso } from '../id';
import { AshaWorkerProfile } from '../../types/user';
import { motherRepository } from './motherRepository';
import { alertRepository } from './alertRepository';

interface UserRow {
  id: string;
  name: string;
  worker_id: string;
  phone: string;
  assigned_area: string;
  language: AshaWorkerProfile['language'];
  notifications_enabled: number;
}

/**
 * Profile-only access to the single worker record on this device. Credential
 * fields (pin_hash/pin_salt) live in the same `users` table but are only ever
 * read/written by auth/LocalAuthProvider.ts, keeping password-adjacent logic
 * in one auditable place.
 */
export const userRepository = {
  async getProfile(): Promise<AshaWorkerProfile | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<UserRow>(`SELECT id, name, worker_id, phone, assigned_area, language, notifications_enabled FROM users LIMIT 1`);
    if (!row) return null;

    const [totalMothersAssigned, highRiskCount, followUpsDue] = await Promise.all([
      motherRepository.count(),
      db.getFirstAsync<{ c: number }>(`SELECT COUNT(*) as c FROM mothers WHERE risk_level = 'HIGH'`).then((r) => r?.c ?? 0),
      alertRepository.countOpen(),
    ]);

    return {
      id: row.id,
      name: row.name,
      workerId: row.worker_id,
      assignedArea: row.assigned_area,
      phone: row.phone,
      totalMothersAssigned,
      highRiskCount,
      followUpsDue,
      language: row.language,
      notificationsEnabled: !!row.notifications_enabled,
    };
  },

  async updateProfile(partial: Partial<Pick<AshaWorkerProfile, 'language' | 'notificationsEnabled' | 'name' | 'phone' | 'assignedArea'>>): Promise<void> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: unknown[] = [];
    if (partial.language !== undefined) { fields.push('language = ?'); values.push(partial.language); }
    if (partial.notificationsEnabled !== undefined) { fields.push('notifications_enabled = ?'); values.push(partial.notificationsEnabled ? 1 : 0); }
    if (partial.name !== undefined) { fields.push('name = ?'); values.push(partial.name); }
    if (partial.phone !== undefined) { fields.push('phone = ?'); values.push(partial.phone); }
    if (partial.assignedArea !== undefined) { fields.push('assigned_area = ?'); values.push(partial.assignedArea); }
    if (fields.length === 0) return;
    fields.push('updated_at = ?');
    values.push(nowIso());
    await db.runAsync(`UPDATE users SET ${fields.join(', ')}`, values as any[]);
  },

  async exists(): Promise<boolean> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ c: number }>(`SELECT COUNT(*) as c FROM users`);
    return (row?.c ?? 0) > 0;
  },
};
