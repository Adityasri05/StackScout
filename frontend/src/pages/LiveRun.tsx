import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Shield, Sparkles, CheckCircle2, XCircle, RefreshCw, Radio } from 'lucide-react';
import * as client from '../api/client.js';
import { PipelineEvent } from '../api/types.js';
import { useToast } from '../components/ToastContext.js';
import { motion } from 'framer-motion';

export default function LiveRun() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [currentStage, setCurrentStage] = useState<string>('plan');
  const [status, setStatus] = useState<'running' | 'done' | 'failed'>('running');
  const [reportId, setReportId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Stepper Stage Definitions
  const stages = [
    { id: 'plan', label: 'Plan spec' },
    { id: 'discover', label: 'Discover vendors' },
    { id: 'map', label: 'Map pages' },
    { id: 'collect', label: 'Collect text' },
    { id: 'extract', label: 'Extract claims' },
    { id: 'brand', label: 'Brand enrichment' },
    { id: 'score', label: 'Score fitting' },
    { id: 'synthesize', label: 'Synthesize brief' }
  ];

  // Increment timer
  useEffect(() => {
    let timer: number;
    if (status === 'running') {
      timer = window.setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  // Subscribe to SSE Stream
  useEffect(() => {
    if (!jobId) return;

    const unsubscribe = client.subscribeEvents(
      jobId,
      (event) => {
        setEvents(prev => [...prev, event]);
        
        const stageStr = event.stage as string;
        if (stageStr === 'error') {
          setStatus('failed');
          setErrorMessage(event.message);
          toast('Research pipeline execution encountered an error.', 'error');
          return;
        }

        if (stageStr === 'done') {
          setStatus('done');
          if (event.data?.reportId) {
            setReportId(event.data.reportId);
          }
          toast('Autonomous research complete!', 'success');
          return;
        }

        if (event.stage && event.stage !== 'done' && event.stage !== 'error') {
          setCurrentStage(event.stage);
        }

        // Extract credits usage if provided in event data
        if (event.data?.creditUsage?.totalCredits !== undefined) {
          setCredits(event.data.creditUsage.totalCredits);
        } else if (event.data?.creditUsage?.scrapes !== undefined) {
          // Fallback or accumulate
          const scrapes = event.data.creditUsage.scrapes || 0;
          const brandCalls = event.data.creditUsage.brandCalls || 0;
          setCredits(scrapes * 1 + brandCalls * 10);
        } else if (event.data?.creditUsage !== undefined) {
          // Direct total check
          const total = event.data.creditUsage.totalCredits || 0;
          setCredits(total);
        } else if (event.message.includes('credit')) {
          // Rough regex extract for mock
          const match = event.message.match(/(\d+)\s+credit/);
          if (match) {
            setCredits(Number(match[1]));
          }
        }
      },
      (finalReportId) => {
        setStatus('done');
        setReportId(finalReportId);
        toast('Autonomous research complete!', 'success');
      },
      (err) => {
        console.error('SSE connection drop, checking job status:', err);
        // Wait 2 seconds to give the browser's network interface time to wake up / reconnect
        setTimeout(() => {
          const checkStatus = (retries = 3) => {
            client.getJobStatus(jobId)
              .then((job: any) => {
                if (job.status === 'failed') {
                  setStatus('failed');
                  setErrorMessage(job.error || 'Connection lost or background runner crashed.');
                  toast('Research pipeline execution encountered an error.', 'error');
                } else if (job.status === 'done') {
                  setStatus('done');
                  setReportId(job.reportId || null);
                  toast('Autonomous research complete!', 'success');
                }
              })
              .catch((fetchErr) => {
                console.warn(`Transient error checking job status, retries left: ${retries}`, fetchErr);
                if (retries > 0) {
                  setTimeout(() => checkStatus(retries - 1), 3000);
                }
              });
          };
          checkStatus();
        }, 2000);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [jobId]);

  // Auto Scroll unless paused on hover
  useEffect(() => {
    if (!isPaused && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events, isPaused]);

  // Calculate Stepper State for each item
  const getStageState = (stageId: string) => {
    if (status === 'done') return 'done';
    
    const stageOrder = ['plan', 'discover', 'map', 'collect', 'extract', 'brand', 'score', 'synthesize'];
    const currentIndex = stageOrder.indexOf(currentStage);
    const targetIndex = stageOrder.indexOf(stageId);
    
    if (status === 'failed' && currentIndex === targetIndex) return 'failed';
    if (targetIndex < currentIndex) return 'done';
    if (targetIndex === currentIndex) return 'active';
    return 'pending';
  };

  const getStageBadgeColor = (stage: string) => {
    switch (stage) {
      case 'plan': return 'text-purple-400 bg-purple-400/10 border-purple-500/20';
      case 'discover': return 'text-blue-400 bg-blue-400/10 border-blue-500/20';
      case 'map': return 'text-amber-400 bg-amber-400/10 border-amber-500/20';
      case 'collect': return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
      case 'extract': return 'text-rose-400 bg-rose-400/10 border-rose-500/20';
      case 'brand': return 'text-cyan-400 bg-cyan-400/10 border-cyan-500/20';
      case 'score': return 'text-teal-400 bg-teal-400/10 border-teal-500/20';
      case 'synthesize': return 'text-indigo-400 bg-indigo-400/10 border-indigo-500/20';
      default: return 'text-muted bg-raised border-border';
    }
  };

  // Helper to format duration
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface border border-border p-5 rounded-2xl">
        <div className="space-y-1.5 flex-1">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text font-mono transition">
            <ArrowLeft size={12} />
            <span>Abort Run</span>
          </Link>
          <h2 className="text-sm font-semibold text-text leading-tight line-clamp-1">
            Running Scouts for: <span className="text-accent italic">"{events[0]?.message.replace('Analyzing user requirement: ', '') || 'Extracting Criteria'}"</span>
          </h2>
        </div>

        {/* Status Metrics */}
        <div className="flex items-center gap-4 text-xs font-mono text-muted">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-raised rounded-lg border border-border">
            <Clock size={13} />
            <span>Time: <span className="text-text">{formatTime(elapsed)}</span></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-raised rounded-lg border border-border">
            <Shield size={13} />
            <span>Credits: <span className="text-accent font-bold">{credits}</span></span>
          </div>
        </div>
      </div>

      {/* Main Runner Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Rail: Stepper */}
        <div className="md:col-span-1 bg-surface border border-border rounded-2xl p-5 h-fit space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted">Agent Pipeline</h3>
          
          {status === 'running' && (
            <div className="flex items-center gap-3 p-3 bg-accent/5 border border-accent/15 rounded-xl">
              <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-accent/20 animate-ping" />
                <div className="absolute w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono text-accent uppercase tracking-widest font-bold">Agent Active</div>
                <div className="text-[9px] text-muted leading-tight">Crawling website pricing pages...</div>
              </div>
            </div>
          )}

          <div className="relative pl-1.5 space-y-5">
            {/* Thread Line */}
            <div className="absolute top-2.5 bottom-2.5 left-4 w-0.5 bg-border z-0" />

            {stages.map((stage) => {
              const state = getStageState(stage.id);
              
              let stepIcon = (
                <div className="w-5.5 h-5.5 rounded-full border border-border bg-background flex items-center justify-center z-10 text-[9px] font-mono text-muted flex-shrink-0">
                  •
                </div>
              );

              let textColor = 'text-muted';

              if (state === 'done') {
                stepIcon = (
                  <div className="w-5.5 h-5.5 rounded-full bg-success/20 border border-success flex items-center justify-center z-10 text-success flex-shrink-0">
                    ✓
                  </div>
                );
                textColor = 'text-text/70';
              } else if (state === 'active') {
                stepIcon = (
                  <div className="w-5.5 h-5.5 rounded-full bg-accent/20 border border-accent flex items-center justify-center z-10 flex-shrink-0">
                    <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                  </div>
                );
                textColor = 'text-text font-semibold';
              } else if (state === 'failed') {
                stepIcon = (
                  <div className="w-5.5 h-5.5 rounded-full bg-danger/20 border border-danger flex items-center justify-center z-10 text-danger flex-shrink-0">
                    ✕
                  </div>
                );
                textColor = 'text-danger font-semibold';
              }

              return (
                <div key={stage.id} className="flex items-center gap-3 relative z-10 text-xs">
                  {stepIcon}
                  <span className={`${textColor} capitalize`}>{stage.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Column: Live Activity Feed */}
        <div className="md:col-span-3 flex flex-col gap-4">
          
          {/* Action Logs Box */}
          <div className="bg-surface border border-border rounded-2xl flex flex-col flex-1 h-[450px]">
            {/* Box Header */}
            <div className="px-5 py-3 border-b border-border bg-raised/20 flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-muted">Activity Logs</span>
              {status === 'running' && (
                <span className="text-[10px] text-accent font-mono flex items-center gap-1">
                  <RefreshCw size={10} className="animate-spin" />
                  Live Streaming
                </span>
              )}
            </div>

            {/* Scrollable logs */}
            <div
              ref={containerRef}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="flex-1 p-5 overflow-y-auto font-mono text-xs space-y-3 bg-background/50"
              id="scrolling-activity-feed"
            >
              {events.length === 0 ? (
                <div className="text-muted italic text-center pt-20">Initializing search pipeline...</div>
              ) : (
                events.map((evt, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="flex items-start gap-3 border-b border-border/10 pb-1.5 hover:bg-raised/10 transition duration-75"
                  >
                    {/* Timestamp */}
                    <span className="text-muted/60 text-[10px] select-none pt-0.5">
                      {new Date(evt.ts).toLocaleTimeString()}
                    </span>

                    {/* Stage Label */}
                    <span className={`px-1.5 py-0.25 text-[10px] font-mono border rounded select-none uppercase tracking-wider ${getStageBadgeColor(evt.stage)}`}>
                      {evt.stage}
                    </span>

                    {/* Message text */}
                    <div className="flex-1 text-text/90 leading-relaxed font-sans break-all">
                      {evt.message}

                      {/* Render customized rich details if present */}
                      {evt.data?.domains && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {evt.data.domains.map((dom: string) => (
                            <div key={dom} className="flex items-center gap-1.5 bg-raised border border-border px-2 py-1 rounded-lg text-xs">
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${dom}&sz=32`}
                                alt={dom}
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                className="w-3.5 h-3.5"
                              />
                              <span className="font-mono text-[11px] text-text">{dom}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* completion Banner CTA */}
          {status === 'done' && reportId && (
            <div className="bg-success/15 border border-success/30 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-slideUp">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-success w-8 h-8 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-text text-sm">Research Pipeline Completed</h4>
                  <p className="text-xs text-muted leading-tight mt-0.5">The analysis is fully structured and cited.</p>
                </div>
              </div>
              <Link
                to={`/reports/${reportId}`}
                className="bg-success text-background font-bold text-xs py-2.5 px-5 rounded-xl hover:bg-success/90 transition shadow-lg"
                id="view-brief-btn"
              >
                View Decision Brief
              </Link>
            </div>
          )}

          {/* Error Banner */}
          {status === 'failed' && (
            <div className="bg-danger/15 border border-danger/30 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-slideUp">
              <div className="flex items-center gap-3">
                <XCircle className="text-danger w-8 h-8 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-text text-sm">Pipeline Execution Interrupted</h4>
                  <p className="text-xs text-muted mt-0.5">{errorMessage || 'An unexpected error occurred during research.'}</p>
                </div>
              </div>
              <Link
                to="/"
                className="bg-danger text-text font-bold text-xs py-2.5 px-5 rounded-xl hover:bg-danger/90 transition"
              >
                Back Home
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
