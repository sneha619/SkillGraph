import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Network, Search, Database, RefreshCw, Home } from 'lucide-react';
import { api } from '../../api/client';
import { SystemHealth } from '../../types';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch {
      setHealth({
        status: 'unreachable',
        database: 'CognoDB',
        connected: false,
        error: 'Backend API is unreachable',
      });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedNotice(null);
    try {
      const res = await api.seedDatabase();
      setSeedNotice('✅ CognoDB seeded with sample graph dataset!');
      setTimeout(() => setSeedNotice(null), 4000);
      await checkHealth();
    } catch (err: any) {
      setSeedNotice(`❌ Seeding failed: ${err.message}`);
      setTimeout(() => setSeedNotice(null), 5000);
    } finally {
      setIsSeeding(false);
    }
  };

  const isConnected = health?.status === 'healthy';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Home Link */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition">
              <Network className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-emerald-400 transition">
                  SkillGraph
                </span>
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                  CognoDB
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Knowledge & Career Graph</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-2">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                location.pathname === '/'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Search Graph</span>
            </Link>

            {/* Quick Link to Sample Developer */}
            <Link
              to="/developers/Alex%20Chen"
              className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                location.pathname.startsWith('/developers')
                  ? 'bg-slate-800/80 text-emerald-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              Sample Profile
            </Link>

            {/* Quick Link to Sample Skill */}
            <Link
              to="/skills/Graph%20Databases%20%26%20Cypher"
              className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                location.pathname.startsWith('/skills')
                  ? 'bg-slate-800/80 text-emerald-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              Sample Skill
            </Link>
          </nav>

          {/* Status Pill & Seed Action */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Database Status Indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isConnected
                  ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400'
                  : 'bg-amber-950/40 border-amber-800/50 text-amber-400'
              }`}
              title={
                health?.uri
                  ? `Connected to CognoDB via Bolt protocol at ${health.uri}`
                  : 'Checking CognoDB status...'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="hidden sm:inline">
                {isConnected ? 'CognoDB Connected' : 'CognoDB Standby'}
              </span>
            </div>

            {/* Seed Database Button */}
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl transition disabled:opacity-50"
              title="Reset and populate CognoDB with realistic developer, skill, company, and project data"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin text-emerald-400' : ''}`}
              />
              <span className="hidden sm:inline">{isSeeding ? 'Seeding...' : 'Seed Data'}</span>
            </button>
          </div>
        </div>

        {seedNotice && (
          <div className="py-2 px-3 text-xs bg-slate-800/90 text-center text-slate-200 border-t border-slate-700/80">
            {seedNotice}
          </div>
        )}
      </div>
    </header>
  );
};
