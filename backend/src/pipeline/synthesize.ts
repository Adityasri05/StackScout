import { z } from 'zod';
import { LLMProvider } from '../llm/provider.js';
import { Vendor, Recommendation } from '../types.js';

export const RecommendationSchema = z.object({
  topPickVendorId: z.string(),
  rationale: z.string(),
  tradeoffs: z.array(z.string()),
  runnerUpVendorId: z.string()
});

export async function runSynthesizeStage(
  vendors: Vendor[],
  query: string,
  llm: LLMProvider
): Promise<Recommendation> {
  const systemPrompt = `You are a tech advisory board member.
Your task is to write a final decision recommendation summary based on the analyzed vendors and their scores.
You MUST output a valid JSON object matching the requested schema.
The rationale MUST be concise, professional, and limited to 120 words.
It MUST align with the calculated scores (do not pick a lower-scoring vendor as the top pick unless there is an overwhelming reason, and if so, justify it in the rationale).

Schema to output:
{
  "topPickVendorId": "id_of_the_top_vendor_from_the_provided_list",
  "rationale": "Clear explanation of why this vendor is the best choice (maximum 120 words)",
  "tradeoffs": ["bullet point 1 describing tradeoffs or drawbacks of the choice", "bullet point 2"],
  "runnerUpVendorId": "id_of_the_runner_up_vendor"
}
Only output the JSON object. Do not include markdown code block styling.`;

  const vendorsData = vendors.map(v => ({
    id: v.id,
    name: v.name,
    domain: v.domain,
    summary: v.summary,
    scores: v.scores,
    pricingModel: v.pricing.model,
    tiers: v.pricing.tiers.map(t => `${t.name}: $${t.pricePerMonthUSD}/mo`)
  }));

  const userPrompt = `Query: "${query}"\nAnalyzed Vendors:\n${JSON.stringify(vendorsData, null, 2)}`;
  
  const jsonSchema = {
    type: 'object',
    properties: {
      topPickVendorId: { type: 'string' },
      rationale: { type: 'string' },
      tradeoffs: { type: 'array', items: { type: 'string' } },
      runnerUpVendorId: { type: 'string' }
    },
    required: ['topPickVendorId', 'rationale', 'tradeoffs', 'runnerUpVendorId']
  };

  const text = await llm.complete(systemPrompt, userPrompt, jsonSchema);
  const parsed = JSON.parse(text.trim().replace(/^```json/, '').replace(/```$/, ''));
  return RecommendationSchema.parse(parsed);
}
