import { Report, Watch, WatchChange, PipelineEvent } from './types.js';

export const MOCK_REPORT: Report = {
  id: "rpt_mock_uptime_1",
  query: "We're a 10-person startup and need an uptime monitoring tool under $50/month with EU data residency and Slack alerts",
  createdAt: new Date().toISOString(),
  requirement: {
    useCase: "uptime monitoring for a 10-person startup",
    category: "Uptime Monitoring",
    mustHaves: ["pricing under 50", "EU data residency", "Slack alerts"],
    niceToHaves: ["Incident management", "Custom status pages"],
    budgetPerMonthUSD: 50,
    constraints: ["EU data residency"]
  },
  vendors: [
    {
      id: "ven_uptimeradar",
      name: "UptimeRadar",
      domain: "uptimeradar.io",
      brand: {
        logoUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2334D399' stroke-width='2'><path d='M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z'/><path d='M12 6a6 6 0 0 1 6 6'/><path d='M12 10a2 2 0 0 1 2 2'/><circle cx='12' cy='12' r='1'/></svg>",
        primaryColor: "#34D399",
        colors: ["#34D399", "#064E3B", "#10B981"],
        fonts: ["Inter", "sans-serif"]
      },
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
        { "name": "pricing under 50", "supported": "yes", "note": "Developer tier is $12/mo, Startup tier is $39/mo", "citation": "https://uptimeradar.io/pricing" },
        { "name": "Incident management", "supported": "no", "note": "Only basic alerting; no post-mortems or timeline management", "citation": null },
        { "name": "Custom status pages", "supported": "yes", "note": "Includes 1 status page on Developer, 3 on Startup", "citation": "https://uptimeradar.io/pricing#features" }
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
      scores: {
        fit: 85,
        pricing: 100,
        compliance: 50,
        docsQuality: 80,
        overall: 79
      },
      citations: [
        { "url": "https://uptimeradar.io/pricing", "title": "UptimeRadar Pricing", "scrapedAt": new Date().toISOString() },
        { "url": "https://uptimeradar.io/pricing#features", "title": "UptimeRadar Features", "scrapedAt": new Date().toISOString() }
      ]
    },
    {
      id: "ven_pingsentinel",
      name: "PingSentinel",
      domain: "pingsentinel.com",
      brand: {
        logoUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236C7CFF' stroke-width='2'><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/><path d='M8 11h8'/></svg>",
        primaryColor: "#6C7CFF",
        colors: ["#6C7CFF", "#312E81", "#4F46E5"],
        fonts: ["Outfit", "sans-serif"]
      },
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
        { "name": "pricing under 50", "supported": "yes", "note": "Basic tier is $19/mo, Professional tier is $49/mo", "citation": "https://pingsentinel.com/pricing" },
        { "name": "Incident management", "supported": "yes", "note": "Integrated timeline, alerts grouping, and runbooks", "citation": "https://pingsentinel.com/features#incident" },
        { "name": "Custom status pages", "supported": "partial", "note": "Basic status pages; custom branding requires Enterprise add-on", "citation": "https://pingsentinel.com/pricing" }
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
      scores: {
        fit: 95,
        pricing: 100,
        compliance: 100,
        docsQuality: 100,
        overall: 98
      },
      citations: [
        { "url": "https://pingsentinel.com/pricing", "title": "PingSentinel Pricing", "scrapedAt": new Date().toISOString() },
        { "url": "https://pingsentinel.com/features#data", "title": "PingSentinel Features", "scrapedAt": new Date().toISOString() },
        { "url": "https://pingsentinel.com/security", "title": "PingSentinel Security & Compliance", "scrapedAt": new Date().toISOString() },
        { "url": "https://pingsentinel.com/features#incident", "title": "PingSentinel Incident Management Docs", "scrapedAt": new Date().toISOString() }
      ]
    },
    {
      id: "ven_statsentry",
      name: "StatSentry",
      domain: "statsentry.net",
      brand: {
        logoUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FBBF24' stroke-width='2'><path d='M18 20V10'/><path d='M12 20V4'/><path d='M6 20v-6'/></svg>",
        primaryColor: "#FBBF24",
        colors: ["#FBBF24", "#78350F", "#D97706"],
        fonts: ["Geist", "monospace"]
      },
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
        { "name": "EU data residency", "supported": "yes", "note": "GDPR compliance and hosting in Frankfurt, Germany available on Growth tier and above", "citation": "https://statsentry.net/pricing" },
        { "name": "pricing under 50", "supported": "yes", "note": "Entry plan is $49/mo", "citation": "https://statsentry.net/pricing" },
        { "name": "Incident management", "supported": "yes", "note": "Incident timeline, on-call schedules, and custom escalations", "citation": "https://statsentry.net/pricing" },
        { "name": "Custom status pages", "supported": "yes", "note": "Full design customization on status pages included", "citation": "https://statsentry.net/pricing" }
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
      scores: {
        fit: 100,
        pricing: 30,
        compliance: 100,
        docsQuality: 90,
        overall: 79
      },
      citations: [
        { "url": "https://statsentry.net/pricing", "title": "StatSentry Pricing", "scrapedAt": new Date().toISOString() },
        { "url": "https://statsentry.net/compliance", "title": "StatSentry Compliance", "scrapedAt": new Date().toISOString() },
        { "url": "https://statsentry.net/security", "title": "StatSentry Security", "scrapedAt": new Date().toISOString() }
      ]
    },
    {
      id: "ven_watchdog",
      name: "WebWatchdog",
      domain: "watchdog.io",
      brand: {
        logoUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23F87171' stroke-width='2'><circle cx='12' cy='12' r='10'/><path d='m8 10 3 3 5-5'/></svg>",
        primaryColor: "#F87171",
        colors: ["#F87171", "#7F1D1D", "#DC2626"],
        fonts: ["Inter", "sans-serif"]
      },
      summary: "No-nonsense status checks and alerts, serving static sites and APIs.",
      pricing: {
        model: "flat",
        freeTier: true,
        tiers: [
          {
            name: "Free",
            pricePerMonthUSD: 0,
            priceNote: "Free forever",
            keyFeatures: ["5 monitors", "5-minute interval", "Email notifications"],
            citation: "https://watchdog.io/pricing"
          },
          {
            name: "Hobbyist",
            pricePerMonthUSD: 19,
            priceNote: "$19 / month",
            keyFeatures: ["25 monitors", "1-minute interval", "Slack integration"],
            citation: "https://watchdog.io/pricing"
          }
        ]
      },
      features: [
        { "name": "Slack alerts", "supported": "yes", "note": "Hobbyist tier supports Slack alerts", "citation": "https://watchdog.io/pricing" },
        { "name": "EU data residency", "supported": "no", "note": "All monitoring infrastructure and storage based in Oregon, US", "citation": "https://watchdog.io/pricing" },
        { "name": "pricing under 50", "supported": "yes", "note": "Free and Hobbyist ($19/mo) plans both under $50/mo limit", "citation": "https://watchdog.io/pricing" },
        { "name": "Incident management", "supported": "no", "note": "No incidents board, escalation policies or alerts grouping", "citation": null },
        { "name": "Custom status pages", "supported": "no", "note": "Status pages not supported", "citation": null }
      ],
      compliance: {
        soc2: "unknown",
        gdpr: "unknown",
        hipaa: "no",
        dataResidency: ["US"],
        citations: ["https://watchdog.io/pricing"]
      },
      integrations: ["Slack"],
      support: {
        channels: ["Email"],
        sla: null,
        citation: null
      },
      scores: {
        fit: 60,
        pricing: 100,
        compliance: 0,
        docsQuality: 60,
        overall: 58
      },
      citations: [
        { "url": "https://watchdog.io/pricing", "title": "WebWatchdog Pricing Page", "scrapedAt": new Date().toISOString() }
      ]
    }
  ],
  recommendation: {
    topPickVendorId: "ven_pingsentinel",
    rationale: "PingSentinel is the optimal choice for your 10-person startup. At $49/month, the Professional tier fits your budget constraints perfectly while fulfilling all requirements. It provides full EU data residency (hosted in Frankfurt or Dublin), direct Slack and PagerDuty alert integrations, and a fast 15-second check frequency. Additionally, PingSentinel offers SOC 2 Type II compliance reports, providing enterprise-grade security assurances which UptimeRadar lacks.",
    tradeoffs: [
      "PingSentinel is slightly more expensive ($49/mo) compared to UptimeRadar ($39/mo for Startup tier).",
      "UptimeRadar does not have a completed SOC 2 certification (undergoing Type I audit).",
      "StatSentry's Growth tier ($120/mo) is well above the specified $50/mo budget limit, though it offers more features."
    ],
    runnerUpVendorId: "ven_uptimeradar"
  },
  creditUsage: {
    scrapes: 12,
    brandCalls: 4,
    totalCredits: 52
  }
};

