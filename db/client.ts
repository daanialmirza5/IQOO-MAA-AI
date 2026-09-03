import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, SCHEMA_VERSION } from './schema';

const DB_NAME = 'maai.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_TABLES_SQL);

  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM schema_meta WHERE key = 'version'`
  );
  const currentVersion = row ? parseInt(row.value, 10) : 0;

  if (currentVersion < SCHEMA_VERSION) {
    // Future migrations for SCHEMA_VERSION > 1 would branch on currentVersion here.
    await db.runAsync(
      `INSERT INTO schema_meta (key, value) VALUES ('version', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [String(SCHEMA_VERSION)]
    );
  }
}

/**
 * Returns the singleton SQLite connection, running schema creation/migration
 * on first access. Safe to call from multiple places — the promise is cached.
 */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await runMigrations(db);
      return db;
    })();
  }
  return dbPromise;
}

/** Test-only: forces a fresh connection on next getDatabase() call. */
export function __resetDatabaseConnectionForTests(): void {
  dbPromise = null;
}
