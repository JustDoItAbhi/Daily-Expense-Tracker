import type { SqlDb } from "../driver";
import { getDb } from "../database";
import { newId } from "@/src/utils/id";
import { Currency, Expense, SyncStatus } from "@/src/types";
import { enqueueWithDb } from "./SyncQueueRepository";

/**
 * ExpenseRepository — the ONLY place that reads/writes the `expenses` table.
 *
 * Design notes:
 *  - Money is stored as integer minor units (`amount_minor`) to avoid floating
 *    point drift (§62). The public `Expense.amount` stays a major-unit decimal
 *    so existing screens and formatting are unchanged; conversion happens here.
 *  - Deletes are soft (tombstones via `deleted_at`) so multi-device sync can
 *    propagate removals correctly (§11).
 *  - Every mutation writes the entity AND a sync_queue entry inside one
 *    transaction (atomic outbox, §17/§59).
 *  - Timestamps are UTC ISO strings (§63).
 */

const toMinor = (amount: number): number => Math.round(amount * 100);
const toMajor = (minor: number): number => Math.round(minor) / 100;

function mapRow(r: any): Expense {
  return {
    id: r.id,
    serverId: r.server_id ?? undefined,
    userId: r.user_id,
    productName: r.product_name,
    amount: toMajor(r.amount_minor),
    currency: r.currency as Currency,
    categoryId: r.category_id,
    notes: r.notes ?? undefined,
    expenseDate: r.expense_date,
    createdAt: r.created_at,
    updatedAt: r.updated_at ?? undefined,
    deletedAt: r.deleted_at ?? undefined,
    version: r.version ?? 1,
    syncStatus: (r.sync_status as SyncStatus) ?? "LOCAL",
    deviceId: r.device_id ?? undefined,
  };
}

/** Server-facing DTO stored in the outbox payload (minor units, camelCase). */
function toServerDTO(e: Expense) {
  return {
    clientId: e.id,
    serverId: e.serverId ?? null,
    productName: e.productName,
    amountMinor: toMinor(e.amount),
    currency: e.currency,
    categoryId: e.categoryId,
    notes: e.notes ?? null,
    expenseDate: e.expenseDate,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt ?? e.createdAt,
    deletedAt: e.deletedAt ?? null,
    version: e.version ?? 1,
  };
}

export interface CreateExpenseInput {
  userId: string;
  productName: string;
  amount: number;
  currency: Currency;
  categoryId: string;
  notes?: string;
  expenseDate?: string;
  deviceId: string;
}

async function loadById(db: SqlDb, id: string): Promise<Expense | null> {
  const row = await db.getFirstAsync<any>(`SELECT * FROM expenses WHERE id = ?`, id);
  return row ? mapRow(row) : null;
}

export const ExpenseRepository = {
  async getAll(): Promise<Expense[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM expenses WHERE deleted_at IS NULL ORDER BY expense_date DESC`,
    );
    return rows.map(mapRow);
  },

  async getById(id: string): Promise<Expense | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM expenses WHERE id = ? AND deleted_at IS NULL`,
      id,
    );
    return row ? mapRow(row) : null;
  },

  async create(input: CreateExpenseInput): Promise<Expense> {
    const db = await getDb();
    const now = new Date().toISOString();
    const expense: Expense = {
      id: newId("e"),
      userId: input.userId,
      productName: input.productName,
      amount: input.amount,
      currency: input.currency,
      categoryId: input.categoryId,
      notes: input.notes,
      expenseDate: input.expenseDate ?? now,
      createdAt: now,
      updatedAt: now,
      version: 1,
      syncStatus: "LOCAL",
      deviceId: input.deviceId,
    };

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO expenses
           (id, server_id, user_id, product_name, amount_minor, currency, category_id, notes,
            expense_date, created_at, updated_at, deleted_at, version, sync_status, device_id)
         VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 1, 'LOCAL', ?)`,
        expense.id,
        expense.userId,
        expense.productName,
        toMinor(expense.amount),
        expense.currency,
        expense.categoryId,
        expense.notes ?? null,
        expense.expenseDate,
        expense.createdAt,
        expense.updatedAt!,
        expense.deviceId!,
      );
      await enqueueWithDb(db, {
        entity: "expense",
        entityId: expense.id,
        operation: "CREATE",
        payload: toServerDTO(expense),
        baseVersion: null,
      });
    });

    return expense;
  },

  async update(id: string, patch: Partial<Expense>): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      const current = await loadById(db, id);
      if (!current) return;
      const next: Expense = {
        ...current,
        ...patch,
        id: current.id,
        version: (current.version ?? 1) + 1,
        updatedAt: new Date().toISOString(),
        syncStatus: current.syncStatus === "SYNCED" ? "PENDING" : "LOCAL",
      };
      await db.runAsync(
        `UPDATE expenses SET
           product_name = ?, amount_minor = ?, currency = ?, category_id = ?, notes = ?,
           expense_date = ?, updated_at = ?, version = ?, sync_status = ?
         WHERE id = ?`,
        next.productName,
        toMinor(next.amount),
        next.currency,
        next.categoryId,
        next.notes ?? null,
        next.expenseDate,
        next.updatedAt!,
        next.version!,
        next.syncStatus!,
        id,
      );
      await enqueueWithDb(db, {
        entity: "expense",
        entityId: id,
        operation: "UPDATE",
        payload: toServerDTO(next),
        baseVersion: current.version ?? 1,
      });
    });
  },

  /** Soft delete (tombstone) — record is retained for sync propagation. */
  async softDelete(id: string): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      const current = await loadById(db, id);
      if (!current) return;
      const now = new Date().toISOString();
      const version = (current.version ?? 1) + 1;
      await db.runAsync(
        `UPDATE expenses SET deleted_at = ?, updated_at = ?, version = ?, sync_status = ? WHERE id = ?`,
        now,
        now,
        version,
        current.syncStatus === "SYNCED" ? "PENDING" : "LOCAL",
        id,
      );
      await enqueueWithDb(db, {
        entity: "expense",
        entityId: id,
        operation: "DELETE",
        payload: toServerDTO({ ...current, deletedAt: now, updatedAt: now, version }),
        baseVersion: current.version ?? 1,
      });
    });
  },

  async getPendingSync(): Promise<Expense[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM expenses WHERE sync_status IN ('LOCAL','PENDING','FAILED') ORDER BY updated_at ASC`,
    );
    return rows.map(mapRow);
  },

  async markSynced(id: string, serverId: string, version: number): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE expenses SET sync_status = 'SYNCED', server_id = ?, version = ? WHERE id = ?`,
      serverId,
      version,
      id,
    );
  },
};
