import crypto from 'crypto';
import db from '../db/db.js';
import { eventBus } from '../events/bus.js';
import { getLLMProvider } from '../llm/provider.js';
import { ContextService } from '../services/context.js';
import { runPlanStage } from './plan.js';
import { runDiscoverStage } from './discover.js';
import { runMapStage } from './map.js';
import { runCollectStage } from './collect.js';
import { runExtractStage, VendorDossier } from './extract.js';
import { runBrandStage } from './brand.js';
import { calculateScores } from './score.js';
import { runSynthesizeStage } from './synthesize.js';
import { Report, Vendor, CreditUsage, Job } from '../types.js';

export async function runPipeline(
  jobId: string,
  query: string,
  userDomains?: string[],
  maxVendors: number = 6
): Promise<void> {
  const llm = getLLMProvider();
  const contextService = new ContextService();

  try {
    // 1. STAGE: PLAN
    eventBus.emitEvent(jobId, 'plan', 'info', 'Parsing requirements and formulating evaluation criteria...');
    const requirement = await runPlanStage(query, llm);
    eventBus.emitEvent(jobId, 'plan', 'info', `Planned successfully. Identified ${requirement.mustHaves.length} Must-Haves and ${requirement.niceToHaves.length} Nice-to-Haves.`, { requirement });

    // 2. STAGE: DISCOVER
    eventBus.emitEvent(jobId, 'discover', 'info', 'Scouting public web for candidate software vendors...');
    const domains = await runDiscoverStage(requirement, userDomains, maxVendors, llm);
    eventBus.emitEvent(jobId, 'discover', 'info', `Discovered candidate vendors: ${domains.join(', ')}`, { domains });

    const vendors: Vendor[] = [];

    // Loop through discovered vendors
    for (let index = 0; index < domains.length; index++) {
      const domain = domains[index];
      const vendorPrefix = `[${index + 1}/${domains.length}] ${domain}:`;

      // 3. STAGE: MAP
      eventBus.emitEvent(jobId, 'map', 'info', `${vendorPrefix} Mapping high-signal site pages...`);
      const getSitemapFn = (dom: string) => contextService.getSitemap(dom);
      const mappedUrls = await runMapStage(domain, getSitemapFn);
      eventBus.emitEvent(jobId, 'map', 'info', `${vendorPrefix} Mapped ${mappedUrls.length} pages.`, { domain, urls: mappedUrls });

      // 4. STAGE: COLLECT
      eventBus.emitEvent(jobId, 'collect', 'info', `${vendorPrefix} Initializing scrape queue...`);
      const scrapedPages = await runCollectStage(
        jobId,
        domain,
        mappedUrls,
        (jId, url, dom) => contextService.scrapeUrl(jId, url, dom),
        (url, current, total) => {
          eventBus.emitEvent(jobId, 'collect', 'info', `${vendorPrefix} Scraping page ${current} of ${total}: ${url.replace('https://', '')}`);
        }
      );
      const successPages = scrapedPages.filter(p => p.success).length;
      eventBus.emitEvent(jobId, 'collect', 'info', `${vendorPrefix} Scraping completed. Scraped ${successPages}/${scrapedPages.length} pages.`, { domain });

      // 5. STAGE: EXTRACT
      eventBus.emitEvent(jobId, 'extract', 'info', `${vendorPrefix} Parsing unstructured text and extracting structured feature claims...`);
      const dossier = await runExtractStage(domain, scrapedPages, requirement, llm);
      eventBus.emitEvent(jobId, 'extract', 'info', `${vendorPrefix} Feature claims and pricing models extracted with source citations.`, { domain });

      // 6. STAGE: BRAND
      eventBus.emitEvent(jobId, 'brand', 'info', `${vendorPrefix} Fetching visual assets and style specifications...`);
      const brandInfo = await runBrandStage(jobId, domain, contextService);
      eventBus.emitEvent(jobId, 'brand', 'info', `${vendorPrefix} Enriching design profiles completed.`, { domain, brand: brandInfo });

      // 7. STAGE: SCORE (deterministic)
      eventBus.emitEvent(jobId, 'score', 'info', `${vendorPrefix} Evaluating weights and calculating criteria scores...`);
      const scores = calculateScores(dossier, requirement, successPages);
      
      const vendor: Vendor = {
        id: dossier.id,
        name: dossier.name,
        domain: dossier.domain,
        brand: brandInfo,
        summary: dossier.summary,
        pricing: dossier.pricing,
        features: dossier.features,
        compliance: dossier.compliance,
        integrations: dossier.integrations,
        support: dossier.support,
        scores,
        citations: dossier.citations
      };
      
      vendors.push(vendor);
      eventBus.emitEvent(jobId, 'score', 'info', `${vendorPrefix} Evaluation completed. Fit: ${scores.fit}%, Price: ${scores.pricing}%, Compliance: ${scores.compliance}%. Overall Score: ${scores.overall}%`, { domain, scores });
    }

    // 8. STAGE: SYNTHESIZE
    eventBus.emitEvent(jobId, 'synthesize', 'info', 'Synthesizing decision brief and preparing buyer recommendation...');
    const recommendation = await runSynthesizeStage(vendors, query, llm);
    eventBus.emitEvent(jobId, 'synthesize', 'info', 'Recommendation generated successfully.', { recommendation });

    // Fetch final job details for credit usage
    const jobRow = db.prepare('SELECT credit_scrapes, credit_brands, credit_total FROM jobs WHERE job_id = ?').get(jobId) as any;
    const creditUsage: CreditUsage = {
      scrapes: jobRow?.credit_scrapes || 0,
      brandCalls: jobRow?.credit_brands || 0,
      totalCredits: jobRow?.credit_total || 0
    };

    // Save final report
    const reportId = `rpt_${crypto.randomUUID().replace(/-/g, '')}`;
    const report: Report = {
      id: reportId,
      query,
      createdAt: new Date().toISOString(),
      requirement,
      vendors,
      recommendation,
      creditUsage
    };

    db.prepare(`
      INSERT INTO reports (id, query, requirement, vendors, recommendation, credit_usage, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      report.id,
      report.query,
      JSON.stringify(report.requirement),
      JSON.stringify(report.vendors),
      JSON.stringify(report.recommendation),
      JSON.stringify(report.creditUsage),
      report.createdAt
    );

    // 9. STAGE: DONE
    eventBus.emitEvent(jobId, 'done', 'info', 'Research completed successfully! Documenting Decision Brief.', { reportId });

  } catch (err: any) {
    console.error(`[PipelineRunner] Job ${jobId} failed:`, err);
    eventBus.emitEvent(jobId, 'error', 'error', err.message || String(err));
  }
}
