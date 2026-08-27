import React from 'react';
import { Link } from 'react-router-dom';
import { User, Briefcase, Building2, ChevronRight, Award } from 'lucide-react';
import { SkillBadge } from '../common/SkillBadge';

interface DeveloperCardProps {
  name: string;
  role?: string;
  company?: string;
  experienceYears?: number;
  skills?: Array<{ name: string; proficiency?: 'Beginner' | 'Intermediate' | 'Expert' }>;
  bio?: string;
}

export const DeveloperCard: React.FC<DeveloperCardProps> = ({
  name,
  role,
  company,
  experienceYears,
  skills,
  bio,
}) => {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/50 transition-all shadow-lg hover:shadow-emerald-950/20 backdrop-blur group flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
              <User className="w-5 h-5" />
            </div>
            <div>
              <Link
                to={`/developers/${encodeURIComponent(name)}`}
                className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition flex items-center gap-1"
              >
                {name}
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
              </Link>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                {role && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-slate-500" />
                    {role}
                  </span>
                )}
                {company && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-500" />
                      {company}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {experienceYears !== undefined && (
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-800 text-slate-300 rounded-full border border-slate-700 shrink-0">
              {experienceYears}y exp
            </span>
          )}
        </div>

        {bio && <p className="text-xs text-slate-300 mt-3 leading-relaxed line-clamp-2">{bio}</p>}
      </div>

      {skills && skills.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2 flex items-center gap-1">
            <Award className="w-3 h-3 text-emerald-400" />
            Verified Skills
          </span>
          <div className="flex flex-wrap gap-1.5">
            {skills.slice(0, 5).map((s) => (
              <SkillBadge
                key={s.name}
                name={s.name}
                proficiency={s.proficiency}
                size="sm"
              />
            ))}
            {skills.length > 5 && (
              <span className="px-2 py-0.5 text-[11px] text-slate-500 self-center">
                +{skills.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

