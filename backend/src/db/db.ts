import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';
import crypto from 'crypto';

// Resolve directory paths in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbMode = process.env.DB_MODE || 'sqlite';
const isPostgres = dbMode === 'postgres';

let sqliteDb: any = null;
let pgWorker: Worker | null = null;
const tempDir = path.resolve(__dirname, '../../.temp_queries');

// Setup schema SQL
let schemaPath = path.resolve(__dirname, 'schema.sql');
if (!fs.existsSync(schemaPath)) {
  schemaPath = path.resolve(__dirname, '../../src/db/schema.sql');
}
const schema = fs.readFileSync(schemaPath, 'utf-8');

if (!isPostgres) {
  // SQLite mode
  const DB_DIR = path.resolve(__dirname, '../../data');
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const DB_PATH = path.join(DB_DIR, 'stackscout.db');
  sqliteDb = new Database(DB_PATH);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.exec(schema);
} else {
  // PostgreSQL mode: Initialize worker thread
  console.log('[DB] Running in PostgreSQL database mode.');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Determine path of the worker file.
  let workerPath = path.resolve(__dirname, 'worker.js');
  if (!fs.existsSync(workerPath)) {
    workerPath = path.resolve(__dirname, '../../src/db/worker.ts');
  }

  // tsx can load worker.ts directly
  pgWorker = new Worker(workerPath, {
    execArgv: workerPath.endsWith('.ts') ? ['--import', 'tsx'] : []
  });

  // Initialize schema on PostgreSQL
  execPgQuery('exec', schema, []);
}

// Helper function to execute PostgreSQL queries synchronously via Worker Thread
function execPgQuery(action: 'exec' | 'query', sql: string, args: any[]): any {
  const queryId = crypto.randomUUID().replace(/-/g, '');
  const resultFile = path.join(tempDir, `res_${queryId}.json`);
  
  // Create SharedArrayBuffer for thread synchronization
  const sab = new SharedArrayBuffer(4);
  const sharedArray = new Int32Array(sab);
  Atomics.store(sharedArray, 0, 0);

  // Send request to worker
  pgWorker!.postMessage({
    action,
    sql,
    args,
    resultFile,
    sab,
    sabIndex: 0
  });

  // Block main thread until worker signals completion (notifies index 0)
  Atomics.wait(sharedArray, 0, 0);

  // Read response
  if (!fs.existsSync(resultFile)) {
    throw new Error('[DB] Worker failed to output result file');
  }
  
  const content = fs.readFileSync(resultFile, 'utf-8');
  fs.unlinkSync(resultFile); // Clean up temp file

  const response = JSON.parse(content);
  if (!response.success) {
    throw new Error(response.error || 'Query failed in PG worker');
  }

  return response;
}

// Database Connection Adapter Wrapper
const db = {
  // exec method (SQLite style)
  exec(sql: string) {
    if (!isPostgres) {
      sqliteDb.exec(sql);
    } else {
      execPgQuery('exec', sql, []);
    }
  },

  // pragma method (SQLite style - no-op in Postgres)
  pragma(pragmaSql: string) {
    if (!isPostgres) {
      sqliteDb.pragma(pragmaSql);
    }
  },

  // prepare method (SQLite style)
  prepare(sql: string) {
    if (!isPostgres) {
      const stmt = sqliteDb.prepare(sql);
      return {
        run(...args: any[]) {
          const res = stmt.run(...args);
          return {
            changes: res.changes,
            lastInsertRowid: res.lastInsertRowid
          };
        },
        get(...args: any[]) {
          return stmt.get(...args);
        },
        all(...args: any[]) {
          return stmt.all(...args);
        }
      };
    } else {
      // PostgreSQL statement adapter
      return {
        run(...args: any[]) {
          const res = execPgQuery('query', sql, args);
          return {
            changes: res.rowCount,
            lastInsertRowid: null
          };
        },
        get(...args: any[]) {
          const res = execPgQuery('query', sql, args);
          return res.rows[0] || undefined;
        },
        all(...args: any[]) {
          const res = execPgQuery('query', sql, args);
          return res.rows;
        }
      };
    }
  }
};

const DB_PATH = !isPostgres ? path.join(path.resolve(__dirname, '../../data'), 'stackscout.db') : '';

export default db;
export { DB_PATH };
