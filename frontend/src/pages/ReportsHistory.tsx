import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Plus, Trash2, FileText, ArrowRight } from 'lucide-react';
import * as client from '../api/client.js';
import { useToast } from '../components/ToastContext.js';
import { CardSkeleton } from '../components/Skeleton.js';
import { motion } from 'framer-motion';

export default function ReportsHistory() {
  const { toast } = useToast();
  
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    client.getReports()
      .then(res => setReports(res))
      .catch(err => {
        console.error('Error fetching reports:', err);
        toast('Failed to load reports history.', 'error');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this decision brief?')) return;

    try {
      await client.deleteReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
      toast('Brief removed from history.');
    } catch (err: any) {
      toast('Failed to delete report: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-text">Reports History</h2>
          <p className="text-xs text-muted">All generated vendor decision briefings and compliance metrics.</p>
        </div>
        
        <Link
          to="/"
          className="bg-accent text-background font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 hover:bg-accent/90 transition shadow-lg"
        >
          <Plus size={14} className="text-background" /> New Research
        </Link>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : reports.length === 0 ? (
        <div className="p-16 bg-surface border border-border border-dashed rounded-2xl text-center space-y-4 max-w-xl mx-auto mt-10">
          <div className="p-3 bg-raised rounded-2xl w-fit mx-auto text-muted/65">
            <FileText size={32} />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-text text-sm">No briefings generated yet</h4>
            <p className="text-xs text-muted">Run an autonomous research query to scout vendors and generate decision briefs.</p>
          </div>
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-accent font-semibold hover:underline">
            Go to research console <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {reports.map((report) => (
            <motion.div
              key={report.id}
              whileHover={{ y: -5, borderColor: 'rgba(108,124,255,0.4)', boxShadow: '0 10px 30px -10px rgba(108,124,255,0.1)' }}
              className="border border-border rounded-2xl overflow-hidden bg-surface/35 backdrop-blur-md transition-all duration-200"
            >
              <Link
                to={`/reports/${report.id}`}
                className="group p-5 flex flex-col justify-between h-44 relative"
                id={`report-card-grid-${report.id}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-muted font-mono flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, report.id)}
                      className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 p-1 rounded transition duration-150"
                      title="Delete brief"
                      id={`delete-brief-btn-${report.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h4 className="font-semibold text-sm text-text group-hover:text-accent transition leading-snug line-clamp-2">
                    {report.query}
                  </h4>
                </div>

                <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-4">
                  <div className="flex items-center gap-2">
                    {report.topPickLogoUrl ? (
                      <img
                        src={report.topPickLogoUrl}
                        alt={report.topPickName}
                        className="w-5 h-5 rounded bg-background/50 p-0.5"
                      />
                    ) : (
                      <div className="w-5 h-5 bg-raised rounded flex items-center justify-center font-bold text-[9px]">
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
    </div>
  );
}
