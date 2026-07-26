import { Report, Watch, WatchChange, Job, PipelineEvent } from './types.js';
import { MOCK_REPORT, MOCK_WATCHES, MOCK_WATCH_CHANGES, simulateSSE } from './mock.js';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '' : 'http://localhost:3001');
const IS_MOCK = import.meta.env.VITE_MOCK === 'true';

// Mock Memory State Store for interactive Mock Mode
class MockStateStore {
  reports: Report[] = [MOCK_REPORT];
  watches: Watch[] = [...MOCK_WATCHES];
  changes: Record<string, WatchChange[]> = { ...MOCK_WATCH_CHANGES };

  getReportsList() {
    return this.reports.map(r => {
      const topPick = r.vendors.find(v => v.id === r.recommendation.topPickVendorId);
      return {
        id: r.id,
        query: r.query,
        createdAt: r.createdAt,
        vendorCount: r.vendors.length,
        topPickName: topPick ? topPick.name : 'Unknown',
        topPickLogoUrl: topPick ? topPick.brand?.logoUrl || '' : ''
      };
    });
  }
}

const mockStore = new MockStateStore();

export async function getHealth(): Promise<{ ok: boolean; mockContext: boolean; mockLlm: boolean }> {
  if (IS_MOCK) {
    return { ok: true, mockContext: true, mockLlm: true };
  }
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function createResearch(query: string, vendorDomains?: string[], maxVendors?: number): Promise<{ jobId: string }> {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 400));
    return { jobId: 'job_mock_' + Math.random().toString(36).substring(2, 9) };
  }
  const res = await fetch(`${API_BASE}/api/research`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, vendorDomains, maxVendors })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getJobStatus(jobId: string): Promise<Job> {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 100));
    return {
      jobId,
      status: 'done',
      stage: 'done',
      reportId: 'rpt_mock_uptime_1',
      creditUsage: { scrapes: 12, brandCalls: 4, totalCredits: 52 }
    };
  }
  const res = await fetch(`${API_BASE}/api/research/${jobId}`);
  if (!res.ok) throw new Error('Job status check failed');
  return res.json();
}

export async function getReports() {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 300));
    return mockStore.getReportsList();
  }
  const res = await fetch(`${API_BASE}/api/reports`);
  if (!res.ok) throw new Error('Failed to retrieve reports');
  return res.json() as Promise<Array<{ id: string; query: string; createdAt: string; vendorCount: number; topPickName: string; topPickLogoUrl: string }>>;
}

export async function getReport(id: string): Promise<Report> {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 300));
    const r = mockStore.reports.find(rep => rep.id === id);
    if (!r) throw new Error('Report not found');
    return r;
  }
  const res = await fetch(`${API_BASE}/api/reports/${id}`);
  if (!res.ok) throw new Error('Failed to retrieve report detail');
  return res.json();
}

export async function deleteReport(id: string): Promise<void> {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 200));
    mockStore.reports = mockStore.reports.filter(r => r.id !== id);
    return;
  }
  const res = await fetch(`${API_BASE}/api/reports/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete report');
}

export async function getWatches(): Promise<Watch[]> {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 300));
    return mockStore.watches;
  }
  const res = await fetch(`${API_BASE}/api/watches`);
  if (!res.ok) throw new Error('Failed to retrieve watch list');
  return res.json();
}

export async function createWatch(reportId: string, vendorId: string, url: string, label: string): Promise<Watch> {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 300));
    
    // Check if watch already exists
    const existing = mockStore.watches.find(w => w.url === url);
    if (existing) return existing;

    const rep = mockStore.reports.find(rep => rep.id === reportId);
    const vendor = rep?.vendors.find(v => v.id === vendorId);
    
    const newWatch: Watch = {
      id: 'wtch_mock_' + Math.random().toString(36).substring(2, 9),
      label,
      url,
      vendorName: vendor ? vendor.name : 'Mock Vendor',
      vendorLogoUrl: vendor ? vendor.brand?.logoUrl || '' : '',
      lastCheckedAt: new Date().toISOString(),
      changeCount: 0
    };

    mockStore.watches.push(newWatch);
    mockStore.changes[newWatch.id] = [];
    return newWatch;
  }

  const res = await fetch(`${API_BASE}/api/watches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportId, vendorId, url, label })
  });
  if (!res.ok) throw new Error('Failed to create price watch');
  return res.json();
}

export async function deleteWatch(id: string): Promise<void> {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 200));
    mockStore.watches = mockStore.watches.filter(w => w.id !== id);
    delete mockStore.changes[id];
    return;
  }
  const res = await fetch(`${API_BASE}/api/watches/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete watch');
}

export async function getWatchChanges(watchId: string): Promise<WatchChange[]> {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 200));
    return mockStore.changes[watchId] || [];
  }
  const res = await fetch(`${API_BASE}/api/watches/${watchId}/changes`);
  if (!res.ok) throw new Error('Failed to load watch changes');
  return res.json();
}

export async function checkWatchNow(watchId: string): Promise<WatchChange | null> {
  if (IS_MOCK) {
    await new Promise(r => setTimeout(r, 800));
    
    const watch = mockStore.watches.find(w => w.id === watchId);
    if (!watch) throw new Error('Watch not found');

    const newChange: WatchChange = {
      id: 'chg_mock_' + Math.random().toString(36).substring(2, 9),
      detectedAt: new Date().toISOString(),
      summary: `Pricing tier adjustment detected on ${watch.vendorName}: Pro tier went from $29/mo -> $35/mo.`,
      before: `### Pro Tier\n- Price: $29 / month\n- Monitors: 100\n- Alerts: Email & Slack`,
      after: `### Pro Tier\n- Price: $35 / month\n- Monitors: 100\n- Alerts: Email & Slack (priority support)`
    };

    if (!mockStore.changes[watchId]) {
      mockStore.changes[watchId] = [];
    }
    
    mockStore.changes[watchId].unshift(newChange);
    watch.changeCount += 1;
    watch.lastCheckedAt = new Date().toISOString();

    return newChange;
  }

  const res = await fetch(`${API_BASE}/api/watches/${watchId}/check`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to run manual check');
  return res.json();
}

// Subscribe Event Stream
export function subscribeEvents(
  jobId: string,
  onEvent: (event: PipelineEvent) => void,
  onComplete: (reportId: string) => void,
  onError: (err: any) => void
): () => void {
  if (IS_MOCK) {
    const unsub = simulateSSE(onEvent, onComplete);
    return unsub;
  } else {
    const source = new EventSource(`${API_BASE}/api/research/${jobId}/events`);
    
    source.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onEvent(parsed);
        if (parsed.stage === 'done' && parsed.data?.reportId) {
          onComplete(parsed.data.reportId);
        }
      } catch (err) {
        console.error('[SSE] Failed to parse event JSON:', err);
      }
    };

    source.onerror = (err) => {
      onError(err);
    };

    return () => source.close();
  }
}
