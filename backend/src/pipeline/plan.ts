import { z } from 'zod';
import { LLMProvider } from '../llm/provider.js';
import { RequirementSpec } from '../types.js';

export const RequirementSpecSchema = z.object({
  useCase: z.string(),
  category: z.string(),
  mustHaves: z.array(z.string()),
  niceToHaves: z.array(z.string()),
  budgetPerMonthUSD: z.number().nullable(),
  constraints: z.array(z.string())
});

export async function runPlanStage(query: string, llm: LLMProvider): Promise<RequirementSpec> {
  const systemPrompt = `You are a professional software procurement officer.
Your task is to parse a user's software procurement request and extract it into a structured Requirement Specification JSON matching this schema:
{
  "useCase": "Overall summary of why they need this software",
  "category": "High level software category (e.g. Uptime Monitoring, CRM, Hosting)",
  "mustHaves": ["List of non-negotiable features/criteria"],
  "niceToHaves": ["List of preferred but negotiable features/criteria"],
  "budgetPerMonthUSD": 50 (or null if not specified),
  "constraints": ["Data residency, SOC2, HIPAA, support SLA limits, etc."]
}
Only output the JSON object. Do not include markdown code block styling.`;

  const userPrompt = `Query: "${query}"`;
  
  const responseText = await llm.complete(systemPrompt, userPrompt, {
    type: 'object',
    properties: {
      useCase: { type: 'string' },
      category: { type: 'string' },
      mustHaves: { type: 'array', items: { type: 'string' } },
      niceToHaves: { type: 'array', items: { type: 'string' } },
      budgetPerMonthUSD: { type: 'number', nullable: true },
      constraints: { type: 'array', items: { type: 'string' } }
    },
    required: ['useCase', 'category', 'mustHaves', 'niceToHaves', 'budgetPerMonthUSD', 'constraints']
  });

  const parsed = JSON.parse(responseText.trim().replace(/^```json/, '').replace(/```$/, ''));
  return RequirementSpecSchema.parse(parsed);
}
