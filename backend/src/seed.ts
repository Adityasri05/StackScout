import dotenv from 'dotenv';
dotenv.config();

// Force mock mode for database seeding to prevent API credit consumption on fictional domains
process.env.MOCK_CONTEXT = 'true';
process.env.MOCK_LLM = 'true';

import db from './db/db.js';
import { runPipeline } from './pipeline/runner.js';
import crypto from 'crypto';

async function main() {
  console.log('[Seed] Resetting database tables...');
  
  db.prepare('DELETE FROM jobs').run();
  db.prepare('DELETE FROM job_events').run();
  db.prepare('DELETE FROM reports').run();
  db.prepare('DELETE FROM watches').run();
  db.prepare('DELETE FROM watch_changes').run();

  const jobId = `job_seed_${crypto.randomUUID().replace(/-/g, '')}`;
  const query = 'uptime monitoring tool under $50/month, EU data residency, Slack alerts';
  const ts = new Date().toISOString();

  // Create running job entry
  db.prepare(`
    INSERT INTO jobs (job_id, status, stage, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(jobId, 'running', 'plan', ts, ts);

  console.log(`[Seed] Running pipeline run in mock mode for query: "${query}"...`);
  
  // This will run plan, discover, map, collect, extract, brand, score, synthesize, and done stages
  await runPipeline(jobId, query, ['uptimeradar.io', 'pingsentinel.com', 'statsentry.net'], 3);

  // Fetch the created report
  const reportRow = db.prepare('SELECT id, vendors FROM reports LIMIT 1').get() as any;
  if (!reportRow) {
    throw new Error('Pipeline failed to generate report during seed.');
  }

  const reportId = reportRow.id;
  const vendors = JSON.parse(reportRow.vendors);
  const pingsentinel = vendors.find((v: any) => v.domain.includes('pingsentinel'));

  if (!pingsentinel) {
    throw new Error('PingSentinel vendor was not generated in the mock report.');
  }

  console.log('[Seed] Adding watch subscription for PingSentinel pricing...');
  
  const watchId = `wtch_seed_pingsentinel`;
  db.prepare(`
    INSERT INTO watches (id, label, url, vendor_name, vendor_logo_url, last_checked_at, change_count, report_id, vendor_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    watchId,
    'PingSentinel Pricing Page',
    'https://pingsentinel.com/pricing',
    pingsentinel.name,
    pingsentinel.brand?.logoUrl || '',
    new Date(Date.now() - 3600000).toISOString(),
    1,
    reportId,
    pingsentinel.id
  );

  console.log('[Seed] Adding price change event for the PingSentinel watch...');
  
  const changeId = `chg_seed_pingsentinel`;
  db.prepare(`
    INSERT INTO watch_changes (id, watch_id, detected_at, summary, before_content, after_content)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    changeId,
    watchId,
    new Date(Date.now() - 3600000).toISOString(),
    'Basic Plan price adjusted from $15/mo to $19/mo.',
    `### Basic Plan\n- Price: $15 / month\n- Monitors: 20\n- Frequency: 1-minute\n- Alerts: Email & Slack`,
    `### Basic Plan\n- Price: $19 / month\n- Monitors: 20\n- Frequency: 1-minute\n- Alerts: Email & Slack`
  );

  console.log('[Seed] Seeding completed successfully!');
}

main().catch(err => {
  console.error('[Seed] Seeding process failed:', err);
  process.exit(1);
});
