import type { SqlDb } from "../driver";
import { getDb } from "../database";
import { newId } from "@/src/utils/id";
import { Category, SyncStatus } from "@/src/types";
import { enqueueWithDb } from "./SyncQueueRepository";

/**
 * CategoryRepository — the ONLY place that reads/writes the `categories` table.
 * Mirrors ExpenseRepository: soft deletes + atomic outbox enqueue.
 */

function mapRow(r: any): Category {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    active: r.active === 1,
    serverId: r.server_id ?? undefined,
    updatedAt: r.updated_at ?? undefined,
    deletedAt: r.deleted_at ?? undefined,
    version: r.version ?? 1,
    syncStatus: (r.sync_status as SyncStatus) ?? "LOCAL",
  };
}

function toServerDTO(c: Category) {
  return {
    clientId: c.id,
    serverId: c.serverId ?? null,
    name: c.name,
    icon: c.icon,
    color: c.color,
    active: c.active,
    deletedAt: c.deletedAt ?? null,
    version: c.version ?? 1,
  };
}

async function loadById(db: SqlDb, id: string): Promise<Category | null> {
  const row = await db.getFirstAsync<any>(`SELECT * FROM categories WHERE id = ?`, id);
  return row ? mapRow(row) : null;
}

export const CategoryRepository = {
  async getAll(): Promise<Category[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY created_at ASC`,
    );
    return rows.map(mapRow);
  },

  async count(): Promise<number> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ c: number }>(`SELECT COUNT(*) as c FROM categories`);
    return row?.c ?? 0;
  },

  async create(name: string, icon: string, color: string): Promise<Category> {
    const db = await getDb();
    const now = new Date().toISOString();
    const category: Category = {
      id: newId("cat"),
      name,
      icon,
      color,
      active: true,
      version: 1,
      syncStatus: "LOCAL",
      updatedAt: now,
    };
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO categories
           (id, server_id, name, icon, color, active, created_at, updated_at, deleted_at, version, sync_status)
         VALUES (?, NULL, ?, ?, ?, 1, ?, ?, NULL, 1, 'LOCAL')`,
        category.id,
        category.name,
        category.icon,
        category.color,
        now,
        now,
      );
      await enqueueWithDb(db, {
        entity: "category",
        entityId: category.id,
        operation: "CREATE",
        payload: toServerDTO(category),
        baseVersion: null,
      });
    });
    return category;
  },

  async update(id: string, patch: Partial<Category>): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      const current = await loadById(db, id);
      if (!current) return;
      const next: Category = {
        ...current,
        ...patch,
        id: current.id,
        version: (current.version ?? 1) + 1,
        updatedAt: new Date().toISOString(),
        syncStatus: current.syncStatus === "SYNCED" ? "PENDING" : "LOCAL",
      };
      await db.runAsync(
        `UPDATE categories SET name = ?, icon = ?, color = ?, active = ?, updated_at = ?, version = ?, sync_status = ? WHERE id = ?`,
        next.name,
        next.icon,
        next.color,
        next.active ? 1 : 0,
        next.updatedAt!,
        next.version!,
        next.syncStatus!,
        id,
      );
      await enqueueWithDb(db, {
        entity: "category",
        entityId: id,
        operation: "UPDATE",
        payload: toServerDTO(next),
        baseVersion: current.version ?? 1,
      });
    });
  },

  async softDelete(id: string): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      const current = await loadById(db, id);
      if (!current) return;
      const now = new Date().toISOString();
      const version = (current.version ?? 1) + 1;
      await db.runAsync(
        `UPDATE categories SET deleted_at = ?, updated_at = ?, version = ?, sync_status = ? WHERE id = ?`,
        now,
        now,
        version,
        current.syncStatus === "SYNCED" ? "PENDING" : "LOCAL",
        id,
      );
      await enqueueWithDb(db, {
        entity: "category",
        entityId: id,
        operation: "DELETE",
        payload: toServerDTO({ ...current, deletedAt: now, updatedAt: now, version }),
        baseVersion: current.version ?? 1,
      });
    });
  },
};
