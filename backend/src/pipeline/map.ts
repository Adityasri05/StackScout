export interface MappedUrls {
  domain: string;
  urls: string[];
}

export async function runMapStage(
  domain: string,
  getSitemapFn: (domain: string) => Promise<string[]>
): Promise<string[]> {
  // Conventional URLs
  const candidatePaths = ['pricing', 'features', 'security', 'integrations', 'docs'];
  const urls = candidatePaths.map(path => `https://${domain}/${path}`);
  
  // Always include the homepage
  urls.unshift(`https://${domain}`);

  // In real mode, if we wanted to verify or filter URLs, we could query the sitemap.
  // For the scope of this pipeline, we will default to these 6 high-signal paths.
  // If we wanted to, we could call getSitemap(domain) if conventional paths are insufficient,
  // but mapping these directly is cheap and ensures high signal.
  return urls;
}
