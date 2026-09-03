import { getDatabase } from './client';
import { migrateAsyncStorageToSqlite } from './migrateFromAsyncStorage';
import { seedDemoData } from './seed';
import { motherRepository } from './repositories/motherRepository';

export { getDatabase } from './client';
export { motherRepository } from './repositories/motherRepository';
export { alertRepository } from './repositories/alertRepository';
export { screeningRepository } from './repositories/screeningRepository';
export { userRepository } from './repositories/userRepository';
export { careRepository } from './repositories/careRepository';
export { syncOutboxRepository } from './repositories/syncOutboxRepository';

let initPromise: Promise<void> | null = null;

/**
 * Opens the database, runs schema migrations, migrates any legacy
 * AsyncStorage data, and seeds realistic demo mothers only if the database
 * is genuinely empty (never overwrites real field data).
 */
export function initializeDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await getDatabase();
      const { migratedMothers } = await migrateAsyncStorageToSqlite();

      if (migratedMothers === 0) {
        const existing = await motherRepository.count();
        if (existing === 0) {
          await seedDemoData();
        }
      }
    })();
  }
  return initPromise;
}
