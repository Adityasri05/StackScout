import { parentPort } from 'worker_threads';
import pg from 'pg';
import dotenv from 'dotenv';
import * as fs from 'fs';

// Load environment variables inside the worker thread
dotenv.config();

let pool: pg.Pool | null = null;

if (process.env.DB_MODE === 'postgres') {
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || undefined,
    host: process.env.PGHOST || undefined,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
    user: process.env.PGUSER || undefined,
    password: process.env.PGPASSWORD || undefined,
    database: process.env.PGDATABASE || undefined,
  });
}

parentPort?.on('message', async (msg) => {
  const { action, sql, args, resultFile, sabIndex } = msg;
  
  try {
    if (!pool) {
      throw new Error('PostgreSQL pool not initialized. Set DB_MODE=postgres and supply connection credentials.');
    }

    if (action === 'exec') {
      // Split statements on semicolon if any (Postgres query handles multi-statements natively, but let's clean it)
      await pool.query(sql);
      fs.writeFileSync(resultFile, JSON.stringify({ success: true }));
    } else {
      const adjustedSql = adjustSqlForPostgres(sql);
      const convertedSql = convertSqlPlaceholder(adjustedSql);
      
      const res = await pool.query(convertedSql, args);
      fs.writeFileSync(resultFile, JSON.stringify({
        success: true,
        rows: res.rows,
        rowCount: res.rowCount
      }));
    }
  } catch (err: any) {
    console.error('[DB-Worker] Error running PostgreSQL query:', err, '\nSQL:', sql);
    try {
      fs.writeFileSync(resultFile, JSON.stringify({ success: false, error: err.message || String(err) }));
    } catch (e) {
      // Ignore
    }
  }

  // Notify the main thread that the query result is written
  const sharedArray = new Int32Array(msg.sab);
  Atomics.store(sharedArray, sabIndex, 1);
  Atomics.notify(sharedArray, sabIndex);
});

// Remap ? placeholders to $1, $2, $3...
function convertSqlPlaceholder(sql: string): string {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

// Map SQLite-specific dialects to standard PostgreSQL
function adjustSqlForPostgres(sql: string): string {
  let adjusted = sql.trim();
  
  // remap pages table upsert
  if (adjusted.includes('INSERT OR REPLACE INTO pages')) {
    return `
      INSERT INTO pages (url, vendor_domain, markdown, scraped_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (url) DO UPDATE SET 
        vendor_domain = EXCLUDED.vendor_domain, 
        markdown = EXCLUDED.markdown, 
        scraped_at = EXCLUDED.scraped_at
    `;
  }
  
  // remap page_cache table upsert
  if (adjusted.includes('INSERT OR REPLACE INTO page_cache')) {
    return `
      INSERT INTO page_cache (url, scraped_date)
      VALUES (?, ?)
      ON CONFLICT (url, scraped_date) DO NOTHING
    `;
  }
  
  // remap brand_cache table upsert
  if (adjusted.includes('INSERT OR REPLACE INTO brand_cache')) {
    return `
      INSERT INTO brand_cache (domain, logo_url, primary_color, colors, fonts, company_metadata, cached_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (domain) DO UPDATE SET
        logo_url = EXCLUDED.logo_url,
        primary_color = EXCLUDED.primary_color,
        colors = EXCLUDED.colors,
        fonts = EXCLUDED.fonts,
        company_metadata = EXCLUDED.company_metadata,
        cached_at = EXCLUDED.cached_at
    `;
  }

  // Clean general INSERT OR REPLACE statements
  adjusted = adjusted.replace(/INSERT OR REPLACE INTO/gi, 'INSERT INTO');
  adjusted = adjusted.replace(/INSERT OR IGNORE INTO/gi, 'INSERT INTO');

  return adjusted;
}
