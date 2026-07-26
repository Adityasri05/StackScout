import { z } from 'zod';
import { LLMProvider } from '../llm/provider.js';
import { ScrapedPage } from './collect.js';
import { RequirementSpec } from '../types.js';
import { cleanJson } from '../utils/json.js';

const PricingTierSchema = z.object({
  name: z.string(),
  pricePerMonthUSD: z.number(),
  priceNote: z.string(),
  keyFeatures: z.array(z.string()),
  citation: z.string()
});

const PricingConfigSchema = z.object({
  model: z.enum(['per-seat', 'flat', 'usage', 'custom', 'unknown']),
  freeTier: z.boolean(),
  tiers: z.array(PricingTierSchema)
});

const FeatureClaimSchema = z.object({
  name: z.string(),
  supported: z.enum(['yes', 'no', 'partial', 'unknown']),
  note: z.string(),
  citation: z.string().nullable()
});

const ComplianceConfigSchema = z.object({
  soc2: z.enum(['yes', 'no', 'unknown']),
  gdpr: z.enum(['yes', 'no', 'unknown']),
  hipaa: z.enum(['yes', 'no', 'unknown']),
  dataResidency: z.array(z.string()),
  citations: z.array(z.string())
});

const SupportConfigSchema = z.object({
  channels: z.array(z.string()),
  sla: z.string().nullable(),
  citation: z.string().nullable()
});

const CitationSchema = z.object({
  url: z.string(),
  title: z.string(),
  scrapedAt: z.string()
});

export const VendorDossierSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  summary: z.string(),
  pricing: PricingConfigSchema,
  features: z.array(FeatureClaimSchema),
  compliance: ComplianceConfigSchema,
  integrations: z.array(z.string()),
  support: SupportConfigSchema,
  citations: z.array(CitationSchema)
});

export type VendorDossier = z.infer<typeof VendorDossierSchema>;

export async function runExtractStage(
  domain: string,
  pages: ScrapedPage[],
  requirement: RequirementSpec,
  llm: LLMProvider,
  retries = 1
): Promise<VendorDossier> {
  // Format pages: Label them with source url and truncate to ~8000 chars each
  const formattedContent = pages
    .filter(p => p.success && p.markdown)
    .map(p => `--- SOURCE URL: ${p.url} ---\n${p.markdown.slice(0, 8000)}`)
    .join('\n\n');

  const systemPrompt = `You are a research analyst.
Your task is to extract structured details about the vendor "${domain}" based on the provided website source contents.
You MUST output a valid JSON object matching the requested schema.
Every claim (pricing tier, feature flag, compliance status, support channels) MUST attach the exact source URL citation from the pages.
If a claim is not found or cannot be verified from the text, mark it as "unknown" or null - do NOT guess.
Ensure the "features" array contains claims evaluating the requirements listed:
Must haves: ${requirement.mustHaves.join(', ')}
Nice to haves: ${requirement.niceToHaves.join(', ')}

Schema to output:
{
  "id": "ven_unique_lowercase_id",
  "name": "Vendor Name",
  "domain": "${domain}",
  "summary": "2-sentence description of what this vendor does",
  "pricing": {
    "model": "per-seat|flat|usage|custom|unknown",
    "freeTier": true|false,
    "tiers": [
      {
        "name": "Tier Name",
        "pricePerMonthUSD": 29,
        "priceNote": "e.g. $29 billed annually",
        "keyFeatures": ["feature 1", "feature 2"],
        "citation": "source_url"
      }
    ]
  },
  "features": [
    {
      "name": "Requirement feature name (must exactly match one of the must-haves or nice-to-haves)",
      "supported": "yes|no|partial|unknown",
      "note": "brief explanation",
      "citation": "source_url_or_null"
    }
  ],
  "compliance": {
    "soc2": "yes|no|unknown",
    "gdpr": "yes|no|unknown",
    "hipaa": "yes|no|unknown",
    "dataResidency": ["EU (Frankfurt)", "US"],
    "citations": ["source_url"]
  },
  "integrations": ["list of integrations supported"],
  "support": {
    "channels": ["Email", "Slack"],
    "sla": "description_or_null",
    "citation": "source_url_or_null"
  },
  "citations": [
    { "url": "source_url", "title": "Page Title or Description", "scrapedAt": "ISO date" }
  ]
}
Only output the JSON object. Do not include markdown code block styling.`;

  const userPrompt = `Source Web Pages:\n${formattedContent}`;

  const jsonSchema = {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      domain: { type: 'string' },
      summary: { type: 'string' },
      pricing: {
        type: 'object',
        properties: {
          model: { type: 'string', enum: ['per-seat', 'flat', 'usage', 'custom', 'unknown'] },
          freeTier: { type: 'boolean' },
          tiers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                pricePerMonthUSD: { type: 'number' },
                priceNote: { type: 'string' },
                keyFeatures: { type: 'array', items: { type: 'string' } },
                citation: { type: 'string' }
              },
              required: ['name', 'pricePerMonthUSD', 'priceNote', 'keyFeatures', 'citation']
            }
          }
        },
        required: ['model', 'freeTier', 'tiers']
      },
      features: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            supported: { type: 'string', enum: ['yes', 'no', 'partial', 'unknown'] },
            note: { type: 'string' },
            citation: { type: 'string', nullable: true }
          },
          required: ['name', 'supported', 'note', 'citation']
        }
      },
      compliance: {
        type: 'object',
        properties: {
          soc2: { type: 'string', enum: ['yes', 'no', 'unknown'] },
          gdpr: { type: 'string', enum: ['yes', 'no', 'unknown'] },
          hipaa: { type: 'string', enum: ['yes', 'no', 'unknown'] },
          dataResidency: { type: 'array', items: { type: 'string' } },
          citations: { type: 'array', items: { type: 'string' } }
        },
        required: ['soc2', 'gdpr', 'hipaa', 'dataResidency', 'citations']
      },
      integrations: { type: 'array', items: { type: 'string' } },
      support: {
        type: 'object',
        properties: {
          channels: { type: 'array', items: { type: 'string' } },
          sla: { type: 'string', nullable: true },
          citation: { type: 'string', nullable: true }
        },
        required: ['channels', 'sla', 'citation']
      },
      citations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            title: { type: 'string' },
            scrapedAt: { type: 'string' }
          },
          required: ['url', 'title', 'scrapedAt']
        }
      }
    },
    required: ['id', 'name', 'domain', 'summary', 'pricing', 'features', 'compliance', 'integrations', 'support', 'citations']
  };

  let parsed: any;
  try {
    const text = await llm.complete(systemPrompt, userPrompt, jsonSchema);
    parsed = JSON.parse(cleanJson(text));
    return VendorDossierSchema.parse(parsed);
  } catch (err: any) {
    console.log('[DEBUG] parsed response object:', parsed);
    if (retries > 0) {
      console.warn(`[ExtractStage] Validation failed, retrying once. Error: ${err.message || err}`);
      // Retry with explicit instruction
      const retrySystemPrompt = `${systemPrompt}\n\nWARNING: The previous output failed schema validation: ${err.message}. Please fix it and output correct JSON.`;
      const text = await llm.complete(retrySystemPrompt, userPrompt, jsonSchema);
      const retryParsed = JSON.parse(cleanJson(text));
      console.log('[DEBUG] retryParsed response object:', retryParsed);
      return VendorDossierSchema.parse(retryParsed);
    }
    throw err;
  }
}
