import { z } from 'zod';
import { LLMProvider } from '../llm/provider.js';
import { RequirementSpec } from '../types.js';

export const DiscoverSchema = z.object({
  domains: z.array(z.string())
});

export async function runDiscoverStage(
  spec: RequirementSpec,
  userDomains: string[] | undefined,
  maxVendors: number = 6,
  llm: LLMProvider
): Promise<string[]> {
  if (userDomains && userDomains.length > 0) {
    return userDomains.slice(0, maxVendors);
  }

  const systemPrompt = `You are a tech vendor scout.
Propose 3 to 6 prominent software vendor domains that match the provided Requirement Specification.
Output ONLY a JSON object containing an array of domains. Do not include markdown code block styling.
Schema:
{
  "domains": ["vendor1.com", "vendor2.com"]
}
`;

  const userPrompt = `Requirement spec: ${JSON.stringify(spec)}\nLimit: Up to ${maxVendors} vendors.`;
  const responseText = await llm.complete(systemPrompt, userPrompt, {
    type: 'object',
    properties: {
      domains: { type: 'array', items: { type: 'string' } }
    },
    required: ['domains']
  });

  const parsed = JSON.parse(responseText.trim().replace(/^```json/, '').replace(/```$/, ''));
  const validated = DiscoverSchema.parse(parsed);
  return validated.domains.slice(0, maxVendors);
}
