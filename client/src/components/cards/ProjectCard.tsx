import React from 'react';
import { FolderGit2, Layers } from 'lucide-react';
import { SkillBadge } from '../common/SkillBadge';

interface ProjectCardProps {
  name: string;
  description?: string;
  roleOnProject?: string;
  status?: string;
  skillsUsed?: string[];
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  name,
  description,
  roleOnProject,
  status,
  skillsUsed,
}) => {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/50 transition-all shadow-lg backdrop-blur space-y-3 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-100">{name}</h4>
              {roleOnProject && (
                <span className="text-xs text-blue-400 font-medium">{roleOnProject}</span>
              )}
            </div>
          </div>

          {status && (
            <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {status}
            </span>
          )}
        </div>

        {description && (
          <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">{description}</p>
        )}
      </div>

      {skillsUsed && skillsUsed.length > 0 && (
        <div className="pt-3 border-t border-slate-800/80">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5 flex items-center gap-1">
            <Layers className="w-3 h-3 text-blue-400" />
            Technologies Used
          </span>
          <div className="flex flex-wrap gap-1.5">
            {skillsUsed.map((skillName) => (
              <SkillBadge key={skillName} name={skillName} size="sm" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

