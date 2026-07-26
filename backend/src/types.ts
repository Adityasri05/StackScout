export interface RequirementSpec {
  useCase: string;
  category: string;
  mustHaves: string[];
  niceToHaves: string[];
  budgetPerMonthUSD: number | null;
  constraints: string[];
}

export interface BrandConfig {
  logoUrl: string;
  primaryColor: string;
  colors: string[];
  fonts: string[];
}

export interface PricingTier {
  name: string;
  pricePerMonthUSD: number;
  priceNote: string;
  keyFeatures: string[];
  citation: string;
}

export interface PricingConfig {
  model: 'per-seat' | 'flat' | 'usage' | 'custom' | 'unknown';
  freeTier: boolean;
  tiers: PricingTier[];
}

export interface FeatureClaim {
  name: string;
  supported: 'yes' | 'no' | 'partial' | 'unknown';
  note: string;
  citation: string | null;
}

export interface ComplianceConfig {
  soc2: 'yes' | 'no' | 'unknown';
  gdpr: 'yes' | 'no' | 'unknown';
  hipaa: 'yes' | 'no' | 'unknown';
  dataResidency: string[];
  citations: string[];
}

export interface SupportConfig {
  channels: string[];
  sla: string | null;
  citation: string | null;
}

export interface ScoreConfig {
  fit: number;
  pricing: number;
  compliance: number;
  docsQuality: number;
  overall: number;
}

export interface Citation {
  url: string;
  title: string;
  scrapedAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  domain: string;
  brand: BrandConfig;
  summary: string;
  pricing: PricingConfig;
  features: FeatureClaim[];
  compliance: ComplianceConfig;
  integrations: string[];
  support: SupportConfig;
  scores: ScoreConfig;
  citations: Citation[];
}

export interface Recommendation {
  topPickVendorId: string;
  rationale: string;
  tradeoffs: string[];
  runnerUpVendorId: string;
}

export interface CreditUsage {
  scrapes: number;
  brandCalls: number;
  totalCredits: number;
}

export interface Report {
  id: string;
  query: string;
  createdAt: string;
  requirement: RequirementSpec;
  vendors: Vendor[];
  recommendation: Recommendation;
  creditUsage: CreditUsage;
}

export interface Watch {
  id: string;
  label: string;
  url: string;
  vendorName: string;
  vendorLogoUrl: string;
  lastCheckedAt: string | null;
  changeCount: number;
  reportId: string;
  vendorId: string;
}

export interface WatchChange {
  id: string;
  detectedAt: string;
  summary: string;
  before: string;
  after: string;
}

export interface Job {
  jobId: string;
  status: 'running' | 'done' | 'failed';
  stage: string;
  reportId?: string;
  error?: string;
  creditUsage: CreditUsage;
}

export interface PipelineEvent {
  ts: string;
  stage: 'plan' | 'discover' | 'map' | 'collect' | 'extract' | 'brand' | 'score' | 'synthesize' | 'done' | 'error';
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}
