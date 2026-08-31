import * as SQLite from "expo-sqlite";

/**
 * SQL driver abstraction (NATIVE implementation — Expo Go / iOS / Android).
 *
 * The whole data layer talks to this minimal `SqlDb` surface, never to a
 * platform SQLite module directly. On native we use expo-sqlite (real,
 * file-backed SQLite). On web, Metro resolves `driver.web.ts` (sql.js/WASM),
 * so the exact same repositories and SQL run in the browser preview too.
 *
 * Keeping this contract small also keeps the whole stack portable: swapping the
 * mobile SQLite engine later is a one-file change here, not a repository rewrite.
 */
export type SqlParam = string | number | null;

export interface SqlRunResult {
  changes: number;
  lastInsertRowId: number;
}

export interface SqlDb {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: SqlParam[]): Promise<SqlRunResult>;
  getAllAsync<T = any>(sql: string, ...params: SqlParam[]): Promise<T[]>;
  getFirstAsync<T = any>(sql: string, ...params: SqlParam[]): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

export async function openSqlDb(name: string): Promise<SqlDb> {
  const db = await SQLite.openDatabaseAsync(name);
  await db.execAsync("PRAGMA journal_mode = WAL;");
  return db as unknown as SqlDb;
}
