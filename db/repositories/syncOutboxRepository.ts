import { getDatabase } from '../client';
import { generateId, nowIso } from '../id';
import { SyncEntityType, SyncOutboxEntry } from '../../types/domain';

/**
 * Real local write-ahead queue for future backend sync. No remote endpoint
 * exists in this build — MaAI has no backend at all — so nothing is ever
 * drained automatically. But every enqueued entry here is genuine and
 * durable (written to the same SQLite database as the record it describes),
 * ready for a sync worker to drain the moment a backend is connected,
 * without any schema or call-site change.
 */
export const syncOutboxRepository = {
  async enqueue(entry: {
    entityType: SyncEntityType;
    entityId: string;
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    payload: unknown;
  }): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO sync_outbox (id, entity_type, entity_id, operation, payload_json, status, attempt_count, created_at)
       VALUES (?, ?, ?, ?, ?, 'PENDING', 0, ?)`,
      [generateId('outbox'), entry.entityType, entry.entityId, entry.operation, JSON.stringify(entry.payload), nowIso()]
    );
  },

  async listPending(): Promise<SyncOutboxEntry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      entity_type: SyncEntityType;
      entity_id: string;
      operation: 'CREATE' | 'UPDATE' | 'DELETE';
      payload_json: string;
      status: SyncOutboxEntry['status'];
      attempt_count: number;
      created_at: string;
      synced_at: string | null;
    }>(`SELECT * FROM sync_outbox WHERE status = 'PENDING' ORDER BY created_at ASC`);
    return rows.map((r) => ({
      id: r.id,
      entityType: r.entity_type,
      entityId: r.entity_id,
      operation: r.operation,
      payload: JSON.parse(r.payload_json),
      status: r.status,
      attemptCount: r.attempt_count,
      createdAt: r.created_at,
      syncedAt: r.synced_at ?? undefined,
    }));
  },

  async countPending(): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ c: number }>(`SELECT COUNT(*) as c FROM sync_outbox WHERE status = 'PENDING'`);
    return row?.c ?? 0;
  },

  async markSynced(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`UPDATE sync_outbox SET status = 'SYNCED', synced_at = ? WHERE id = ?`, [nowIso(), id]);
  },
};
