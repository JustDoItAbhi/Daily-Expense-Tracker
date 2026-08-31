declare module "sql.js" {
  export interface Statement {
    bind(params?: any[]): boolean;
    step(): boolean;
    getAsObject(): Record<string, any>;
    free(): boolean;
  }

  export interface Database {
    run(sql: string, params?: any[]): Database;
    exec(sql: string): any;
    prepare(sql: string): Statement;
    export(): Uint8Array;
    getRowsModified(): number;
    close(): void;
  }

  export interface SqlJsStatic {
    Database: { new (data?: Uint8Array | null): Database };
  }

  export interface InitSqlJsConfig {
    locateFile?: (file: string) => string;
    wasmBinary?: ArrayBuffer | Uint8Array;
  }

  export default function initSqlJs(config?: InitSqlJsConfig): Promise<SqlJsStatic>;
}
