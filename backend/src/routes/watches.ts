import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import db from '../db/db.js';
import { ContextService } from '../services/context.js';
import { getLLMProvider } from '../llm/provider.js';

const router = Router();

const CreateWatchSchema = z.object({
  reportId: z.string(),
  vendorId: z.string(),
  url: z.string().url(),
  label: z.string()
});

// Extracted check helper
export async function checkWatch(id: string): Promise<any> {
  const watch = db.prepare('SELECT * FROM watches WHERE id = ?').get(id) as any;
  if (!watch) {
    throw new Error('Watch not found');
  }

  const isMock = process.env.MOCK_CONTEXT === 'true' || process.env.MOCK_LLM === 'true';
  let changeResult = null;

  if (isMock) {
    await new Promise(r => setTimeout(r, 600));

    const changeId = `chg_${crypto.randomUUID().replace(/-/g, '')}`;
    const ts = new Date().toISOString();
    const summary = `The Pro tier subscription for ${watch.vendor_name} went from $29/mo to $35/mo.`;
    const before = `### Pro Tier\n- Price: $29 / month\n- Included: 100 checks, email support`;
    const after = `### Pro Tier\n- Price: $35 / month\n- Included: 100 checks, priority email support`;

    db.prepare(`
      INSERT INTO watch_changes (id, watch_id, detected_at, summary, before_content, after_content)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(changeId, id, ts, summary, before, after);

    db.prepare(`
      UPDATE watches
      SET last_checked_at = ?, change_count = change_count + 1
      WHERE id = ?
    `).run(ts, id);

    changeResult = {
      id: changeId,
      detectedAt: ts,
      summary,
      before,
      after
    };
  } else {
    const contextService = new ContextService();
    const llm = getLLMProvider();

    // Scrape new page bypassing the cache
    const newMarkdown = await contextService.scrapeUrl('direct_watch_check', watch.url, watch.vendor_name.toLowerCase() + '.com');
    const prevPage = db.prepare('SELECT markdown FROM pages WHERE url = ?').get(watch.url) as { markdown: string } | undefined;

    if (prevPage && prevPage.markdown !== newMarkdown) {
      const systemPrompt = `You are an automated price watch analyzer.
Compare the old and new website content. Identify if there are any meaningful pricing changes.
Output ONLY a JSON response:
{
  "changed": true,
  "summary": "Professional tier went from $49/mo -> $59/mo",
  "before": "Old pricing snippet",
  "after": "New pricing snippet"
}
If no major pricing changes were found, output:
{
  "changed": false,
  "summary": "",
  "before": "",
  "after": ""
}`;
      const userPrompt = `Old content:\n${prevPage.markdown}\n\nNew content:\n${newMarkdown}`;
      const responseText = await llm.complete(systemPrompt, userPrompt);
      
      try {
        const parsed = JSON.parse(responseText.trim().replace(/^```json/, '').replace(/```$/, ''));
        if (parsed.changed) {
          const changeId = `chg_${crypto.randomUUID().replace(/-/g, '')}`;
          const ts = new Date().toISOString();

          db.prepare(`
            INSERT INTO watch_changes (id, watch_id, detected_at, summary, before_content, after_content)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(changeId, id, ts, parsed.summary, parsed.before, parsed.after);

          db.prepare(`
            UPDATE watches
            SET last_checked_at = ?, change_count = change_count + 1
            WHERE id = ?
          `).run(ts, id);

          changeResult = {
            id: changeId,
            detectedAt: ts,
            summary: parsed.summary,
            before: parsed.before,
            after: parsed.after
          };

          // Update cached page content
          db.prepare('INSERT OR REPLACE INTO pages (url, vendor_domain, markdown, scraped_at) VALUES (?, ?, ?, ?)')
            .run(watch.url, watch.vendor_name.toLowerCase() + '.com', newMarkdown, ts);
        }
      } catch (err) {
        console.error('[CheckWatch] Failed to parse diff LLM response:', err);
      }
    } else {
      // Update check timestamp
      db.prepare('UPDATE watches SET last_checked_at = ? WHERE id = ?').run(new Date().toISOString(), id);
    }
  }

  return changeResult;
}

// POST /api/watches
router.post('/', (req, res, next) => {
  try {
    const validated = CreateWatchSchema.parse(req.body);
    
    // Fetch vendor logo/name from report
    const reportRow = db.prepare('SELECT vendors FROM reports WHERE id = ?').get(validated.reportId) as any;
    if (!reportRow) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    const vendors = JSON.parse(reportRow.vendors);
    const vendor = vendors.find((v: any) => v.id === validated.vendorId);
    
    const vendorName = vendor ? vendor.name : 'Unknown Vendor';
    const vendorLogoUrl = vendor ? vendor.brand?.logoUrl : '';

    const id = `wtch_${crypto.randomUUID().replace(/-/g, '')}`;
    const ts = new Date().toISOString();

    db.prepare(`
      INSERT INTO watches (id, label, url, vendor_name, vendor_logo_url, last_checked_at, change_count, report_id, vendor_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      validated.label,
      validated.url,
      vendorName,
      vendorLogoUrl,
      ts,
      0,
      validated.reportId,
      validated.vendorId
    );

    res.status(201).json({
      id,
      label: validated.label,
      url: validated.url,
      vendorName,
      vendorLogoUrl,
      lastCheckedAt: ts,
      changeCount: 0
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/watches
router.get('/', (req, res, next) => {
  try {
    const rows = db.prepare(`
      SELECT id, label, url, vendor_name, vendor_logo_url, last_checked_at, change_count
      FROM watches
      ORDER BY last_checked_at DESC
    `).all() as any[];

    const result = rows.map(r => ({
      id: r.id,
      label: r.label,
      url: r.url,
      vendorName: r.vendor_name,
      vendorLogoUrl: r.vendor_logo_url,
      lastCheckedAt: r.last_checked_at,
      changeCount: r.change_count
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/watches/:id/changes
router.get('/:id/changes', (req, res, next) => {
  try {
    const { id } = req.params;
    const rows = db.prepare(`
      SELECT id, detected_at, summary, before_content, after_content
      FROM watch_changes
      WHERE watch_id = ?
      ORDER BY detected_at DESC
    `).all(id) as any[];

    const result = rows.map(r => ({
      id: r.id,
      detectedAt: r.detected_at,
      summary: r.summary,
      before: r.before_content,
      after: r.after_content
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/watches/:id/check
router.post('/:id/check', async (req, res, next) => {
  try {
    const { id } = req.params;
    const change = await checkWatch(id);
    res.json(change);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/watches/:id
router.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM watches WHERE id = ?').run(id);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Watch not found' });
      return;
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
