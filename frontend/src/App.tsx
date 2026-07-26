import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar.js';
import NewResearch from './pages/NewResearch.js';
import LiveRun from './pages/LiveRun.js';
import ReportsHistory from './pages/ReportsHistory.js';
import ReportDetail from './pages/ReportDetail.js';
import Watchlist from './pages/Watchlist.js';
import { ToastProvider } from './components/ToastContext.js';

export default function App() {
  return (
    <ToastProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="flex flex-col min-h-screen bg-background text-text relative">
          {/* Ambient light radial glows */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
          {/* Subtle grid background overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.25] pointer-events-none -z-10" />

          {/* Top Header Navigation */}
          <Sidebar />

          {/* Main Area */}
          <div className="flex-1 flex flex-col justify-between overflow-x-hidden">
            <main className="flex-grow p-6 md:p-8 max-w-7xl w-full mx-auto">
              <Routes>
                <Route path="/" element={<NewResearch />} />
                <Route path="/run/:jobId" element={<LiveRun />} />
                <Route path="/reports" element={<ReportsHistory />} />
                <Route path="/reports/:id" element={<ReportDetail />} />
                <Route path="/watchlist" element={<Watchlist />} />
              </Routes>
            </main>

            {/* Global Grounding Footer */}
            <footer className="py-6 px-8 border-t border-border/60 bg-surface/20 text-center text-xs text-muted/65 leading-relaxed mt-12">
              <div className="max-w-4xl mx-auto">
                Data collected from public web pages via <a href="https://context.dev" target="_blank" rel="noreferrer" className="text-accent hover:underline font-semibold">Context.dev</a>. Every single extracted claim is verified with a ground-truth source URL citation.
              </div>
            </footer>
          </div>
        </div>
      </Router>
    </ToastProvider>
  );
}
