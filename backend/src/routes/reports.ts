import { Router } from 'express';
import db from '../db/db.js';

const router = Router();

// GET /api/reports
router.get('/', (req, res, next) => {
  try {
    const rows = db.prepare(`
      SELECT id, query, created_at, vendors, recommendation
      FROM reports
      ORDER BY created_at DESC
    `).all() as any[];

    const result = rows.map(r => {
      let vendorCount = 0;
      let topPickName = '';
      let topPickLogoUrl = '';

      try {
        const vendors = JSON.parse(r.vendors);
        const recommendation = JSON.parse(r.recommendation);
        vendorCount = vendors.length;

        const topPick = vendors.find((v: any) => v.id === recommendation.topPickVendorId);
        if (topPick) {
          topPickName = topPick.name;
          topPickLogoUrl = topPick.brand?.logoUrl || '';
        }
      } catch (err) {
        console.error(`Error parsing report columns for id ${r.id}:`, err);
      }

      return {
        id: r.id,
        query: r.query,
        createdAt: r.created_at,
        vendorCount,
        topPickName,
        topPickLogoUrl
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/:id
router.get('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const row = db.prepare(`
      SELECT id, query, created_at, requirement, vendors, recommendation, credit_usage
      FROM reports
      WHERE id = ?
    `).get(id) as any;

    if (!row) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    res.json({
      id: row.id,
      query: row.query,
      createdAt: row.created_at,
      requirement: JSON.parse(row.requirement),
      vendors: JSON.parse(row.vendors),
      recommendation: JSON.parse(row.recommendation),
      creditUsage: JSON.parse(row.credit_usage)
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/reports/:id
router.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM reports WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }
    
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
