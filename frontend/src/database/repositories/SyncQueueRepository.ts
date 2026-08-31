import type { SqlDb } from "../driver";
import { getDb } from "../database";
import { newId } from "@/src/utils/id";

/**
 * Outbox / sync queue repository.
 *
 * Every local mutation enqueues an operation here inside the SAME transaction
 * that wrote the entity (see ExpenseRepository). This guarantees the UI update
 * and the "to be synced" record are atomic — the UI never waits on the network,
 * and a crash can never leave a change that is applied locally but lost for sync.
 *
 * Each operation carries a unique `operationId` so the server can be idempotent
 * (safe to receive the same operation multiple times after retries).
 */
export type SyncEntity = "expense" | "category";
export type SyncOperation = "CREATE" | "UPDATE" | "DELETE";
export type SyncQueueStatus = "PENDING" | "FAILED";

export interface SyncQueueItem {
  operationId: string;
  entity: SyncEntity;
  entityId: string;
  operation: SyncOperation;
  payload: unknown;
  baseVersion: number | null;
  createdAt: string;
  attempts: number;
  lastError: string | null;
  status: SyncQueueStatus;
}

interface EnqueueInput {
  entity: SyncEntity;
  entityId: string;
  operation: SyncOperation;
  payload: unknown;
  baseVersion: number | null;
}

/**
 * Enqueue using an existing db handle so the caller can wrap it in a transaction
 * together with the entity write (atomic outbox pattern).
 */
export async function enqueueWithDb(db: SqlDb, input: EnqueueInput): Promise<void> {
  await db.runAsync(
    `INSERT INTO sync_queue
       (operation_id, entity, entity_id, operation, payload, base_version, created_at, attempts, last_error, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL, 'PENDING')`,
    newId("op"),
    input.entity,
    input.entityId,
    input.operation,
    JSON.stringify(input.payload),
    input.baseVersion,
    new Date().toISOString(),
  );
}

export const SyncQueueRepository = {
  async getPending(): Promise<SyncQueueItem[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM sync_queue WHERE status IN ('PENDING','FAILED') ORDER BY created_at ASC`,
    );
    return rows.map((r) => ({
      operationId: r.operation_id,
      entity: r.entity,
      entityId: r.entity_id,
      operation: r.operation,
      payload: JSON.parse(r.payload),
      baseVersion: r.base_version ?? null,
      createdAt: r.created_at,
      attempts: r.attempts,
      lastError: r.last_error ?? null,
      status: r.status,
    }));
  },

  async count(): Promise<number> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ c: number }>(
      `SELECT COUNT(*) as c FROM sync_queue WHERE status IN ('PENDING','FAILED')`,
    );
    return row?.c ?? 0;
  },

  async remove(operationId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(`DELETE FROM sync_queue WHERE operation_id = ?`, operationId);
  },

  async markFailed(operationId: string, error: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE sync_queue SET status = 'FAILED', attempts = attempts + 1, last_error = ? WHERE operation_id = ?`,
      error,
      operationId,
    );
  },
};
