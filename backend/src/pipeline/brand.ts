import { ContextService, BrandInfo } from '../services/context.js';

export async function runBrandStage(
  jobId: string,
  domain: string,
  contextService: ContextService
): Promise<BrandInfo> {
  return contextService.getBrandInfo(jobId, domain);
}
