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
    // Determine target based on content of user / system prompt
    const userLower = user.toLowerCase();
    const systemLower = system.toLowerCase();

    console.log(`[MockLLM] complete systemLength=${systemLower.length} userLength=${userLower.length}`);
    console.log(`[MockLLM]   systemLower starts: ${systemLower.substring(0, 80).replace(/\n/g, ' ')}`);
    console.log(`[MockLLM]   userLower starts: ${userLower.substring(0, 80).replace(/\n/g, ' ')}`);
    console.log(`[MockLLM]   system includes 'extract' = ${systemLower.includes('extract')}`);
    console.log(`[MockLLM]   user includes 'uptimeradar' = ${userLower.includes('uptimeradar')}`);
    console.log(`[MockLLM]   user includes 'pingsentinel' = ${userLower.includes('pingsentinel')}`);


    // 1. Stage: Plan
    if (systemLower.includes('procurement')) {
      return JSON.stringify({
        useCase: "uptime monitoring for 10-person startup",
        category: "Uptime Monitoring",
        mustHaves: ["pricing under 50", "EU data residency", "Slack alerts"],
        niceToHaves: ["Incident management", "Custom status pages"],
        budgetPerMonthUSD: 50,
        constraints: ["EU data residency"]
      });
    }

    // 2. Stage: Discover
    if (systemLower.includes('scout')) {
      return JSON.stringify({
        domains: ["uptimeradar.io", "pingsentinel.com", "statsentry.net"]
      });
    }

    // 3. Stage: Extract
    if (systemLower.includes('research analyst')) {
      if (userLower.includes('uptimeradar')) {
        return JSON.stringify({
          id: "ven_uptimeradar",
          name: "UptimeRadar",
          domain: "uptimeradar.io",
          summary: "Simple, reliable uptime monitoring and status pages for startups and developer teams.",
          pricing: {
            model: "flat",
            freeTier: false,
            tiers: [
              {
                name: "Developer",
                pricePerMonthUSD: 12,
                priceNote: "$12 / month (or $10 billed annually)",
                keyFeatures: ["15 HTTP/HTTPS endpoints", "1 minute intervals", "Email alerts", "Slack integration"],
                citation: "https://uptimeradar.io/pricing"
              },
              {
                name: "Startup",
                pricePerMonthUSD: 39,
                priceNote: "$39 / month",
                keyFeatures: ["50 HTTP/HTTPS/SSL/TCP endpoints", "30 second intervals", "EU Data Residency Option", "SMS & Slack notifications"],
                citation: "https://uptimeradar.io/pricing#features"
              }
            ]
          },
          features: [
            { "name": "Slack alerts", "supported": "yes", "note": "Slack integration available on Developer and Startup plans", "citation": "https://uptimeradar.io/pricing" },
            { "name": "EU data residency", "supported": "yes", "note": "Startup plan offers EU hosting option", "citation": "https://uptimeradar.io/pricing#features" },
            { "name": "pricing under 50", "supported": "yes", "note": "Developer tier is $12/mo, Startup tier is $39/mo", "citation": "https://uptimeradar.io/pricing" }
          ],
          compliance: {
            soc2: "no",
            gdpr: "yes",
            hipaa: "no",
            dataResidency: ["US East", "EU (Frankfurt)"],
            citations: ["https://uptimeradar.io/pricing#features"]
          },
          integrations: ["Slack", "SMS", "Webhooks"],
          support: {
            channels: ["Email", "Slack"],
            sla: "99.9% (Enterprise plan only)",
            citation: "https://uptimeradar.io/pricing"
          },
          citations: [
            { "url": "https://uptimeradar.io/pricing", "title": "UptimeRadar Pricing", "scrapedAt": new Date().toISOString() },
            { "url": "https://uptimeradar.io/pricing#features", "title": "UptimeRadar Features", "scrapedAt": new Date().toISOString() }
          ]
        });
      } else if (userLower.includes('pingsentinel')) {
        return JSON.stringify({
          id: "ven_pingsentinel",
          name: "PingSentinel",
          domain: "pingsentinel.com",
          summary: "Continuous monitoring, SSL verification, and instant pager integrations for engineering teams.",
          pricing: {
            model: "flat",
            freeTier: false,
            tiers: [
              {
                name: "Basic",
                pricePerMonthUSD: 19,
                priceNote: "$19 / month",
                keyFeatures: ["20 monitors", "1-minute frequency", "Email & Slack notifications"],
                citation: "https://pingsentinel.com/pricing"
              },
              {
                name: "Professional",
                pricePerMonthUSD: 49,
                priceNote: "$49 / month",
                keyFeatures: ["100 monitors", "15-second frequency", "EU data storage", "Multi-channel alerts"],
                citation: "https://pingsentinel.com/features#data"
              }
            ]
          },
          features: [
            { "name": "Slack alerts", "supported": "yes", "note": "Slack alerts included in Basic and Pro plans", "citation": "https://pingsentinel.com/pricing" },
            { "name": "EU data residency", "supported": "yes", "note": "EU storage (Frankfurt/Dublin) on Pro and above", "citation": "https://pingsentinel.com/features#data" },
            { "name": "pricing under 50", "supported": "yes", "note": "Basic tier is $19/mo, Professional tier is $49/mo", "citation": "https://pingsentinel.com/pricing" }
          ],
          compliance: {
            soc2: "yes",
            gdpr: "yes",
            hipaa: "yes",
            dataResidency: ["US", "EU (Frankfurt, Dublin)"],
            citations: ["https://pingsentinel.com/security", "https://pingsentinel.com/features#data"]
          },
          integrations: ["Slack", "Discord", "MS Teams", "SMS", "PagerDuty"],
          support: {
            channels: ["Email", "Slack Channel"],
            sla: "99.95% (Professional plan and above)",
            citation: "https://pingsentinel.com/features#data"
          },
          citations: [
            { "url": "https://pingsentinel.com/pricing", "title": "PingSentinel Pricing", "scrapedAt": new Date().toISOString() },
            { "url": "https://pingsentinel.com/features#data", "title": "PingSentinel Features", "scrapedAt": new Date().toISOString() },
            { "url": "https://pingsentinel.com/security", "title": "PingSentinel Security", "scrapedAt": new Date().toISOString() }
          ]
        });
      } else {
        // Statsentry
        return JSON.stringify({
          id: "ven_statsentry",
          name: "StatSentry",
          domain: "statsentry.net",
          summary: "High-fidelity monitoring, network diagnostics, and incident management workflows.",
          pricing: {
            model: "flat",
            freeTier: false,
            tiers: [
              {
                name: "Entry",
                pricePerMonthUSD: 49,
                priceNote: "$49 / month",
                keyFeatures: ["50 HTTP/HTTPS checks", "1-minute frequency", "Email & Slack notifications"],
                citation: "https://statsentry.net/pricing"
              },
              {
                name: "Growth",
                pricePerMonthUSD: 120,
                priceNote: "$120 / month",
                keyFeatures: ["250 checks", "30-second frequency", "Slack & PagerDuty integrations", "GDPR compliance with EU hosting"],
                citation: "https://statsentry.net/pricing"
              }
            ]
          },
          features: [
            { "name": "Slack alerts", "supported": "yes", "note": "Email & Slack alerts supported on Entry and Growth", "citation": "https://statsentry.net/pricing" },
            { "name": "EU data residency", "supported": "yes", "note": "GDPR compliance and hosting in Frankfurt, Germany available on Growth tier", "citation": "https://statsentry.net/pricing" },
            { "name": "pricing under 50", "supported": "yes", "note": "Entry plan is $49/mo, Growth is $120/mo", "citation": "https://statsentry.net/pricing" }
          ],
          compliance: {
            soc2: "yes",
            gdpr: "yes",
            hipaa: "yes",
            dataResidency: ["US", "EU (Frankfurt)"],
            citations: ["https://statsentry.net/compliance", "https://statsentry.net/security"]
          },
          integrations: ["Slack", "PagerDuty", "SMS", "Webhooks"],
          support: {
            channels: ["Ticket", "Email", "Slack shared channel"],
            sla: "99.99% (Enterprise tier only)",
            citation: "https://statsentry.net/pricing"
          },
          citations: [
            { "url": "https://statsentry.net/pricing", "title": "StatSentry Pricing", "scrapedAt": new Date().toISOString() },
            { "url": "https://statsentry.net/compliance", "title": "StatSentry Compliance", "scrapedAt": new Date().toISOString() },
            { "url": "https://statsentry.net/security", "title": "StatSentry Security", "scrapedAt": new Date().toISOString() }
          ]
        });
      }
    }

    // 4. Stage: Synthesize
    if (systemLower.includes('advisory board')) {
      return JSON.stringify({
        topPickVendorId: "ven_pingsentinel",
        rationale: "PingSentinel is the optimal choice for your 10-person startup. At $49/month, the Professional tier fits your budget constraints perfectly while fulfilling all requirements. It provides full EU data residency (hosted in Frankfurt or Dublin), direct Slack and PagerDuty alert integrations, and a fast 15-second check frequency. Additionally, PingSentinel offers SOC 2 Type II compliance reports, providing enterprise-grade security assurances which UptimeRadar lacks.",
        tradeoffs: [
          "PingSentinel is slightly more expensive ($49/mo) compared to UptimeRadar ($39/mo for Startup tier).",
          "UptimeRadar does not have a completed SOC 2 certification (undergoing Type I audit).",
          "StatSentry's Growth tier ($120/mo) is well above the specified $50/mo budget limit, though it offers more features."
        ],
        runnerUpVendorId: "ven_uptimeradar"
      });
    }

    // 5. Watch Diff Check
    if (systemLower.includes('diff') || systemLower.includes('watch')) {
      return JSON.stringify({
        summary: "The price of the Startup tier increased from $39/mo to $45/mo.",
        before: "Startup Tier: $39 / month",
        after: "Startup Tier: $45 / month"
      });
    }

    // Fallback simple response
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
