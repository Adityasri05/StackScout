import React from 'react';
import { X, ExternalLink, Calendar, Link2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Citation } from '../api/types.js';

interface ActiveClaim {
  vendorName: string;
  name: string;
  supported: string;
  note: string;
  citation: string | null;
}

interface SourceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeClaim: ActiveClaim | null;
  citations: Citation[];
}

export default function SourceDrawer({ isOpen, onClose, activeClaim, citations }: SourceDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40 cursor-pointer"
          />

          {/* Drawer Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-surface border-l border-border flex flex-col shadow-2xl h-screen"
            id="source-evidence-drawer"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-raised/20">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-accent w-5 h-5" />
                <h3 className="font-semibold text-base text-text">Source Evidence</h3>
              </div>
              <button
                onClick={onClose}
                className="text-muted hover:text-text p-1.5 rounded-lg hover:bg-raised transition"
                id="close-drawer-btn"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Active Claim Evidence */}
              {activeClaim && (
                <div className="space-y-4">
                  <div className="text-xs font-mono uppercase tracking-widest text-muted">
                    Active Claim Verification
                  </div>
                  
                  <div className="bg-raised/40 border border-border p-4 rounded-xl space-y-3">
                    <div>
                      <span className="text-[11px] font-mono text-accent uppercase tracking-wider bg-accent/10 px-2 py-0.5 rounded">
                        {activeClaim.vendorName}
                      </span>
                      <h4 className="font-semibold text-text text-sm mt-2 leading-snug">
                        {activeClaim.name}
                      </h4>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="text-[13px] text-text/90 italic leading-relaxed">
                        &ldquo;{activeClaim.note}&rdquo;
                      </div>
                    </div>

                    {activeClaim.citation ? (
                      <div className="pt-2 border-t border-border/50">
                        <a
                          href={activeClaim.citation}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs text-accent hover:underline font-mono break-all inline-flex"
                        >
                          <Link2 size={13} />
                          <span>{activeClaim.citation.replace('https://', '')}</span>
                          <ExternalLink size={10} className="mt-0.5" />
                        </a>
                      </div>
                    ) : (
                      <div className="text-xs text-muted/80 italic pt-2 border-t border-border/50">
                        No direct source link. Claim extracted from parent company homepage documents.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* All Citations Index */}
              <div className="space-y-4">
                <div className="text-xs font-mono uppercase tracking-widest text-muted">
                  Scraped Source Document Index
                </div>

                <div className="space-y-2">
                  {citations.length === 0 ? (
                    <div className="text-sm text-muted italic">No citations available for this vendor.</div>
                  ) : (
                    citations.map((cite, index) => (
                      <div
                        key={index}
                        className="p-3.5 bg-background border border-border hover:border-accent/40 rounded-xl transition flex flex-col gap-1.5"
                      >
                        <div className="font-medium text-[13px] text-text leading-tight">
                          {cite.title || 'Source Document'}
                        </div>
                        <a
                          href={cite.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-muted hover:text-accent font-mono break-all"
                        >
                          <span className="truncate">{cite.url.replace('https://', '')}</span>
                          <ExternalLink size={10} className="flex-shrink-0" />
                        </a>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted/70 font-mono mt-1">
                          <Calendar size={11} />
                          <span>Scraped: {new Date(cite.scrapedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-raised/20 text-center text-[10px] text-muted leading-snug">
              Every data point is grounded in public web content scraped via Context.dev.
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
