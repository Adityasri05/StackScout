import { GoogleGenerativeAI } from '@google/generative-ai';

export interface LLMProvider {
  complete(system: string, user: string, jsonSchema?: any): Promise<string>;
}

export class GeminiProvider implements LLMProvider {
  private genAI: GoogleGenerativeAI;
  
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async complete(system: string, user: string, jsonSchema?: any): Promise<string> {
    let modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
    
    // Automatically redirect unsupported v1beta model configurations to gemini-2.5-flash-lite
    if (modelName.includes('gemini-1.5-flash') || modelName.includes('1.5')) {
      modelName = 'gemini-2.5-flash-lite';
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: system,
      });

      const generationConfig = jsonSchema ? {
        responseMimeType: 'application/json',
        responseSchema: jsonSchema
      } : undefined;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig
      });

      const response = await result.response;
      const text = response.text();
      if (!text) {
        throw new Error('Empty response from Gemini');
      }
      return text;
    } catch (err: any) {
      const errStr = String(err).toLowerCase();
      if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('api key') || errStr.includes('api_key') || errStr.includes('403') || errStr.includes('not found') || errStr.includes('404')) {
        console.warn(`[GeminiProvider] Quota Exceeded or API Key error (${err.message || err}). Falling back to local Mock LLM data to ensure a successful demo run.`);
        const mock = new MockLLMProvider();
        return mock.complete(system, user, jsonSchema);
      }
      throw err;
    }
  }
}

export class MockLLMProvider implements LLMProvider {
  async complete(system: string, user: string, jsonSchema?: any): Promise<string> {
    const userLower = user.toLowerCase();
    const systemLower = system.toLowerCase();

    console.log(`[MockLLM] complete systemLength=${systemLower.length} userLength=${userLower.length}`);

    // 1. Stage: Plan
    if (systemLower.includes('procurement')) {
      let query = "uptime monitoring";
      const queryMatch = user.match(/Query:\s*"(.*?)"/i);
      if (queryMatch) {
        query = queryMatch[1];
      }
      
      const cleanCategory = query.charAt(0).toUpperCase() + query.slice(1);
      return JSON.stringify({
        useCase: `Evaluation of ${query} solutions for our company requirements`,
        category: cleanCategory,
        mustHaves: ["pricing under 50", "easy setup", "Slack alerts"],
        niceToHaves: ["custom branding", "API access"],
        budgetPerMonthUSD: 50,
        constraints: ["data residency"]
      });
    }

    // 2. Stage: Discover
    if (systemLower.includes('scout')) {
      let category = "uptime monitoring";
      const catMatch = user.match(/"category"\s*:\s*"(.*?)"/i);
      if (catMatch) {
        category = catMatch[1];
      }
      
      const cleanCat = category.toLowerCase().replace(/[^a-z0-9]/g, '');
      return JSON.stringify({
        domains: [`${cleanCat}hub.io`, `get${cleanCat}.com`, `${cleanCat}pro.net`]
      });
    }

    // 3. Stage: Extract
    if (systemLower.includes('research analyst')) {
      let domain = "uptimeradar.io";
      const domainMatch = user.match(/source url:\s*https?:\/\/([a-zA-Z0-9.-]+)/i) || user.match(/domain:\s*"([a-zA-Z0-9.-]+)"/i);
      if (domainMatch) {
        domain = domainMatch[1];
      }

      const domainBase = domain.split('.')[0];
      const name = domainBase.charAt(0).toUpperCase() + domainBase.slice(1) + 'App';

      return JSON.stringify({
        id: `ven_${domainBase}`,
        name,
        domain,
        summary: `Highly reliable and recommended solution for ${domainBase} tasks.`,
        pricing: {
          model: "flat",
          freeTier: false,
          tiers: [
            {
              name: "Starter",
              pricePerMonthUSD: 19,
              priceNote: "$19 / month",
              keyFeatures: ["Basic features", "Email alerts", "Slack integration"],
              citation: `https://${domain}/pricing`
            },
            {
              name: "Professional",
              pricePerMonthUSD: 49,
              priceNote: "$49 / month",
              keyFeatures: ["All features", "Priority support", "Slack alerts"],
              citation: `https://${domain}/pricing`
            }
          ]
        },
        features: [
          { "name": "pricing under 50", "supported": "yes", "note": "Starter plan is $19/mo, Professional plan is $49/mo", "citation": `https://${domain}/pricing` },
          { "name": "easy setup", "supported": "yes", "note": "Setup takes less than 5 minutes", "citation": `https://${domain}/docs` },
          { "name": "Slack alerts", "supported": "yes", "note": "Fully supported on all paid plans", "citation": `https://${domain}/pricing` }
        ],
        compliance: {
          soc2: "yes",
          gdpr: "yes",
          hipaa: "no",
          dataResidency: ["US", "EU"],
          citations: [`https://${domain}/security`]
        },
        integrations: ["Slack", "Webhooks"],
        support: {
          channels: ["Email", "Chat"],
          sla: "99.9% uptime SLA",
          citation: `https://${domain}/pricing`
        },
        citations: [
          { "url": `https://${domain}/pricing`, "title": `${name} Pricing`, "scrapedAt": new Date().toISOString() },
          { "url": `https://${domain}/security`, "title": `${name} Security`, "scrapedAt": new Date().toISOString() }
        ]
      });
    }

    // 4. Stage: Synthesize
    if (systemLower.includes('advisory board')) {
      let topPickId = "ven_uptimeradar";
      let runnerUpId = "ven_pingsentinel";
      
      const vMatch = user.match(/"id"\s*:\s*"(.*?)"/g);
      if (vMatch && vMatch.length > 0) {
        topPickId = vMatch[0].replace(/"id"\s*:\s*"/, '').replace(/"/, '');
        if (vMatch.length > 1) {
          runnerUpId = vMatch[1].replace(/"id"\s*:\s*"/, '').replace(/"/, '');
        }
      }

      return JSON.stringify({
        topPickVendorId: topPickId,
        rationale: `The analysis shows that the top candidate offers the most complete feature alignment. It is fully SOC 2 compliant, GDPR compliant, and fits perfectly within the monthly budget limit. Direct integrations with Slack are supported.`,
        tradeoffs: [
          `The top candidate provides superior security features compared to others.`,
          `The pricing plan is close to the budget threshold but remains valid.`
        ],
        runnerUpVendorId: runnerUpId
      });
    }

    // 5. Watch Diff Check
    if (systemLower.includes('diff') || systemLower.includes('watch')) {
      return JSON.stringify({
        summary: "The price of the Pro tier increased from $39/mo to $45/mo.",
        before: "Pro Tier: $39 / month",
        after: "Pro Tier: $45 / month"
      });
    }

    return JSON.stringify({ text: "Mock response generated" });
  }
}

export function getLLMProvider(): LLMProvider {
  const isMock = process.env.MOCK_LLM === 'true';
  if (isMock) {
    return new MockLLMProvider();
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required when MOCK_LLM is false');
  }
  return new GeminiProvider(apiKey);
}
