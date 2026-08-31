import { openSqlDb, SqlDb } from "./driver";
import { LATEST_SCHEMA_VERSION, runMigrations } from "./migrations";

/**
 * Single owner of the local SQLite connection.
 *
 * The rest of the app NEVER opens the database directly and NEVER runs SQL from
 * screens/components. Access flows strictly through repositories, which receive
 * the handle from here:
 *
 *   Screen -> Context/Hook -> Service -> Repository -> getDb()
 *
 * The connection is memoised so migrations run exactly once per app session.
 * The concrete engine (expo-sqlite on native, sql.js on web) is chosen by the
 * driver module resolution — this file is platform-agnostic.
 */
const DB_NAME = "expense_tracker.db";

let dbPromise: Promise<SqlDb> | null = null;

export async function getDb(): Promise<SqlDb> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await openSqlDb(DB_NAME);
      await db.execAsync("PRAGMA foreign_keys = ON;");
      await runMigrations(db);
      return db;
    })();
  }
  return dbPromise;
}

export async function getInstalledSchemaVersion(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  return row?.user_version ?? 0;
}

export { LATEST_SCHEMA_VERSION };
