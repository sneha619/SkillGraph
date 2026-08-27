import React from 'react';
import { Building2, MapPin } from 'lucide-react';

interface CompanyCardProps {
  name: string;
  industry?: string;
  location?: string;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ name, industry, location }) => {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/50 transition-all shadow-lg backdrop-blur space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-purple-400">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-base font-bold text-slate-100">{name}</h4>
          {industry && <span className="text-xs text-purple-300 font-medium">{industry}</span>}
        </div>
      </div>

      {location && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span>{location}</span>
        </div>
      )}
    </div>
  );
};