export const MOCK_WATCHES: Watch[] = [
  {
    id: "wtch_mock_pingsentinel",
    label: "PingSentinel Pricing Page",
    url: "https://pingsentinel.com/pricing",
    vendorName: "PingSentinel",
    vendorLogoUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236C7CFF' stroke-width='2'><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/><path d='M8 11h8'/></svg>",
    lastCheckedAt: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
    changeCount: 1
  },
  {
    id: "wtch_mock_uptimeradar",
    label: "UptimeRadar Pricing",
    url: "https://uptimeradar.io/pricing",
    vendorName: "UptimeRadar",
    vendorLogoUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2334D399' stroke-width='2'><path d='M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z'/><path d='M12 6a6 6 0 0 1 6 6'/><path d='M12 10a2 2 0 0 1 2 2'/><circle cx='12' cy='12' r='1'/></svg>",
    lastCheckedAt: new Date(Date.now() - 1000 * 3600 * 5).toISOString(),
    changeCount: 0
  }
];

export const MOCK_WATCH_CHANGES: Record<string, WatchChange[]> = {
  "wtch_mock_pingsentinel": [
    {
      id: "chg_mock_ping_1",
      detectedAt: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
      summary: "Basic Plan price adjusted from $15/mo to $19/mo.",
      before: "### Basic Plan\n- Price: $15 / month\n- Features: 20 monitors\n- Alerts: Email & Slack",
      after: "### Basic Plan\n- Price: $19 / month\n- Features: 20 monitors\n- Alerts: Email & Slack"
    }
  ],
  "wtch_mock_uptimeradar": []
};

