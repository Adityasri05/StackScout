import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Resolve directory paths in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'stackscout.db');
const db = new Database(DB_PATH);

// Enable WAL mode for concurrency
db.pragma('journal_mode = WAL');

// Execute SQL schema setup
let schemaPath = path.resolve(__dirname, 'schema.sql');
if (!fs.existsSync(schemaPath)) {
  schemaPath = path.resolve(__dirname, '../../src/db/schema.sql');
}
const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);

export default db;
export { DB_PATH };
