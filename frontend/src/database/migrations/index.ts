import type { SqlDb } from "../driver";

/**
 * SQLite migration system.
 *
 * The installed schema version is tracked with `PRAGMA user_version`. On every
 * app startup we apply, in order, any migration whose version is greater than
 * the installed version. Each migration + its version bump run inside a single
 * transaction, so an interrupted upgrade never leaves a half-migrated schema
 * and never destroys existing user data.
 *
 * This mirrors the backend's Flyway-style versioning (V1__..., V2__...), keeping
 * the local and server schema-evolution stories symmetrical and portable.
 */
export interface Migration {
  version: number;
  name: string;
  up: (db: SqlDb) => Promise<void>;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: "core_tables",
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY NOT NULL,
          server_id TEXT,
          email TEXT,
          full_name TEXT,
          role TEXT,
          currency TEXT,
          daily_limit REAL,
          active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          product_name TEXT NOT NULL,
          amount_minor INTEGER NOT NULL,
          currency TEXT NOT NULL,
          category_id TEXT NOT NULL,
          notes TEXT,
          expense_date TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
        CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
        CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
        CREATE INDEX IF NOT EXISTS idx_expenses_updated ON expenses(updated_at);
      `);
    },
  },
  {
    version: 2,
    name: "budgets",
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS budgets (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          period TEXT NOT NULL DEFAULT 'DAILY',
          limit_minor INTEGER NOT NULL,
          currency TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);
      `);
    },
  },
  {
    version: 3,
    name: "sync_fields_and_tombstones",
    up: async (db) => {
      // Soft-delete + optimistic-versioning + sync bookkeeping columns.
      await db.execAsync(`
        ALTER TABLE expenses ADD COLUMN server_id TEXT;
        ALTER TABLE expenses ADD COLUMN deleted_at TEXT;
        ALTER TABLE expenses ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
        ALTER TABLE expenses ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'LOCAL';
        ALTER TABLE expenses ADD COLUMN device_id TEXT NOT NULL DEFAULT '';

        ALTER TABLE categories ADD COLUMN server_id TEXT;
        ALTER TABLE categories ADD COLUMN deleted_at TEXT;
        ALTER TABLE categories ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
        ALTER TABLE categories ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'LOCAL';

        CREATE INDEX IF NOT EXISTS idx_expenses_sync ON expenses(sync_status);
        CREATE INDEX IF NOT EXISTS idx_expenses_deleted ON expenses(deleted_at);
      `);
    },
  },
  {
    version: 4,
    name: "sync_queue_and_state",
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          operation_id TEXT PRIMARY KEY NOT NULL,
          entity TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          operation TEXT NOT NULL,
          payload TEXT NOT NULL,
          base_version INTEGER,
          created_at TEXT NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0,
          last_error TEXT,
          status TEXT NOT NULL DEFAULT 'PENDING'
        );
        CREATE INDEX IF NOT EXISTS idx_syncqueue_status ON sync_queue(status);

        CREATE TABLE IF NOT EXISTS sync_state (
          id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
          cursor TEXT,
          last_sync_at TEXT
        );
        INSERT OR IGNORE INTO sync_state (id, cursor, last_sync_at) VALUES (1, NULL, NULL);
      `);
    },
  },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

export async function runMigrations(db: SqlDb): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  let current = row?.user_version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      // user_version cannot be parameterized; version is a controlled integer literal.
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
    current = migration.version;
  }

  return current;
}