// Canned script for SSE pipeline
export const MOCK_EVENTS: Omit<PipelineEvent, 'ts'>[] = [
  { stage: 'plan', level: 'info', message: 'Analyzing research request query...' },
  { stage: 'plan', level: 'info', message: 'Formulating Requirement Specification JSON...' },
  { stage: 'plan', level: 'info', message: 'Evaluation criteria set: 3 Must-Haves, 2 Nice-to-Haves.', data: { requirement: MOCK_REPORT.requirement } },
  { stage: 'discover', level: 'info', message: 'Scouting public web for uptime monitoring candidates...' },
  { stage: 'discover', level: 'info', message: 'Identified candidate vendor domains: uptimeradar.io, pingsentinel.com, statsentry.net, watchdog.io' },
  // UptimeRadar
  { stage: 'map', level: 'info', message: '[1/4] uptimeradar.io: Mapping target paths (/pricing, /features, /security)...' },
  { stage: 'collect', level: 'info', message: '[1/4] uptimeradar.io: Scraping page 1 of 3: uptimeradar.io/pricing', data: { creditUsage: { totalCredits: 1 } } },
  { stage: 'collect', level: 'info', message: '[1/4] uptimeradar.io: Scraping page 2 of 3: uptimeradar.io/features', data: { creditUsage: { totalCredits: 2 } } },
  { stage: 'collect', level: 'info', message: '[1/4] uptimeradar.io: Scraping page 3 of 3: uptimeradar.io/security', data: { creditUsage: { totalCredits: 3 } } },
  { stage: 'extract', level: 'info', message: '[1/4] uptimeradar.io: Parsing text chunks and extracting claim nodes...' },
  { stage: 'brand', level: 'info', message: '[1/4] uptimeradar.io: Fetching visual elements from Brand Intelligence API...', data: { creditUsage: { totalCredits: 13 } } },
  { stage: 'score', level: 'info', message: '[1/4] uptimeradar.io: Scoring completed. Fit: 85%, Price: 100%, compliance: 50%. Overall Score: 79%.' },
  // PingSentinel
  { stage: 'map', level: 'info', message: '[2/4] pingsentinel.com: Mapping target paths...' },
  { stage: 'collect', level: 'info', message: '[2/4] pingsentinel.com: Scraping page 1 of 3: pingsentinel.com/pricing', data: { creditUsage: { totalCredits: 14 } } },
  { stage: 'collect', level: 'info', message: '[2/4] pingsentinel.com: Scraping page 2 of 3: pingsentinel.com/features', data: { creditUsage: { totalCredits: 15 } } },
  { stage: 'collect', level: 'info', message: '[2/4] pingsentinel.com: Scraping page 3 of 3: pingsentinel.com/security', data: { creditUsage: { totalCredits: 16 } } },
  { stage: 'extract', level: 'info', message: '[2/4] pingsentinel.com: Parsing text chunks and extracting claim nodes...' },
  { stage: 'brand', level: 'info', message: '[2/4] pingsentinel.com: Fetching visual elements from Brand Intelligence API...', data: { creditUsage: { totalCredits: 26 } } },
  { stage: 'score', level: 'info', message: '[2/4] pingsentinel.com: Scoring completed. Fit: 95%, Price: 100%, compliance: 100%. Overall Score: 98%.' },
  // StatSentry
  { stage: 'map', level: 'info', message: '[3/4] statsentry.net: Mapping target paths...' },
  { stage: 'collect', level: 'info', message: '[3/4] statsentry.net: Scraping page 1 of 2: statsentry.net/pricing', data: { creditUsage: { totalCredits: 27 } } },
  { stage: 'collect', level: 'info', message: '[3/4] statsentry.net: Scraping page 2 of 2: statsentry.net/security', data: { creditUsage: { totalCredits: 28 } } },
  { stage: 'extract', level: 'info', message: '[3/4] statsentry.net: Parsing text chunks and extracting claim nodes...' },
  { stage: 'brand', level: 'info', message: '[3/4] statsentry.net: Fetching visual elements from Brand Intelligence API...', data: { creditUsage: { totalCredits: 38 } } },
  { stage: 'score', level: 'info', message: '[3/4] statsentry.net: Scoring completed. Fit: 100%, Price: 30%, compliance: 100%. Overall Score: 79%.' },
  // watchdog.io
  { stage: 'map', level: 'info', message: '[4/4] watchdog.io: Mapping target paths...' },
  { stage: 'collect', level: 'info', message: '[4/4] watchdog.io: Scraping page 1 of 1: watchdog.io/pricing', data: { creditUsage: { totalCredits: 39 } } },
  { stage: 'extract', level: 'info', message: '[4/4] watchdog.io: Parsing text chunks...' },
  { stage: 'brand', level: 'info', message: '[4/4] watchdog.io: Fetching visual elements...', data: { creditUsage: { totalCredits: 49 } } },
  { stage: 'score', level: 'info', message: '[4/4] watchdog.io: Scoring completed. Fit: 60%, Price: 100%, compliance: 0%. Overall Score: 58%.' },
  // Synthesize & Done
  { stage: 'synthesize', level: 'info', message: 'Synthesizing final buyer recommendation and tradeoffs...' },
  { stage: 'done', level: 'info', message: 'Research complete! View Decision Brief.', data: { reportId: 'rpt_mock_uptime_1' } }
];

export function simulateSSE(
  onEvent: (event: PipelineEvent) => void,
  onComplete: (reportId: string) => void
) {
  let index = 0;
  
  const timer = setInterval(() => {
    if (index < MOCK_EVENTS.length) {
      const current = MOCK_EVENTS[index];
      onEvent({
        ...current,
        ts: new Date().toISOString()
      });
      index++;
    } else {
      clearInterval(timer);
      onComplete('rpt_mock_uptime_1');
    }
  }, 600);

  return () => clearInterval(timer);
}
