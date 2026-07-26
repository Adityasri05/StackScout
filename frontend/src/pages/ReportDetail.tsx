import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Eye, CheckCircle2, XCircle, AlertCircle, HelpCircle, Link2, ExternalLink } from 'lucide-react';
import * as client from '../api/client.js';
import { Report, Vendor, FeatureClaim } from '../api/types.js';
import { useToast } from '../components/ToastContext.js';
import { ReportSkeleton } from '../components/Skeleton.js';
import SourceDrawer from '../components/SourceDrawer.js';
import { motion } from 'framer-motion';

// Auto contrast helper: returns dark text for light colors, and light text for dark colors
function getContrastText(hexcolor: string) {
  if (!hexcolor || hexcolor.length < 4) return '#E6EAF2';
  let hex = hexcolor.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length !== 6) return '#E6EAF2';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 140) ? '#0B0E14' : '#E6EAF2';
}

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeClaim, setActiveClaim] = useState<any>(null);
  const [activeCitations, setActiveCitations] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    client.getReport(id)
      .then(res => setReport(res))
      .catch(err => {
        console.error('Error fetching report:', err);
        toast('Failed to load decision brief.', 'error');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <ReportSkeleton />;
  }

  if (!report) {
    return (
      <div className="text-center py-20 bg-surface border border-border rounded-2xl">
        <h4 className="text-lg font-bold text-text">Decision Brief Not Found</h4>
        <p className="text-muted text-sm mt-1">This report may have been deleted.</p>
        <Link to="/" className="mt-4 inline-flex items-center gap-1 bg-accent text-background font-bold px-4 py-2 rounded-xl text-xs hover:bg-accent/90 transition">
          <ArrowLeft size={14} /> Back Home
        </Link>
      </div>
    );
  }

  // Find top pick vendor
  const topPick = report.vendors.find(v => v.id === report.recommendation.topPickVendorId);
  const runnerUp = report.vendors.find(v => v.id === report.recommendation.runnerUpVendorId);

  // Union list of feature names across all vendors
  const featuresUnion = Array.from(
    new Set(report.vendors.flatMap(v => v.features.map(f => f.name)))
  );

  const handleOpenCitation = (vendor: Vendor, claim: FeatureClaim) => {
    setActiveClaim({
      vendorName: vendor.name,
      name: claim.name,
      supported: claim.supported,
      note: claim.note,
      citation: claim.citation
    });
    setActiveCitations(vendor.citations);
    setDrawerOpen(true);
  };

  const handleWatchPricing = async (vendor: Vendor) => {
    try {
      const pricingUrl = vendor.pricing.tiers[0]?.citation || `https://${vendor.domain}/pricing`;
      await client.createWatch(report.id, vendor.id, pricingUrl, `${vendor.name} Pricing`);
      toast(`Watching ${vendor.name} pricing page!`);
    } catch (err: any) {
      toast('Failed to subscribe watch: ' + err.message, 'error');
    }
  };

  const getFeatureIcon = (supported: string) => {
    switch (supported) {
      case 'yes':
        return <CheckCircle2 className="text-success w-4.5 h-4.5" />;
      case 'no':
        return <XCircle className="text-danger w-4.5 h-4.5" />;
      case 'partial':
        return <AlertCircle className="text-warn w-4.5 h-4.5" />;
      default:
        return <HelpCircle className="text-muted/60 w-4.5 h-4.5" />;
    }
  };

  return (
    <div className="space-y-8 py-2">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text font-mono transition">
            <ArrowLeft size={12} /> Back to dashboard
          </Link>
          <h2 className="text-lg font-bold text-text leading-snug line-clamp-1">{report.query}</h2>
          <div className="text-xs font-mono text-muted">
            Generated: {new Date(report.createdAt).toLocaleString()} · Credits Used: {report.creditUsage.totalCredits}
          </div>
        </div>

        <Link
          to="/"
          className="bg-raised border border-border text-text hover:text-accent hover:border-accent/40 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition"
        >
          <Plus size={14} /> New Research
        </Link>
      </div>

      {/* 1. Recommendation Card */}
      {topPick && (
        <div className="bg-surface border border-accent/30 rounded-2xl overflow-hidden shadow-[0_0_50px_-12px_rgba(108,124,255,0.25)] hover:shadow-[0_0_50px_-12px_rgba(108,124,255,0.4)] transition-all duration-300">
          <div
            style={{ backgroundColor: topPick.brand?.primaryColor || '#6C7CFF', color: getContrastText(topPick.brand?.primaryColor) }}
            className="p-6 flex items-center justify-between border-b border-border"
          >
            <div className="flex items-center gap-4">
              {topPick.brand?.logoUrl ? (
                <div className="w-12 h-12 bg-white/10 rounded-xl p-2.5 flex items-center justify-center backdrop-blur-sm">
                  <img src={topPick.brand.logoUrl} alt={topPick.name} className="max-w-full max-h-full" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-bold text-lg">
                  {topPick.name[0]}
                </div>
              )}
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest opacity-80">Top Decision Pick</span>
                <h3 className="text-2xl font-bold tracking-wide leading-tight">{topPick.name}</h3>
              </div>
            </div>

            <span className="text-2xl font-black font-mono tracking-tighter bg-black/10 px-3 py-1.5 rounded-lg border border-white/10">
              {topPick.scores.overall}%
            </span>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase text-muted tracking-wider">Recommendation Rationale</h4>
              <p className="text-text text-sm leading-relaxed max-w-3xl">
                {report.recommendation.rationale}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
              <div className="space-y-2.5">
                <h4 className="text-xs font-mono uppercase text-muted tracking-wider">Key Tradeoffs</h4>
                <ul className="space-y-2">
                  {report.recommendation.tradeoffs.map((t, idx) => (
                    <li key={idx} className="text-xs text-muted flex items-start gap-2 leading-relaxed">
                      <span className="text-accent mt-0.5">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {runnerUp && (
                <div className="space-y-3 p-4 bg-background border border-border rounded-xl">
                  <span className="text-[10px] font-mono uppercase text-muted/80 tracking-widest">Runner Up Choice</span>
                  <div className="flex items-center gap-2">
                    {runnerUp.brand?.logoUrl && (
                      <img src={runnerUp.brand.logoUrl} alt={runnerUp.name} className="w-4 h-4" />
                    )}
                    <span className="font-bold text-sm text-text">{runnerUp.name}</span>
                    <span className="text-xs text-muted font-mono">({runnerUp.scores.overall}%)</span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    A viable fallback, scoring well on feature fit but carries minor tradeoffs as detailed above.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Grouped Score Bars */}
      <div className="bg-surface border border-border p-6 rounded-2xl space-y-6">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-text">Criteria Performance Scores</h3>
          <p className="text-xs text-muted">Evaluated automatically against requirement spec items.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {report.vendors.map((vendor) => {
            const primaryColor = vendor.brand?.primaryColor || '#6C7CFF';
            return (
              <div
                key={vendor.id}
                className="p-5 bg-background border border-border/60 rounded-xl space-y-4 hover:border-border transition duration-150"
              >
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <div className="flex items-center gap-2">
                    {vendor.brand?.logoUrl && (
                      <img src={vendor.brand.logoUrl} alt={vendor.name} className="w-4 h-4" />
                    )}
                    <h4 className="font-bold text-sm text-text">{vendor.name}</h4>
                  </div>
                  <span className="font-bold text-xs font-mono" style={{ color: primaryColor }}>
                    Overall: {vendor.scores.overall}%
                  </span>
                </div>

                <div className="space-y-2.5">
                  {[
                    { label: 'Feature Fit', score: vendor.scores.fit },
                    { label: 'Pricing fit', score: vendor.scores.pricing },
                    { label: 'Compliance Match', score: vendor.scores.compliance },
                    { label: 'Scraped Docs Coverage', score: vendor.scores.docsQuality }
                  ].map((s, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono text-muted">
                        <span>{s.label}</span>
                        <span>{s.score}%</span>
                      </div>
                      <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${s.score}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          style={{
                            backgroundColor: primaryColor
                          }}
                          className="h-full rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Comparison Matrix */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-md">
        <div className="p-6 border-b border-border bg-raised/20">
          <h3 className="text-sm font-semibold text-text">Feature Comparison Matrix</h3>
          <p className="text-xs text-muted mt-0.5">Click any claim's citation icon to open verified source text.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                {/* Sticky feature column */}
                <th className="p-4 bg-surface text-xs font-mono uppercase text-muted tracking-wider sticky left-0 z-20 w-1/3 border-r border-border shadow-[4px_0_8px_-4px_rgba(0,0,0,0.3)]">
                  Requirement
                </th>
                {report.vendors.map((vendor) => (
                  <th
                    key={vendor.id}
                    style={{ color: vendor.brand?.primaryColor || '#6C7CFF' }}
                    className="p-4 text-xs font-bold font-mono text-center border-r border-border/50"
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      {vendor.brand?.logoUrl && (
                        <img src={vendor.brand.logoUrl} alt={vendor.name} className="w-4 h-4" />
                      )}
                      <span>{vendor.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featuresUnion.map((featureName, idx) => (
                <tr key={idx} className="border-b border-border/40 hover:bg-background/20 transition">
                  {/* Sticky feature name */}
                  <td className="p-4 bg-surface font-semibold text-[13px] text-text sticky left-0 z-20 border-r border-border shadow-[4px_0_8px_-4px_rgba(0,0,0,0.3)]">
                    {featureName}
                  </td>
                  
                  {report.vendors.map((vendor) => {
                    const claim = vendor.features.find(f => f.name === featureName) || {
                      name: featureName,
                      supported: 'unknown',
                      note: 'Feature not analyzed.',
                      citation: null
                    };

                    return (
                      <td
                        key={vendor.id}
                        className="p-4 text-center border-r border-border/50 align-top relative group/cell"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="flex items-center gap-1">
                            {getFeatureIcon(claim.supported)}
                            
                            {claim.citation && (
                              <button
                                onClick={() => handleOpenCitation(vendor, claim)}
                                className="text-muted hover:text-accent transition p-0.5 rounded hover:bg-raised"
                                title="View Citation Evidence"
                                id={`citation-btn-${vendor.id}-${featureName.toLowerCase().replace(/\s/g, '-')}`}
                              >
                                <Link2 size={11} />
                              </button>
                            )}
                          </div>
                          
                          {/* Note text */}
                          <div className="text-[11px] text-muted leading-tight mt-1 opacity-80 max-w-[180px] break-words line-clamp-2 group-hover/cell:line-clamp-none transition">
                            {claim.note}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Pricing Tiers Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono uppercase text-muted tracking-widest">Pricing Structure & Tiers</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {report.vendors.map((vendor) => {
            const primaryColor = vendor.brand?.primaryColor || '#6C7CFF';
            return (
              <div key={vendor.id} className="bg-surface border border-border p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    {vendor.brand?.logoUrl && (
                      <img src={vendor.brand.logoUrl} alt={vendor.name} className="w-5 h-5" />
                    )}
                    <h4 className="font-bold text-base text-text">{vendor.name}</h4>
                  </div>
                  
                  {/* Watch Button */}
                  <button
                    onClick={() => handleWatchPricing(vendor)}
                    className="flex items-center gap-1.5 text-xs text-muted hover:text-accent font-mono transition"
                    id={`watch-pricing-btn-${vendor.id}`}
                  >
                    <Eye size={12} />
                    <span>Watch page</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {vendor.pricing.tiers.map((tier, tIdx) => (
                    <div
                      key={tIdx}
                      className="p-4 bg-background border border-border hover:border-border rounded-xl flex flex-col justify-between"
                      style={{ borderLeftWidth: '3px', borderLeftColor: primaryColor }}
                    >
                      <div className="space-y-2">
                        <span className="text-[11px] font-mono text-muted uppercase tracking-wider">{tier.name}</span>
                        <div className="text-2xl font-black text-text font-mono">
                          ${tier.pricePerMonthUSD}
                          <span className="text-xs font-normal text-muted font-sans">/mo</span>
                        </div>
                        <p className="text-[10px] text-muted font-mono leading-tight">{tier.priceNote}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/40">
                        <ul className="text-[11px] text-text/80 space-y-1.5">
                          {tier.keyFeatures.map((kf, kIdx) => (
                            <li key={kIdx} className="flex items-start gap-1">
                              <span className="text-accent">•</span>
                              <span className="line-clamp-2">{kf}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Compliance & Security Strip */}
      <div className="bg-surface border border-border p-6 rounded-2xl space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-text">Compliance & Security Signatures</h3>
          <p className="text-xs text-muted">Audited governance specifications for secure deployment.</p>
        </div>

        <div className="divide-y divide-border/60">
          {report.vendors.map((vendor) => (
            <div key={vendor.id} className="py-4 first:pt-0 last:pb-0 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
              <div className="flex items-center gap-2">
                {vendor.brand?.logoUrl && (
                  <img src={vendor.brand.logoUrl} alt={vendor.name} className="w-4 h-4" />
                )}
                <span className="font-bold text-sm text-text">{vendor.name}</span>
              </div>

              {/* Chips */}
              <div className="sm:col-span-3 flex flex-wrap gap-2.5">
                {[
                  { label: 'SOC 2', val: vendor.compliance.soc2 },
                  { label: 'GDPR', val: vendor.compliance.gdpr },
                  { label: 'HIPAA', val: vendor.compliance.hipaa }
                ].map((c, idx) => {
                  let badgeColor = 'bg-background text-muted/80 border-border';
                  if (c.val === 'yes') badgeColor = 'bg-success/10 text-success border-success/20';
                  else if (c.val === 'no') badgeColor = 'bg-danger/10 text-danger border-danger/20';
                  
                  return (
                    <span
                      key={idx}
                      className={`px-2.5 py-1 text-xs border rounded-lg font-mono ${badgeColor}`}
                    >
                      {c.label}: <span className="font-bold uppercase">{c.val}</span>
                    </span>
                  );
                })}

                {/* Data residency */}
                {vendor.compliance.dataResidency.map((res, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs border border-accent/20 bg-accent/5 text-accent rounded-lg font-mono"
                  >
                    Residency: <span className="font-bold">{res}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Citation Evidence Source Drawer */}
      <SourceDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeClaim={activeClaim}
        citations={activeCitations}
      />
    </div>
  );
}
