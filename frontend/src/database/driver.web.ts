import AsyncStorage from "@react-native-async-storage/async-storage";
import initSqlJs, { Database, SqlJsStatic } from "sql.js";
import type { SqlDb, SqlParam, SqlRunResult } from "./driver";
import { SQL_WASM_BASE64 } from "./sql-wasm-base64";

/**
 * SQL driver abstraction (WEB implementation).
 *
 * expo-sqlite's web backend relies on a WASM worker + cross-origin isolation
 * that is not reliably available behind the dev preview proxy. To keep the web
 * preview (and automated testing) fully functional against the SAME schema and
 * SQL, we run sql.js (SQLite compiled to WASM, single file, no worker) and
 * persist the exported database bytes to AsyncStorage after every committed
 * write. This is a web-only convenience; native devices use real expo-sqlite.
 */

let sqlJsPromise: Promise<SqlJsStatic> | null = null;
function getSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({ wasmBinary: bytesFromBase64(SQL_WASM_BASE64) });
  }
  return sqlJsPromise;
}

function base64FromBytes(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

function bytesFromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

class WebSqlDb implements SqlDb {
  private inTx = false;

  constructor(
    private db: Database,
    private storeKey: string,
  ) {}

  private async persist(): Promise<void> {
    if (this.inTx) return; // atomic: only persist committed state
    const data = this.db.export();
    await AsyncStorage.setItem(this.storeKey, base64FromBytes(data));
  }

  async execAsync(sql: string): Promise<void> {
    this.db.exec(sql);
    await this.persist();
  }

  async runAsync(sql: string, ...params: SqlParam[]): Promise<SqlRunResult> {
    this.db.run(sql, params as any[]);
    const changes = this.db.getRowsModified();
    await this.persist();
    return { changes, lastInsertRowId: 0 };
  }

  async getAllAsync<T = any>(sql: string, ...params: SqlParam[]): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    stmt.bind(params as any[]);
    const rows: T[] = [];
    while (stmt.step()) rows.push(stmt.getAsObject() as T);
    stmt.free();
    return rows;
  }

  async getFirstAsync<T = any>(sql: string, ...params: SqlParam[]): Promise<T | null> {
    const rows = await this.getAllAsync<T>(sql, ...params);
    return rows.length > 0 ? rows[0] : null;
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    this.db.exec("BEGIN");
    this.inTx = true;
    try {
      await task();
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      this.inTx = false;
      throw e;
    }
    this.inTx = false;
    await this.persist();
  }
}

export async function openSqlDb(name: string): Promise<SqlDb> {
  const SQL = await getSqlJs();
  const storeKey = `sqljs:${name}`;
  const saved = await AsyncStorage.getItem(storeKey);
  const db = saved ? new SQL.Database(bytesFromBase64(saved)) : new SQL.Database();
  return new WebSqlDb(db, storeKey);
}
