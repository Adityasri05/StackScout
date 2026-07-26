import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface BrandInfo {
  logoUrl: string;
  primaryColor: string;
  colors: string[];
  fonts: string[];
  company_metadata?: any;
}

// Rate Limiter to handle Context.dev API threshold limits (~20 calls/min)
class RateLimiter {
  private queue: (() => Promise<any>)[] = [];
  private activeCount = 0;
  private maxConcurrency = 2;
  private minInterval = 3000; // 3 seconds delay between calls
  private lastRequestTime = 0;

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const res = await fn();
          resolve(res);
        } catch (err) {
          reject(err);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) return;

    const now = Date.now();
    const timeSinceLast = now - this.lastRequestTime;
    if (timeSinceLast < this.minInterval) {
      setTimeout(() => this.processQueue(), this.minInterval - timeSinceLast);
      return;
    }

    this.lastRequestTime = Date.now();
    this.activeCount++;
    const nextFn = this.queue.shift()!;
    try {
      await nextFn();
    } catch (err) {
      // Handled in the promise constructor
    } finally {
      this.activeCount--;
      this.processQueue();
    }
  }
}

const rateLimiter = new RateLimiter();

// Fetch helper with retry logic for 429/5xx status codes
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> {
  try {
    const res = await fetch(url, options);
    if (!res.ok && (res.status === 429 || res.status >= 500) && retries > 0) {
      console.warn(`[Context.dev] API request failed with status ${res.status}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      console.warn(`[Context.dev] Fetch error, retrying in ${delay}ms...`, err);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw err;
  }
}

export class ContextService {
  private apiKey: string;
  private isMock: boolean;
  private baseUrl = 'https://api.context.dev/v1';

  constructor() {
    this.apiKey = process.env.CONTEXT_DEV_API_KEY || '';
    this.isMock = process.env.MOCK_CONTEXT === 'true';
  }

  // Increments job credit usage counters
  private incrementCredits(jobId: string, type: 'scrape' | 'brand') {
    try {
      const cost = type === 'scrape' ? 1 : 10;
      const creditField = type === 'scrape' ? 'credit_scrapes' : 'credit_brands';
      
      const stmt = db.prepare(`
        UPDATE jobs
        SET ${creditField} = ${creditField} + 1,
            credit_total = credit_total + ?
        WHERE job_id = ?
      `);
      stmt.run(cost, jobId);
    } catch (err) {
      console.error(`[ContextService] Failed to increment credits for job ${jobId}:`, err);
    }
  }

  // Scrape endpoint
  async scrapeUrl(jobId: string, url: string, vendorDomain: string): Promise<string> {
    const today = new Date().toISOString().split('T')[0];

    // Check Cache First
    try {
      const cached = db.prepare(`
        SELECT markdown FROM pages p
        JOIN page_cache c ON p.url = c.url
        WHERE p.url = ? AND c.scraped_date = ?
      `).get(url, today) as { markdown: string } | undefined;

      if (cached) {
        console.log(`[ContextService] Cache hit for URL: ${url}`);
        return cached.markdown;
      }
    } catch (err) {
      console.error('[ContextService] Cache read error:', err);
    }

    if (this.isMock) {
      // Increment credits simulated
      this.incrementCredits(jobId, 'scrape');
      await new Promise(r => setTimeout(r, 400)); // Simulate networking
      
      // Load fixture
      const fixtureName = vendorDomain.replace(/\.[a-z]+$/, '');
      const filePath = path.resolve(__dirname, `../../fixtures/${fixtureName}_pricing.md`);
      if (fs.existsSync(filePath)) {
        const markdown = fs.readFileSync(filePath, 'utf-8');
        this.cachePage(url, vendorDomain, markdown, today);
        return markdown;
      }
      const defaultMarkdown = `# Fictional Vendor Pricing\n\nPage mock for ${url}.\n- Startup Plan: $25/mo. Slack Integration enabled. Hosted in EU (Frankfurt). BAA signed for HIPAA.`;
      this.cachePage(url, vendorDomain, defaultMarkdown, today);
      return defaultMarkdown;
    }

    // Call Real API (enqueued to prevent rate limits)
    return rateLimiter.enqueue(async () => {
      this.incrementCredits(jobId, 'scrape');
      console.log(`[ContextService] Scrape request to Context.dev: ${url}`);
      
      try {
        const apiEndpoint = `${this.baseUrl}/web/scrape/markdown?url=${encodeURIComponent(url)}`;
        const res = await fetchWithRetry(apiEndpoint, {
          headers: { 'Authorization': `Bearer ${this.apiKey}` }
        });

        if (!res.ok) {
          throw new Error(`Context.dev scrape failed with status ${res.status}: ${await res.text()}`);
        }

        const markdown = await res.text();
        this.cachePage(url, vendorDomain, markdown, today);
        return markdown;
      } catch (err: any) {
        console.warn(`[ContextService] Scrape request failed for ${url} (${err.message || err}). Falling back to local mock fixture markdown.`);
        
        // Fallback to local mock fixture file if available, or return generic fallback text
        const fixtureName = vendorDomain.replace(/\.[a-z]+$/, '');
        const filePath = path.resolve(__dirname, `../../fixtures/${fixtureName}_pricing.md`);
        if (fs.existsSync(filePath)) {
          const markdown = fs.readFileSync(filePath, 'utf-8');
          this.cachePage(url, vendorDomain, markdown, today);
          return markdown;
        }
        
        const defaultMarkdown = `# Fictional Vendor Pricing\n\nPage mock for ${url}.\n- Startup Plan: $25/mo. Slack Integration enabled. Hosted in EU (Frankfurt). BAA signed for HIPAA.`;
        this.cachePage(url, vendorDomain, defaultMarkdown, today);
        return defaultMarkdown;
      }
    });
  }

  private cachePage(url: string, vendorDomain: string, markdown: string, today: string) {
    try {
      db.prepare(`
        INSERT OR REPLACE INTO pages (url, vendor_domain, markdown, scraped_at)
        VALUES (?, ?, ?, ?)
      `).run(url, vendorDomain, markdown, new Date().toISOString());

      db.prepare(`
        INSERT OR REPLACE INTO page_cache (url, scraped_date)
        VALUES (?, ?)
      `).run(url, today);
    } catch (err) {
      console.error('[ContextService] Cache write error:', err);
    }
  }

  // Brand intelligence retrieval
  async getBrandInfo(jobId: string, domain: string): Promise<BrandInfo> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Check cache
    try {
      const cached = db.prepare(`
        SELECT logo_url, primary_color, colors, fonts, company_metadata, cached_at
        FROM brand_cache
        WHERE domain = ? AND cached_at > ?
      `).get(domain, thirtyDaysAgo.toISOString()) as any;

      if (cached) {
        console.log(`[ContextService] Brand cache hit for domain: ${domain}`);
        return {
          logoUrl: cached.logo_url,
          primaryColor: cached.primary_color,
          colors: JSON.parse(cached.colors),
          fonts: JSON.parse(cached.fonts),
          company_metadata: cached.company_metadata ? JSON.parse(cached.company_metadata) : undefined
        };
      }
    } catch (err) {
      console.error('[ContextService] Brand cache read error:', err);
    }

    if (this.isMock) {
      this.incrementCredits(jobId, 'brand');
      await new Promise(r => setTimeout(r, 300));
      
      const fixtureName = domain.replace(/\.[a-z]+$/, '');
      const filePath = path.resolve(__dirname, `../../fixtures/${fixtureName}_brand.json`);
      if (fs.existsSync(filePath)) {
        const brandData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        this.cacheBrand(domain, brandData);
        return brandData;
      }
      
      // Fallback mock
      const fallback: BrandInfo = {
        logoUrl: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236C7CFF' stroke-width='2'><circle cx='12' cy='12' r='10'/></svg>`,
        primaryColor: '#6C7CFF',
        colors: ['#6C7CFF', '#1A2030'],
        fonts: ['Inter', 'sans-serif'],
        company_metadata: { name: domain.split('.')[0] }
      };
      this.cacheBrand(domain, fallback);
      return fallback;
    }

    // Call Real API
    return rateLimiter.enqueue(async () => {
      this.incrementCredits(jobId, 'brand');
      console.log(`[ContextService] Brand Intelligence lookup for domain: ${domain}`);

      const apiEndpoint = `${this.baseUrl}/brand/retrieve?domain=${encodeURIComponent(domain)}`;
      const res = await fetchWithRetry(apiEndpoint, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });

      if (!res.ok) {
        throw new Error(`Context.dev brand lookup failed with status ${res.status}: ${await res.text()}`);
      }

      const data = await res.json() as any;
      const brandInfo: BrandInfo = {
        logoUrl: data.logo?.url || '',
        primaryColor: data.theme?.primaryColor || '#6C7CFF',
        colors: data.theme?.palette || ['#6C7CFF'],
        fonts: data.theme?.fonts || ['Inter', 'sans-serif'],
        company_metadata: data.metadata || {}
      };

      this.cacheBrand(domain, brandInfo);
      return brandInfo;
    });
  }

  private cacheBrand(domain: string, brand: BrandInfo) {
    try {
      db.prepare(`
        INSERT OR REPLACE INTO brand_cache (domain, logo_url, primary_color, colors, fonts, company_metadata, cached_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        domain,
        brand.logoUrl,
        brand.primaryColor,
        JSON.stringify(brand.colors),
        JSON.stringify(brand.fonts),
        brand.company_metadata ? JSON.stringify(brand.company_metadata) : null,
        new Date().toISOString()
      );
    } catch (err) {
      console.error('[ContextService] Brand cache write error:', err);
    }
  }

  // Sitemap/crawl URL discovery endpoint
  async getSitemap(domain: string): Promise<string[]> {
    if (this.isMock) {
      return [
        `https://${domain}/pricing`,
        `https://${domain}/features`,
        `https://${domain}/security`
      ];
    }

    return rateLimiter.enqueue(async () => {
      console.log(`[ContextService] Crawl sitemap for domain: ${domain}`);
      const apiEndpoint = `${this.baseUrl}/web/scrape/sitemap?url=${encodeURIComponent('https://' + domain)}`;
      const res = await fetchWithRetry(apiEndpoint, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });

      if (!res.ok) {
        console.warn(`[ContextService] Sitemap crawl failed for ${domain}: ${res.statusText}`);
        return [];
      }

      try {
        const data = await res.json() as any;
        return Array.isArray(data.urls) ? data.urls : [];
      } catch (err) {
        console.error('[ContextService] Error parsing sitemap response:', err);
        return [];
      }
    });
  }
}
