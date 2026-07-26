import React, { useState, useEffect } from 'react';
import { Eye, Trash2, RefreshCw, Calendar, ChevronDown, ChevronUp, AlertCircle, ArrowUpRight } from 'lucide-react';
import * as client from '../api/client.js';
import { Watch, WatchChange } from '../api/types.js';
import { useToast } from '../components/ToastContext.js';
import { TableRowSkeleton } from '../components/Skeleton.js';

function DiffViewer({ before, after }: { before: string; after: string }) {
  const beforeLines = before.split('\n').map(l => l.trim()).filter(Boolean);
  const afterLines = after.split('\n').map(l => l.trim()).filter(Boolean);
  const rendered: React.ReactNode[] = [];
  const allLines = new Set([...beforeLines, ...afterLines]);

  beforeLines.forEach((line, index) => {
    if (!afterLines.includes(line)) {
      rendered.push(
        <div key={`del-${index}-${line}`} className="bg-danger/10 border-l-2 border-danger text-danger px-3 py-1 font-mono text-xs flex items-center gap-2">
          <span className="opacity-50 select-none w-3 text-center">-</span>
          <span className="line-through">{line}</span>
        </div>
      );
    }
  });

  afterLines.forEach((line, index) => {
    if (!beforeLines.includes(line)) {
      rendered.push(
        <div key={`add-${index}-${line}`} className="bg-success/10 border-l-2 border-success text-success px-3 py-1 font-mono text-xs flex items-center gap-2">
          <span className="opacity-50 select-none w-3 text-center">+</span>
          <span>{line}</span>
        </div>
      );
    } else {
      rendered.push(
        <div key={`uc-${index}-${line}`} className="border-l-2 border-transparent text-muted/85 px-3 py-1 font-mono text-xs flex items-center gap-2">
          <span className="opacity-30 select-none w-3 text-center"> </span>
          <span>{line}</span>
        </div>
      );
    }
  });

  return (
    <div className="border border-border/80 rounded-xl overflow-hidden divide-y divide-border/20 bg-background/50">
      {rendered}
    </div>
  );
}

