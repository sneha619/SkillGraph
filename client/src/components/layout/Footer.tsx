import React from 'react';
import { Network, Database, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#0B0F19] text-slate-400 py-8 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Network className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-300">SkillGraph</span>
          <span>•</span>
          <span>Wexa AI CognoDB Graph Database Take-Home Project</span>
        </div>

        <div className="flex items-center space-x-4 text-slate-500">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            CognoDB Bolt Protocol
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            Parameterized Cypher
          </span>
        </div>
      </div>
    </footer>
  );
};
