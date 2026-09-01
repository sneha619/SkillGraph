import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Network, Search, Database, RefreshCw, Compass, Users, Code2 } from 'lucide-react';
import { api } from '../../api/client';
import { SystemHealth } from '../../types';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
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

  const triggerSeedNotice = (msg: string) => setSeedNotice(msg);

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
  const isHome = location.pathname === '/';
  const isDevPage = location.pathname.startsWith('/developers');
  const isSkillPage = location.pathname.startsWith('/skills');

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 ${
      active
        ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 hover:border-slate-700/50 border border-transparent'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0B0F19]/85 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0B0F19]/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & Home Link */}
          <Link
            to="/"
            className="flex items-center space-x-3 group shrink-0"
            aria-label="SkillGraph home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition-transform duration-200">
              <Network className="w-6 h-6 text-white" strokeWidth={2.2} />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  SkillGraph
                </span>
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 rounded-md">
                  CognoDB
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">Graph Knowledge Engine</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1.5">
            <Link to="/" className={navLinkClass(isHome)}>
              <Compass className="w-4 h-4" />
              <span className="hidden sm:inline">Explore</span>
              <span className="sm:hidden">Explore</span>
            </Link>

            <Link to="/developers" className={navLinkClass(isDevPage)}>
              <Users className="w-4 h-4" />
              <span className="hidden md:inline">Developers</span>
            </Link>

            <Link to="/skills" className={navLinkClass(isSkillPage)}>
              <Code2 className="w-4 h-4" />
              <span className="hidden md:inline">Skills</span>
            </Link>
          </nav>

          {/* Status Pill & Seed Action */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Database Status Indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                isConnected
                  ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
                  : 'bg-amber-950/40 border-amber-800/40 text-amber-400'
              }`}
              title={
                isConnected
                  ? 'CognoDB graph database is connected and responding'
                  : health?.error || 'Backend API is unreachable'
              }
            >
              <span
                className={`relative w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              >
                {isConnected && (
                  <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
                )}
              </span>
              <span className="hidden sm:inline font-semibold">
                {isConnected ? 'Online' : 'Standby'}
              </span>
            </div>

            {/* Seed Database Button */}
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 hover:border-slate-600 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
              title="Reset and populate CognoDB with realistic developer, skill, company, and project data"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin text-emerald-400' : 'text-slate-400'}`}
              />
              <span className="hidden sm:inline">{isSeeding ? 'Seeding…' : 'Seed DB'}</span>
            </button>
          </div>
        </div>

        {seedNotice && (
          <div className="py-2 px-3 text-xs bg-slate-800/95 text-center text-slate-200 border-t border-slate-700/60 font-medium">
            {seedNotice}
          </div>
        )}
      </div>
    </header>
  );
};