export default function Watchlist() {
  const { toast } = useToast();
  
  const [watches, setWatches] = useState<Watch[]>([]);
  const [changesMap, setChangesMap] = useState<Record<string, WatchChange[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [checkingWatchId, setCheckingWatchId] = useState<string | null>(null);
  const [expandedWatchId, setExpandedWatchId] = useState<string | null>(null);

  useEffect(() => {
    client.getWatches()
      .then(res => setWatches(res))
      .catch(err => {
        console.error('Error loading watches:', err);
        toast('Failed to load pricing watchlist.', 'error');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleExpandToggle = async (watchId: string) => {
    if (expandedWatchId === watchId) {
      setExpandedWatchId(null);
      return;
    }

    setExpandedWatchId(watchId);
    
    // Fetch changes for this watch if not already loaded
    if (!changesMap[watchId]) {
      try {
        const changes = await client.getWatchChanges(watchId);
        setChangesMap(prev => ({ ...prev, [watchId]: changes }));
      } catch (err) {
        console.error('Failed to load changes:', err);
        toast('Failed to load watch history.', 'error');
      }
    }
  };

  const handleCheckNow = async (e: React.MouseEvent, watch: Watch) => {
    e.stopPropagation();
    setCheckingWatchId(watch.id);
    toast(`Scraping latest page for ${watch.vendorName}...`, 'info');

    try {
      const newChange = await client.checkWatchNow(watch.id);
      
      // Update check details on watch row
      setWatches(prev => prev.map(w => {
        if (w.id === watch.id) {
          return {
            ...w,
            changeCount: newChange ? w.changeCount + 1 : w.changeCount,
            lastCheckedAt: new Date().toISOString()
          };
        }
        return w;
      }));

      // Append new change to active list if expanded
      if (newChange) {
        setChangesMap(prev => ({
          ...prev,
          [watch.id]: [newChange, ...(prev[watch.id] || [])]
        }));
        toast(`Price change detected for ${watch.vendorName}!`, 'success');
      } else {
        toast(`No price changes detected for ${watch.vendorName}.`);
      }
    } catch (err: any) {
      toast('Verification check failed: ' + err.message, 'error');
    } finally {
      setCheckingWatchId(null);
    }
  };

  const handleDeleteWatch = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to stop watching this page?')) return;

    try {
      await client.deleteWatch(id);
      setWatches(prev => prev.filter(w => w.id !== id));
      toast('Watch subscription cancelled.');
      if (expandedWatchId === id) setExpandedWatchId(null);
    } catch (err: any) {
      toast('Failed to cancel watch: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-text">Pricing Watchlist</h2>
        <p className="text-xs text-muted">Monitors pricing tiers and triggers automated alerts on public document adjustments.</p>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full border-collapse">
            <tbody>
              <TableRowSkeleton />
              <TableRowSkeleton />
            </tbody>
          </table>
        </div>
      ) : watches.length === 0 ? (
        <div className="p-16 bg-surface border border-border border-dashed rounded-2xl text-center space-y-4 max-w-xl mx-auto mt-10">
          <div className="p-3 bg-raised rounded-2xl w-fit mx-auto text-muted/65">
            <Eye size={32} />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-text text-sm">Watchlist is empty</h4>
            <p className="text-xs text-muted">Click "Watch page" on any vendor pricing card inside your decision briefs to start tracking.</p>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-border bg-raised/10 text-xs font-mono uppercase text-muted tracking-wider">
                <th className="p-4 w-8"></th>
                <th className="p-4">Vendor</th>
                <th className="p-4">Watched Target Page</th>
                <th className="p-4">Last Verified</th>
                <th className="p-4 text-center">Changes</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {watches.map((watch) => {
                const isExpanded = expandedWatchId === watch.id;
                const changes = changesMap[watch.id] || [];
                const isChecking = checkingWatchId === watch.id;

                return (
                  <React.Fragment key={watch.id}>
                    {/* Row */}
                    <tr
                      onClick={() => handleExpandToggle(watch.id)}
                      className={`border-b border-border/40 hover:bg-background/20 transition cursor-pointer select-none ${
                        isExpanded ? 'bg-raised/10' : ''
                      }`}
                      id={`watch-row-${watch.id}`}
                    >
                      <td className="p-4 text-center">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          {watch.vendorLogoUrl ? (
                            <img src={watch.vendorLogoUrl} alt={watch.vendorName} className="w-5 h-5 rounded" />
                          ) : (
                            <div className="w-5 h-5 bg-raised rounded flex items-center justify-center font-bold text-[9px]">
                              {watch.vendorName[0]}
                            </div>
                          )}
                          <span className="font-semibold text-[13px] text-text">{watch.vendorName}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <a
                          href={watch.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-muted hover:text-accent font-mono flex items-center gap-1 inline-flex max-w-[280px]"
                        >
                          <span className="truncate">{watch.label || watch.url.replace('https://', '')}</span>
                          <ArrowUpRight size={10} className="flex-shrink-0" />
                        </a>
                      </td>
                      <td className="p-4 text-xs font-mono text-muted">
                        {watch.lastCheckedAt ? new Date(watch.lastCheckedAt).toLocaleString() : 'Never'}
                      </td>
                      <td className="p-4 text-center">
                        {watch.changeCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger/10 text-danger border border-danger/20 font-mono">
                            {watch.changeCount} diffs
                          </span>
                        ) : (
                          <span className="text-muted/60 text-[11px] font-mono">No drift</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleCheckNow(e, watch)}
                            disabled={isChecking}
                            className="p-1.5 text-muted hover:text-accent rounded hover:bg-raised transition disabled:opacity-50"
                            title="Verify Page Now"
                            id={`check-now-btn-${watch.id}`}
                          >
                            <RefreshCw size={14} className={isChecking ? 'animate-spin text-accent' : ''} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteWatch(e, watch.id)}
                            className="p-1.5 text-muted hover:text-danger rounded hover:bg-raised transition"
                            title="Delete Watch"
                            id={`delete-watch-btn-${watch.id}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Changes Area */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="bg-background/40 p-6 border-b border-border">
                          <div className="space-y-4">
                            <h4 className="text-xs font-mono uppercase text-muted tracking-wider">
                              Change Tracking Logs ({changes.length})
                            </h4>

                            {changes.length === 0 ? (
                              <div className="text-xs text-muted/80 italic pl-4">
                                No modifications recorded yet. Click checking updates to check again.
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {changes.map((change) => (
                                  <div
                                    key={change.id}
                                    className="border border-border/80 rounded-xl overflow-hidden bg-surface"
                                  >
                                    {/* Change Header info */}
                                    <div className="px-4 py-2 border-b border-border bg-raised/20 flex items-center justify-between text-[11px] font-mono text-muted">
                                      <div className="flex items-center gap-1">
                                        <AlertCircle size={12} className="text-warn" />
                                        <span className="font-semibold text-text">{change.summary}</span>
                                      </div>
                                      <span className="flex items-center gap-1 select-none">
                                        <Calendar size={11} />
                                        {new Date(change.detectedAt).toLocaleString()}
                                      </span>
                                    </div>

                                    {/* Diffs Area */}
                                    <div className="p-4 bg-background/20 border-t border-border/40 space-y-2">
                                      <span className="text-[10px] text-muted font-mono uppercase tracking-widest block">Git-Style Pricing Delta</span>
                                      <DiffViewer before={change.before} after={change.after} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    )}
    </div>
  );
}
