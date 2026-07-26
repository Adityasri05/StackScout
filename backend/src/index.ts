import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db from './db/db.js';
import healthRouter from './routes/health.js';
import researchRouter from './routes/research.js';
import reportsRouter from './routes/reports.js';
import watchesRouter, { checkWatch } from './routes/watches.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      /^http:\/\/localhost:\d+$/.test(origin) || 
      /^http:\/\/127\.0\.0\.1:\d+$/.test(origin) ||
      /\.railway\.app$/.test(origin)
    ) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/health', healthRouter);
app.use('/api/research', researchRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/watches', watchesRouter);

// Resolve directory paths in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static frontend assets if they exist (Production serving)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  console.log(`[Static] Serving frontend static assets from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));
  
  // Handle SPA client-side routing
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
  });
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[GlobalError]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    details: err.errors || undefined
  });
});

// Setup background watcher node-cron
const watchCron = process.env.WATCH_CRON || '0 */6 * * *';
cron.schedule(watchCron, async () => {
  console.log('[Cron] Running scheduled pricing watch checks...');
  try {
    const watches = db.prepare('SELECT id, label, vendor_name FROM watches').all() as any[];
    for (const w of watches) {
      try {
        console.log(`[Cron] Checking price page for ${w.vendor_name} (${w.label})...`);
        const result = await checkWatch(w.id);
        if (result) {
          console.log(`[Cron] Detected change for ${w.vendor_name}: ${result.summary}`);
        } else {
          console.log(`[Cron] No change detected for ${w.vendor_name}.`);
        }
      } catch (err) {
        console.error(`[Cron] Error checking watch ${w.id} (${w.vendor_name}):`, err);
      }
    }
  } catch (err) {
    console.error('[Cron] Failed to run watch checks:', err);
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  StackScout Backend running on port ${PORT}`);
  console.log(`  CORS enabled for http://localhost:5173`);
  console.log(`  Mock Context: ${process.env.MOCK_CONTEXT}`);
  console.log(`  Mock LLM: ${process.env.MOCK_LLM}`);
  console.log(`===============================================`);
});
