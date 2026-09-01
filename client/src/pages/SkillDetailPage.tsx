import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { SkillDetail, SkillDeveloper, GraphOverviewData } from '../types';
import { SkillBadge } from '../components/common/SkillBadge';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { InteractiveGraph } from '../components/graph/InteractiveGraph';
import {
  Code2,
  Users,
  FolderGit2,
  ArrowLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Award,
  Network,
  Workflow,
  User,
  TrendingUp,
  Clock,
  GitBranch,
  Link2,
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

  const localGraph: GraphOverviewData = useMemo(() => {
    if (!skill) return { nodes: [], links: [] };
    const nodes: Array<{ id: string; name: string; type: string; category?: string; difficulty?: string; color?: string }> = [];
    const links: Array<{ source: string; target: string; type: string; label?: string }> = [];

    const skillId = `skill:${skill.name}`;
    nodes.push({
      id: skillId,
      name: skill.name,
      type: 'Skill',
      category: skill.category,
      difficulty: skill.difficulty,
    });

    (skill.directPrerequisites || []).forEach((prereq) => {
      const pId = 'skill:' + prereq;
      if (!nodes.find((n) => n.id === pId)) {
        nodes.push({ id: pId, name: prereq, type: 'Skill' });
      }
      links.push({ source: skillId, target: pId, type: 'REQUIRES', label: 'Prerequisite' });
    });

    (skill.relatedSkills || []).forEach((rel) => {
      const rId = 'skill:' + rel.name;
      if (!nodes.find((n) => n.id === rId)) {
        nodes.push({
          id: rId,
          name: rel.name,
          type: 'Skill',
          category: rel.category,
        });
      }
      links.push({
        source: skillId,
        target: rId,
        type: 'RELATED_TO',
        label: rel.strength ? `${Math.round(rel.strength * 100)}% match` : 'Related',
      });
    });

    developers.slice(0, 4).forEach((dev) => {
      const dId = 'dev:' + dev.name;
      if (!nodes.find((n) => n.id === dId)) {
        nodes.push({ id: dId, name: dev.name, type: 'Developer' });
      }
      links.push({
        source: dId,
        target: skillId,
        type: 'KNOWS_SKILL',
        label: dev.proficiencyLevel,
      });
    });

    return { nodes, links };
  }, [skill, developers]);

  if (loading) {
    return <LoadingState message={`Resolving topology for ${name}...`} size="lg" />;
  }

  if (error || !skill) {
    return (
      <div className="space-y-6">
        <Link
          to="/skills"
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Skills
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
    <div className="space-y-8 sm:space-y-10">
      <div>
        <Link
          to="/skills"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-blue-400 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to All Skills
        </Link>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/30 rounded-3xl blur-xl opacity-60" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-2xl shadow-blue-950/50 ring-1 ring-white/10">
                <Code2 className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {skill.name}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm mt-2">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-full border border-slate-700 font-semibold">
                  <Layers className="w-3 h-3 text-slate-400" />
                  {skill.category}
                </span>
                {skill.difficulty && (
                  <span
                    className={`flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                      skill.difficulty === 'Beginner'
                        ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
                        : skill.difficulty === 'Intermediate'
                        ? 'bg-blue-950/40 border-blue-800/40 text-blue-400'
                        : 'bg-purple-950/40 border-purple-800/40 text-purple-400'
                    }`}
                  >
                    <TrendingUp className="w-3 h-3" />
                    {skill.difficulty} Level
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-5 bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
              <div className="text-center">
                <span className="block text-2xl font-extrabold text-emerald-400">
                  {developers.length}
                </span>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1 justify-center">
                  <Users className="w-3 h-3" /> Developers
                </span>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div className="text-center">
                <span className="block text-2xl font-extrabold text-blue-400">
                  {skill.projectsCount || 0}
                </span>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1 justify-center">
                  <FolderGit2 className="w-3 h-3" /> Projects
                </span>
              </div>
            </div>
          </div>
        </div>

        {skill.description && (
          <div className="pt-4 border-t border-slate-800/60">
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-4xl">
              {skill.description}
            </p>
          </div>
        )}
      </div>

      <section className="space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-blue-400" />
              Skill Graph Context
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Prerequisites, related ecosystem skills, and developers verified with this competency
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-950/40 border border-blue-800/40 text-blue-400 text-[10px] font-bold">
            <Workflow className="w-3 h-3" />
            Graph Ecosystem
          </span>
        </div>
        <InteractiveGraph
          data={localGraph}
          height={380}
          title={`${skill.name} Ecosystem`}
          focusNodeId={`skill:${skill.name}`}
        />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-amber-400" />
                Direct Prerequisites
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Required foundational skills ({skill.directPrerequisites?.length || 0})
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/30 text-amber-400 border border-amber-800/30">
              [REQUIRES]
            </span>
          </div>

          {skill.directPrerequisites && skill.directPrerequisites.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {skill.directPrerequisites.map((prereq) => (
                <SkillBadge key={prereq} name={prereq} size="md" />
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/40">
              <p className="text-xs text-slate-400">
                <Sparkles className="w-4 h-4 text-emerald-400 inline mr-2 -mt-0.5" />
                No foundational prerequisites. You can begin learning directly!
              </p>
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Link2 className="w-5 h-5 text-purple-400" />
                Related Ecosystem
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Lateral skill adjacencies ({skill.relatedSkills?.length || 0})
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950/30 text-purple-400 border border-purple-800/30">
              [RELATED_TO]
            </span>
          </div>

          {skill.relatedSkills && skill.relatedSkills.length > 0 ? (
            <div className="space-y-2 pt-1">
              {skill.relatedSkills.map((rel) => (
                <div
                  key={rel.name}
                  className="p-3 rounded-2xl bg-slate-800/30 border border-slate-700/50 flex items-center justify-between gap-3 hover:border-purple-500/40 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-purple-950/40 border border-purple-800/40 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/skills/${encodeURIComponent(rel.name)}`}
                        className="text-sm font-bold text-slate-100 group-hover:text-purple-400 transition-colors flex items-center gap-1 truncate"
                      >
                        {rel.name}
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition shrink-0" />
                      </Link>
                      <p className="text-[10px] text-slate-500 truncate">{rel.category}</p>
                    </div>
                  </div>
                  {rel.strength !== undefined && (
                    <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded-full border border-purple-800/40 shrink-0">
                      {Math.round(rel.strength * 100)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-2">No direct lateral relationships mapped.</p>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur shadow-xl space-y-5">
        <div className="flex items-start justify-between pb-3 border-b border-slate-800/60 flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              Developers with Verified Proficiency in {skill.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Engineers possessing direct mastery or who deployed {skill.name} in production ({developers.length} total)
            </p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-950/50 text-emerald-300 border border-emerald-800/50 rounded-full">
            <Users className="w-3 h-3" />
            <span className="text-[11px] font-bold">Verified Talent</span>
          </div>
        </div>

        {developers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-slate-500 italic">No developers currently possess this skill in the graph.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {developers.map((dev, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3 group hover:shadow-lg hover:shadow-emerald-950/10"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/developers/${encodeURIComponent(dev.name)}`}
                          className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors flex items-center gap-1 truncate"
                        >
                          {dev.name}
                          <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition shrink-0" />
                        </Link>
                        <p className="text-[11px] text-slate-400 truncate">
                          {dev.role} {dev.company ? `• ${dev.company}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {dev.proficiencyLevel && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-800/50">
                          {dev.proficiencyLevel}
                        </span>
                      )}
                      {dev.yearsWithSkill !== undefined && dev.yearsWithSkill !== null && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 justify-end">
                          <Clock className="w-3 h-3" />
                          {dev.yearsWithSkill}y
                        </div>
                      )}
                    </div>
                  </div>

                  {dev.projectsUsedIn && dev.projectsUsedIn.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-800/50">
                      <span className="text-[10px] uppercase font-bold tracking-wider block mb-1.5 text-slate-500">
                        Applied in {dev.projectsUsedIn.length} project{dev.projectsUsedIn.length === 1 ? '' : 's'}:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {dev.projectsUsedIn.slice(0, 3).map((proj) => (
                          <span
                            key={proj}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-700/40 text-slate-300 border border-slate-600/40 truncate max-w-[140px]"
                            title={proj}
                          >
                            {proj}
                          </span>
                        ))}
                        {dev.projectsUsedIn.length > 3 && (
                          <span className="text-[10px] text-slate-500 px-1.5 py-0.5">
                            +{dev.projectsUsedIn.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
