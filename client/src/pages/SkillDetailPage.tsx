import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { SkillDetail, SkillDeveloper } from '../types';
import { SkillBadge } from '../components/common/SkillBadge';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import {
  Code2,
  Users,
  FolderGit2,
  ArrowLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Award,
} from 'lucide-react';

export const SkillDetailPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();

  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [developers, setDevelopers] = useState<SkillDeveloper[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSkillData = async () => {
    if (!name) return;

    setLoading(true);
    setError(null);
    try {
      const [skillData, devData] = await Promise.all([
        api.getSkill(name),
        api.getSkillDevelopers(name),
      ]);

      setSkill(skillData);
      setDevelopers(devData);
    } catch (err: any) {
      setError(err.message || `Failed to fetch skill details for '${name}'`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkillData();
  }, [name]);

  if (loading) {
    return <LoadingState message={`Resolving topology for ${name}...`} size="lg" />;
  }

  if (error || !skill) {
    return (
      <div className="space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Graph Search
        </Link>
        <ErrorState
          title="Skill Not Found"
          message={error || `Could not find skill '${name}' in the CognoDB database.`}
          onRetry={loadSkillData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Back Navigation */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Graph Search
        </Link>
      </div>

      {/* Skill Header Card */}
      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-blue-950/50">
              <Code2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {skill.name}
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                  {skill.category}
                </span>
                {skill.difficulty && (
                  <span
                    className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                      skill.difficulty === 'Beginner'
                        ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
                        : skill.difficulty === 'Intermediate'
                        ? 'bg-blue-950/40 border-blue-800/40 text-blue-400'
                        : 'bg-purple-950/40 border-purple-800/40 text-purple-400'
                    }`}
                  >
                    {skill.difficulty} Level
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Domain: <strong>{skill.category}</strong> • Graph Entity in CognoDB
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-6 text-center bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
            <div>
              <span className="block text-2xl font-extrabold text-emerald-400">
                {developers.length}
              </span>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1 justify-center">
                <Users className="w-3 h-3" /> Developers
              </span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <span className="block text-2xl font-extrabold text-blue-400">
                {skill.projectsCount || 0}
              </span>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1 justify-center">
                <FolderGit2 className="w-3 h-3" /> Projects
              </span>
            </div>
          </div>
        </div>

        {skill.description && (
          <p className="text-sm text-slate-300 leading-relaxed max-w-4xl pt-2 border-t border-slate-800">
            {skill.description}
          </p>
        )}
      </div>

      {/* 2-Column Split: Prerequisites & Related Ecosystem */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Prerequisites */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              Direct Prerequisites ({skill.directPrerequisites?.length || 0})
            </h3>
            <span className="text-xs text-slate-400">[:REQUIRES]</span>
          </div>

          {skill.directPrerequisites && skill.directPrerequisites.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {skill.directPrerequisites.map((prereq) => (
                <SkillBadge key={prereq} name={prereq} size="md" />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              No foundational prerequisites. You can begin learning directly!
            </p>
          )}
        </div>

        {/* Related Skills */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Related Ecosystem Technologies ({skill.relatedSkills?.length || 0})
            </h3>
            <span className="text-xs text-slate-400">[:RELATED_TO]</span>
          </div>

          {skill.relatedSkills && skill.relatedSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {skill.relatedSkills.map((rel) => (
                <SkillBadge key={rel.name} name={rel.name} size="md" />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No direct lateral relationships mapped.</p>
          )}
        </div>
      </div>

      {/* Developers Possessing or Applying This Skill */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              Developers with Proficiency in {skill.name} ({developers.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Engineers possessing direct proficiency or who deployed {skill.name} in production projects
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-950/50 text-emerald-300 border border-emerald-800/50 rounded-full">
            Verified Talent
          </span>
        </div>

        {developers.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No developers currently possess this skill in the graph.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {developers.map((dev, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        to={`/developers/${encodeURIComponent(dev.name)}`}
                        className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition flex items-center gap-1"
                      >
                        {dev.name}
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
                      </Link>
                      <p className="text-xs text-slate-400">
                        {dev.role} • {dev.company}
                      </p>
                    </div>

                    {dev.proficiencyLevel && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-950/50 text-emerald-300 border border-emerald-800/50">
                        {dev.proficiencyLevel}
                      </span>
                    )}
                  </div>

                  {dev.projectsUsedIn && dev.projectsUsedIn.length > 0 && (
                    <div className="mt-3 text-xs text-slate-400">
                      <span className="text-slate-500 font-medium">Applied In:</span>{' '}
                      <span className="text-slate-300">{dev.projectsUsedIn.join(', ')}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 text-right">
                  <Link
                    to={`/developers/${encodeURIComponent(dev.name)}`}
                    className="text-xs font-semibold text-slate-400 group-hover:text-emerald-400 transition"
                  >
                    View Developer Profile →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

