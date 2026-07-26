import React from 'react';
import { NavLink } from 'react-router-dom';
import { Search, FileText, Eye, Cpu } from 'lucide-react';

export default function Sidebar() {
  const links = [
    { to: '/', label: 'Overview', icon: Search },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/watchlist', label: 'Watchlist', icon: Eye },
  ];

  return (
    <header className="w-full bg-surface border-b border-border sticky top-0 z-50 transition-all duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Side Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 select-none group">
          <div className="p-2.5 bg-accent/10 border border-accent/20 rounded-xl group-hover:bg-accent/15 transition-colors">
            <Cpu className="text-accent w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-base tracking-wider text-text leading-tight group-hover:text-accent transition-colors">StackScout</h1>
            <span className="text-[9px] text-muted font-mono uppercase tracking-widest block leading-none">Procurement Agent</span>
          </div>
        </NavLink>

        {/* Center Tabs Navigation */}
        <nav className="flex items-center gap-1 bg-background/50 border border-border/60 p-1 rounded-2xl">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all duration-200 ${
                    isActive
                      ? 'bg-accent text-white font-bold shadow-md shadow-accent/10'
                      : 'text-muted hover:text-text font-semibold'
                  }`
                }
                id={`nav-link-${link.label.toLowerCase().replace(' ', '-')}`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Right Side Info & Profile */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative cursor-pointer p-2 bg-background border border-border/80 hover:border-border rounded-xl text-muted hover:text-text transition-colors">
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full animate-ping" />
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>

          {/* Profile Card */}
          <div className="flex items-center gap-2.5 bg-background border border-border/80 px-3 py-1.5 rounded-2xl select-none">
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-text leading-tight">Alex J.</div>
              <div className="text-[9px] text-accent font-mono uppercase tracking-wider font-bold">Premium</div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100"
              alt="User profile avatar"
              className="w-7 h-7 rounded-full object-cover ring-2 ring-accent/15"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
