import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import db from '../db/db.js';
import { runPipeline } from '../pipeline/runner.js';
import { eventBus } from '../events/bus.js';

const router = Router();

const CreateResearchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  vendorDomains: z.array(z.string()).optional(),
  maxVendors: z.number().max(6).optional()
});

// POST /api/research
router.post('/', async (req, res, next) => {
  try {
    const validated = CreateResearchSchema.parse(req.body);
    const jobId = `job_${crypto.randomUUID().replace(/-/g, '')}`;
    const ts = new Date().toISOString();

    // Insert job into DB
    db.prepare(`
      INSERT INTO jobs (job_id, status, stage, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(jobId, 'running', 'plan', ts, ts);

    // Trigger pipeline run in background
    runPipeline(jobId, validated.query, validated.vendorDomains, validated.maxVendors || 6)
      .catch(err => {
        console.error(`[ResearchRoute] Background pipeline execution error:`, err);
      });

    res.status(202).json({ jobId });
  } catch (err) {
    next(err);
  }
});

// GET /api/research/:jobId
router.get('/:jobId', (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = db.prepare(`
      SELECT job_id, status, stage, report_id, error, credit_scrapes, credit_brands, credit_total
      FROM jobs WHERE job_id = ?
    `).get(jobId) as any;

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.json({
      jobId: job.job_id,
      status: job.status,
      stage: job.stage,
      reportId: job.report_id || undefined,
      error: job.error || undefined,
      creditUsage: {
        scrapes: job.credit_scrapes,
        brandCalls: job.credit_brands,
        totalCredits: job.credit_total
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/research/:jobId/events (Server-Sent Events)
router.get('/:jobId/events', (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    // Check if job exists
    const jobExists = db.prepare('SELECT 1 FROM jobs WHERE job_id = ?').get(jobId);
    if (!jobExists) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no'
    });

    res.write('\n');

    // 1. Replay historical events
    const history = eventBus.getHistory(jobId);
    history.forEach(evt => {
      res.write(`data: ${JSON.stringify(evt)}\n\n`);
    });
    if (typeof (res as any).flush === 'function') {
      (res as any).flush();
    }

    // 2. Register live listener
    const listener = (event: any) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    };
    
    eventBus.on(`job:${jobId}`, listener);

    // 3. Setup heartbeat to prevent socket timeouts
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    }, 15000);

    // 4. Handle client connection closes
    req.on('close', () => {
      eventBus.off(`job:${jobId}`, listener);
      clearInterval(heartbeat);
      res.end();
    });

  } catch (err) {
    next(err);
  }
});

export default router;
