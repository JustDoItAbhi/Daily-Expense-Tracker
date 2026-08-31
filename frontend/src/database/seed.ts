import { getDb } from "./database";
import { CategoryRepository } from "./repositories/CategoryRepository";
import { preferencesStorage } from "@/src/storage/preferencesStorage";
import { DEFAULT_CATEGORIES } from "@/src/mock/categories";
import { DEMO_EXPENSES } from "@/src/mock/seed";

/**
 * Controllable seeding.
 *
 * - Default categories are always ensured when the table is empty (the app
 *   cannot function without categories).
 * - Demo expenses are only loaded when seeding is enabled (preferences flag,
 *   default true) and only once, into an empty expenses table. This keeps the
 *   existing test scenarios working while clearly isolating seed data from
 *   production behaviour — turning the flag off yields a clean install.
 *
 * Seed rows are written directly (no sync_queue) — they are local demo data,
 * not user-authored changes awaiting sync.
 */
const toMinor = (amount: number): number => Math.round(amount * 100);

export async function ensureSeed(deviceId: string): Promise<void> {
  const db = await getDb();

  // 1) Categories — always ensure defaults exist.
  const catCount = await CategoryRepository.count();
  if (catCount === 0) {
    const now = new Date().toISOString();
    await db.withTransactionAsync(async () => {
      for (const c of DEFAULT_CATEGORIES) {
        await db.runAsync(
          `INSERT OR IGNORE INTO categories
             (id, server_id, name, icon, color, active, created_at, updated_at, deleted_at, version, sync_status)
           VALUES (?, NULL, ?, ?, ?, ?, ?, ?, NULL, 1, 'LOCAL')`,
          c.id,
          c.name,
          c.icon,
          c.color,
          c.active ? 1 : 0,
          now,
          now,
        );
      }
    });
  }

  // 2) Demo expenses — only when enabled and not yet seeded.
  const seedEnabled = await preferencesStorage.isSeedEnabled();
  const seedDone = await preferencesStorage.isSeedDone();
  if (!seedEnabled || seedDone) return;

  const expRow = await db.getFirstAsync<{ c: number }>(`SELECT COUNT(*) as c FROM expenses`);
  if ((expRow?.c ?? 0) > 0) {
    await preferencesStorage.setSeedDone(true);
    return;
  }

  await db.withTransactionAsync(async () => {
    for (const e of DEMO_EXPENSES) {
      await db.runAsync(
        `INSERT OR IGNORE INTO expenses
           (id, server_id, user_id, product_name, amount_minor, currency, category_id, notes,
            expense_date, created_at, updated_at, deleted_at, version, sync_status, device_id)
         VALUES (?, NULL, ?, ?, ?, ?, ?, NULL, ?, ?, ?, NULL, 1, 'LOCAL', ?)`,
        e.id,
        e.userId,
        e.productName,
        toMinor(e.amount),
        e.currency,
        e.categoryId,
        e.expenseDate,
        e.createdAt,
        e.createdAt,
        deviceId,
      );
    }
  });
  await preferencesStorage.setSeedDone(true);
}
