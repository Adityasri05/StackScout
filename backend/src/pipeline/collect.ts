export interface ScrapedPage {
  url: string;
  markdown: string;
  success: boolean;
  error?: string;
}

export async function runCollectStage(
  jobId: string,
  domain: string,
  urls: string[],
  scrapeFn: (jobId: string, url: string, domain: string) => Promise<string>,
  onProgress: (url: string, index: number, total: number) => void
): Promise<ScrapedPage[]> {
  const results: ScrapedPage[] = [];
  
  // Cap at max 8 pages per vendor
  const targetUrls = urls.slice(0, 8);

  for (let i = 0; i < targetUrls.length; i++) {
    const url = targetUrls[i];
    onProgress(url, i + 1, targetUrls.length);
    try {
      const markdown = await scrapeFn(jobId, url, domain);
      results.push({
        url,
        markdown,
        success: true
      });
    } catch (err: any) {
      console.warn(`[CollectStage] Gracefully ignoring scrape failure for ${url}:`, err);
      results.push({
        url,
        markdown: '',
        success: false,
        error: err.message || String(err)
      });
    }
  }

  return results;
}
