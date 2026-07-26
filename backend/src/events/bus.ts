import { EventEmitter } from 'events';
import db from '../db/db.js';
import { PipelineEvent } from '../types.js';
import crypto from 'crypto';

class EventBus extends EventEmitter {
  emitEvent(
    jobId: string,
    stage: PipelineEvent['stage'],
    level: PipelineEvent['level'],
    message: string,
    data?: any
  ) {
    const ts = new Date().toISOString();
    const event: PipelineEvent = {
      ts,
      stage,
      level,
      message,
      data
    };

    try {
      // Save to Database
      const id = `evt_${crypto.randomUUID()}`;
      const insertStmt = db.prepare(`
        INSERT INTO job_events (id, job_id, ts, stage, level, message, data, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertStmt.run(
        id,
        jobId,
        event.ts,
        event.stage,
        event.level,
        event.message,
        data ? JSON.stringify(data) : null,
        ts
      );

      // Update job state
      if (stage === 'done') {
        const updateJob = db.prepare(`
          UPDATE jobs SET status = 'done', stage = ?, report_id = ?, updated_at = ? WHERE job_id = ?
        `);
        updateJob.run(stage, data?.reportId || null, ts, jobId);
      } else if (stage === 'error') {
        const updateJob = db.prepare(`
          UPDATE jobs SET status = 'failed', stage = ?, error = ?, updated_at = ? WHERE job_id = ?
        `);
        updateJob.run(stage, message, ts, jobId);
      } else {
        const updateJob = db.prepare(`
          UPDATE jobs SET stage = ?, updated_at = ? WHERE job_id = ?
        `);
        updateJob.run(stage, ts, jobId);
      }
    } catch (err) {
      console.error(`[EventBus] Error persisting event for job ${jobId}:`, err);
    }

    // Emit event locally to trigger SSE streaming
    this.emit(`job:${jobId}`, event);
  }

  getHistory(jobId: string): PipelineEvent[] {
    try {
      const rows = db.prepare(`
        SELECT ts, stage, level, message, data
        FROM job_events
        WHERE job_id = ?
        ORDER BY ts ASC
      `).all(jobId) as any[];

      return rows.map(r => ({
        ts: r.ts,
        stage: r.stage,
        level: r.level,
        message: r.message,
        data: r.data ? JSON.parse(r.data) : undefined
      }));
    } catch (err) {
      console.error(`[EventBus] Error fetching event history for job ${jobId}:`, err);
      return [];
    }
  }
}

export const eventBus = new EventBus();
