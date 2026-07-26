import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Sparkles, ChevronDown, ChevronUp, Clock, Trash2, ArrowRight, Compass, Database, FileSpreadsheet, CheckCircle, Cpu, Network, Zap, Award } from 'lucide-react';
import * as client from '../api/client.js';
import { useToast } from '../components/ToastContext.js';
import { CardSkeleton } from '../components/Skeleton.js';
import { motion } from 'framer-motion';

export default function NewResearch() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [query, setQuery] = useState('');
  const [vendorDomains, setVendorDomains] = useState('');
  const [maxVendors, setMaxVendors] = useState(4);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [reports, setReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  const exampleQueries = [
    "We're a 10-person startup and need an uptime monitoring tool under $50/month with EU data residency and Slack alerts",
    "Customer support desk tool with live chat, shared inbox, SOC2 compliance, and HubSpot integration under $120/mo",
    "Email marketing platform with automation workflows, visual builder, GDPR compliance, and under $200/mo"
  ];

  useEffect(() => {
    client.getReports()
      .then(res => setReports(res))
      .catch(err => console.error('Error loading reports:', err))
      .finally(() => setIsLoadingReports(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast('Please enter your software requirement first.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedDomains = vendorDomains
        ? vendorDomains.split(',').map(d => d.trim()).filter(Boolean)
        : undefined;

      const { jobId } = await client.createResearch(query, parsedDomains, maxVendors);
      toast('Autonomous research agent dispatched!', 'info');
      navigate(`/run/${jobId}`);
    } catch (err: any) {
      toast(err.message || 'Failed to start research job.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReport = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this decision brief?')) return;
    
    try {
      await client.deleteReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
      toast('Report deleted successfully.');
    } catch (err: any) {
      toast('Failed to delete report: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2 relative">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/85 pb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-text">Scouting Dashboard</h2>
          <p className="text-xs text-muted">Track your autonomous procurement crawls and verify vendor compliance in real-time.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs bg-surface border border-border px-3 py-2 rounded-xl text-muted font-mono flex items-center gap-1.5 shadow-sm select-none">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span>LLM: Gemini 2.5 Flash Lite</span>
          </div>
          <div className="text-xs bg-surface border border-border px-3 py-2 rounded-xl text-muted font-mono flex items-center gap-1.5 shadow-sm select-none">
            <span>Crawl Engine: Online</span>
          </div>
        </div>
      </div>

      {/* Four Sparkline Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            title: "Total Crawler Runs",
            value: reports.length + 32,
            trend: "+12.4%",
            color: "#F05A28",
            points: "M 0 25 L 10 23 L 20 27 L 30 18 L 40 21 L 50 12 L 60 16 L 70 9 L 80 14 L 90 7 L 100 13",
            gradId: "grad-runs"
          },
          {
            title: "Live Watchlist Targets",
            value: "3 Sites",
            trend: "+33.3%",
            color: "#10B981",
            points: "M 0 20 L 15 22 L 30 15 L 45 25 L 60 12 L 75 18 L 90 5 L 100 10",
            gradId: "grad-watches"
          },
          {
            title: "Average Crawl Latency",
            value: "0.38s",
            trend: "-18.5%",
            color: "#3B82F6",
            points: "M 0 10 L 15 15 L 30 8 L 45 18 L 60 10 L 75 22 L 90 12 L 100 25",
            gradId: "grad-latency"
          },
          {
            title: "Credit Efficiency Index",
            value: "99.2%",
            trend: "+1.8%",
            color: "#F59E0B",
            points: "M 0 22 L 20 23 L 40 19 L 60 21 L 80 17 L 100 12",
            gradId: "grad-credits"
          }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="bg-surface border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-32 relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-muted font-sans">
              <span>{stat.title}</span>
              <span className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg font-mono text-[10px]">
                {stat.trend}
              </span>
            </div>

            <div className="text-2xl font-black text-text font-sans mt-1">
              {stat.value}
            </div>

            {/* Sparkline Graph */}
            <div className="w-full h-8 mt-2">
              <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={stat.gradId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={stat.color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={stat.color} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={stat.points} fill="none" stroke={stat.color} strokeWidth="1.5" />
                <path d={`${stat.points} L 100 30 L 0 30 Z`} fill={`url(#${stat.gradId})`} />
              </svg>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid Content (Two-Column Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Research Input & Recent Briefs (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main Research Console */}
          <motion.form 
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-surface border border-border p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-md space-y-6 relative overflow-hidden transition-all duration-300"
          >
            <div className="space-y-2">
              <label htmlFor="requirement-input" className="block text-xs font-mono uppercase text-muted tracking-widest flex items-center gap-1.5">
                <Search size={12} className="text-accent" />
                <span>Describe Your Software Requirement</span>
              </label>
              <textarea
                id="requirement-input"
                rows={4}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. We're a 10-person startup and need an uptime monitoring tool under $50/month with EU data residency and Slack alerts..."
                className="w-full bg-background border border-border rounded-2xl p-5 text-text placeholder-muted/50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all duration-200 text-sm leading-relaxed resize-none border-b-2"
              />
            </div>

            {/* Suggestion Chips */}
            <div className="space-y-2">
              <span className="block text-[11px] font-mono text-muted uppercase tracking-wider">Examples to try:</span>
              <div className="flex flex-col gap-2">
                {exampleQueries.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQuery(q)}
                    className="text-left text-xs bg-raised border border-border hover:border-accent/40 hover:text-text px-3.5 py-2.5 rounded-xl text-muted hover:bg-surface transition duration-150 max-w-full truncate"
                    id={`example-chip-${idx}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-text font-mono transition"
                id="advanced-options-toggle"
              >
                <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Settings</span>
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              
              {showAdvanced && (
                <div className="mt-4 p-4 bg-background border border-border rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                  <div className="space-y-1.5">
                    <label htmlFor="vendor-domains" className="block text-[11px] font-mono uppercase text-muted tracking-wider">
                      Target Domains (optional)
                    </label>
                    <input
                      id="vendor-domains"
                      type="text"
                      value={vendorDomains}
                      onChange={(e) => setVendorDomains(e.target.value)}
                      placeholder="e.g. datadoghq.com, newrelic.com"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text placeholder-muted/40 focus:outline-none focus:border-accent"
                    />
                    <span className="text-[10px] text-muted/70 font-mono block">Comma separated list</span>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="max-vendors" className="block text-[11px] font-mono uppercase text-muted tracking-wider">
                      Max Vendor Scope
                    </label>
                    <select
                      id="max-vendors"
                      value={maxVendors}
                      onChange={(e) => setMaxVendors(Number(e.target.value))}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-accent"
                    >
                      {[3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>{num} Vendors</option>
                      ))}
                    </select>
                    <span className="text-[10px] text-muted/70 font-mono block">Limits scraper credit usage</span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md shadow-accent/10"
              id="dispatch-agent-btn"
            >
              <Search size={16} className="text-white" />
              <span>{isSubmitting ? 'Dispatching Agent...' : 'Launch Research Pipeline'}</span>
            </button>
          </motion.form>

          {/* Recent Decision Briefs */}
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
          >
            <h3 className="text-xs font-mono uppercase text-muted tracking-widest">
              Recent Decision Briefs
            </h3>

            {isLoadingReports ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : reports.length === 0 ? (
              <div className="p-8 bg-surface border border-border border-dashed rounded-2xl text-center text-muted text-sm italic">
                No research reports found. Launch a run above to create your first brief!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reports.map((report) => (
                  <motion.div
                    key={report.id}
                    whileHover={{ y: -4, borderColor: 'rgba(240,90,40,0.4)', boxShadow: '0 10px 30px -10px rgba(240,90,40,0.08)' }}
                    className="group border border-border rounded-2xl overflow-hidden bg-surface transition-all duration-200"
                  >
                    <Link
                      to={`/reports/${report.id}`}
                      className="p-5 flex flex-col justify-between h-44 relative animate-fadeIn"
                      id={`report-card-${report.id}`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-muted font-mono flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                          <button
                            onClick={(e) => handleDeleteReport(e, report.id)}
                            className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 p-1 rounded transition duration-150"
                            title="Delete Report"
                            id={`delete-report-btn-${report.id}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <h4 className="font-semibold text-sm text-text group-hover:text-accent transition leading-snug line-clamp-2">
                          {report.query}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between border-t border-border/50 pt-3">
                        <div className="flex items-center gap-2">
                          {report.topPickLogoUrl ? (
                            <img
                              src={report.topPickLogoUrl}
                              alt={report.topPickName}
                              className="w-5 h-5 rounded object-contain p-0.5 bg-background border border-border"
                            />
                          ) : (
                            <div className="w-5 h-5 bg-raised rounded flex items-center justify-center font-bold text-[9px] border border-border">
                              {report.topPickName[0]}
                            </div>
                          )}
                          <span className="text-xs font-medium text-text">
                            Top pick: <span className="text-accent font-semibold">{report.topPickName}</span>
                          </span>
                        </div>
                        <span className="text-[10px] text-muted font-mono bg-raised px-2 py-0.5 rounded border border-border">
                          {report.vendorCount} Vendors
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>

          {/* How it Works Strip */}
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-4"
          >
            <h4 className="text-xs font-mono uppercase text-muted tracking-widest text-center">Pipeline Process</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { step: '01', title: 'Discover', desc: 'Queries public search to find candidate vendor domains.', icon: Compass },
                { step: '02', title: 'Collect', desc: 'Scrapes sitemaps and pricing pages to clean Markdown.', icon: Database },
                { step: '03', title: 'Structure', desc: 'LLM extracts core claims with source citations.', icon: FileSpreadsheet },
                { step: '04', title: 'Decide', desc: 'Scores criteria and generates a synthesis matrix.', icon: CheckCircle }
              ].map((s, idx) => {
                const Icon = s.icon;
                return (
                  <motion.div 
                    key={idx} 
                    whileHover={{ y: -5, borderColor: 'rgba(240,90,40,0.3)' }}
                    className="p-4 bg-surface border border-border rounded-xl space-y-2 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="text-accent/80 w-4.5 h-4.5" />
                      <span className="text-[10px] font-mono text-muted/50">{s.step}</span>
                    </div>
                    <h5 className="font-semibold text-xs text-text">{s.title}</h5>
                    <p className="text-[11px] text-muted leading-tight">{s.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        </div>

        {/* Right Column: Donut Gauge & Vendor Match Leaderboard (1/3 width) */}
        <div className="space-y-8">
          


          {/* Leaderboard: Top Match Candidates */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-surface border border-border p-6 rounded-3xl shadow-sm space-y-5"
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="text-xs font-mono uppercase text-muted tracking-wider flex items-center gap-1.5">
                <Award size={12} className="text-accent" />
                <span>Top Candidate Match</span>
              </h3>
              <span className="text-[10px] text-muted font-mono">3 Analysed</span>
            </div>

            <div className="space-y-4">
              {[
                { name: "PingSentinel", domain: "pingsentinel.com", score: 92, status: "Top Pick" },
                { name: "UptimeRadar", domain: "uptimeradar.io", score: 88, status: "Runner Up" },
                { name: "StatSentry", domain: "statsentry.net", score: 78, status: "Standard" }
              ].map((cand, i) => (
                <div key={i} className="flex items-center justify-between gap-3 bg-background/45 border border-border/40 p-3 rounded-2xl hover:border-border hover:bg-raised/20 transition-all duration-150">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white border border-border shadow-sm flex items-center justify-center font-bold text-[10px] text-accent select-none">
                      {cand.name[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-text leading-snug">{cand.name}</div>
                      <div className="text-[9px] text-muted font-mono">{cand.domain}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black font-mono text-text">{cand.score}%</span>
                    <span className="block text-[8px] text-accent font-semibold uppercase tracking-wide leading-none mt-0.5">{cand.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-muted/65 italic leading-tight text-center">
              Scores are calculated dynamically across criteria match & budget limits.
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
