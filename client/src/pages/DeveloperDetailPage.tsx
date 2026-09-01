import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import {
  DeveloperDetail,
  RelatedDeveloper,
  DeveloperProjectSkillTraversal,
  GraphOverviewData,
} from '../types';
import { SkillBadge } from '../components/common/SkillBadge';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { InteractiveGraph } from '../components/graph/InteractiveGraph';
import {
  User,
  Building2,
  Briefcase,
  Mail,
  Award,
  FolderGit2,
  Users,
  ArrowLeft,
  ChevronRight,
  GitFork,
  Sparkles,
  Network,
  TrendingUp,
  Clock,
  Star,
  Workflow,
} from 'lucide-react';

export const DeveloperDetailPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();

  const [developer, setDeveloper] = useState<DeveloperDetail | null>(null);
  const [relatedDevelopers, setRelatedDevelopers] = useState<RelatedDeveloper[]>([]);
  const [traversals, setTraversals] = useState<DeveloperProjectSkillTraversal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDeveloperData = async () => {
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      const [devData, relatedData, traversalData] = await Promise.all([
        api.getDeveloper(name),
        api.getRelatedDevelopers(name),
        api.getDeveloperProjectSkills(name),
      ]);
      setDeveloper(devData);
      setRelatedDevelopers(relatedData);
      setTraversals(traversalData);
    } catch (err: any) {
      setError(err.message || `Failed to fetch developer details for '${name}'`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeveloperData();
  }, [name]);

  const localGraph: GraphOverviewData = useMemo(() => {
    if (!developer) return { nodes: [], links: [] };
    const nodes: Array<{ id: string; name: string; type: string; category?: string; difficulty?: string; color?: string }> = [];
    const links: Array<{ source: string; target: string; type: string; label?: string }> = [];

    const devId = `dev:${developer.name}`;
    nodes.push({ id: devId, name: developer.name, type: 'Developer' });

    if (developer.company) {
      const compId = 'comp:' + developer.company;
      nodes.push({ id: compId, name: developer.company, type: 'Company' });
      links.push({ source: devId, target: compId, type: 'WORKS_AT', label: 'Works At' });
    }

    (developer.skills || []).forEach((s) => {
      const skId = 'skill:' + s.name;
      if (!nodes.find((n) => n.id === skId)) {
        nodes.push({
          id: skId,
          name: s.name,
          type: 'Skill',
          category: s.category,
          difficulty: s.proficiency,
        });
      }
      links.push({ source: devId, target: skId, type: 'KNOWS_SKILL', label: s.proficiency });
    });

    (developer.projects || []).forEach((p) => {
      const pId = 'proj:' + p.name;
      if (!nodes.find((n) => n.id === pId)) {
        nodes.push({ id: pId, name: p.name, type: 'Project' });
      }
      links.push({ source: devId, target: pId, type: 'WORKED_ON', label: p.roleOnProject });
      (p.skillsUsed || []).forEach((skName) => {
        const skId = 'skill:' + skName;
        if (!nodes.find((n) => n.id === skId)) {
          nodes.push({ id: skId, name: skName, type: 'Skill' });
        }
        links.push({ source: pId, target: skId, type: 'USES_SKILL' });
      });
    });

    relatedDevelopers.slice(0, 3).forEach((r) => {
      const rdId = 'dev:' + r.developerName;
      if (!nodes.find((n) => n.id === rdId)) {
        nodes.push({ id: rdId, name: r.developerName, type: 'Developer' });
      }
      links.push({ source: devId, target: rdId, type: 'RELATED_TO', label: 'Related' });
    });

    return { nodes, links };
  }, [developer, relatedDevelopers]);

  if (loading) {
    return <LoadingState message={`Loading profile for ${name}...`} size="lg" />;
  }

  if (error || !developer) {
    return (
      <div className="space-y-6">
        <Link
          to="/developers"
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Developers
        </Link>
        <ErrorState
          title="Developer Not Found"
          message={error || `Could not find developer '${name}' in the CognoDB database.`}
          onRetry={loadDeveloperData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <div>
        <Link
          to="/developers"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to All Developers
        </Link>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-emerald-600/10 via-transparent to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/30 rounded-3xl blur-xl opacity-60" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-2xl shadow-emerald-950/50 ring-1 ring-white/10">
                <User className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {developer.name}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm mt-2">
                {developer.role && (
                  <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                    <Briefcase className="w-4 h-4 text-emerald-400" />
                    {developer.role}
                  </span>
                )}
                {developer.role && developer.company ? <span className="text-slate-600">•</span> : null}
                {developer.company ? (
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    {developer.company}
                  </span>
                ) : null}
                {developer.experienceYears !== undefined && developer.experienceYears !== null ? (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {developer.experienceYears} yrs exp
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {developer.email && (
              <a
                href={`mailto:${developer.email}`}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-slate-300 hover:bg-slate-700/80 hover:border-slate-600 transition-all"
              >
                <Mail className="w-4 h-4 text-emerald-400" />
                <span className="font-medium">{developer.email}</span>
              </a>
            )}
            <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-950/40 border border-emerald-800/40 rounded-xl">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">
                {developer.skills?.length || 0} Verified Skills
              </span>
            </div>
          </div>
        </div>

        {developer.bio && (
          <div className="pt-4 border-t border-slate-800/60">
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-4xl">
              {developer.bio}
            </p>
          </div>
        )}
      </div>

      <section className="space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-emerald-400" />
              Graph Context View
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Immediate connections: skills, projects, and related developers in the knowledge graph
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-[10px] font-bold">
            <Workflow className="w-3 h-3" />
            Graph Traversal
          </span>
        </div>
        <InteractiveGraph
          data={localGraph}
          height={380}
          title={`${developer.name}'s Network`}
          focusNodeId={`dev:${developer.name}`}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8">
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                Verified Competencies
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ranked by mastery across {developer.skills?.length || 0} graph-verified skills
              </p>
            </div>
          </div>

          {developer.skills && developer.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {developer.skills.map((skill) => (
                <SkillBadge
                  key={skill.name}
                  name={skill.name}
                  proficiency={skill.proficiency}
                  yearsOfExperience={skill.yearsOfExperience}
                  size="md"
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No skills registered yet.</p>
          )}
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-blue-400" />
                Projects & Contributions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {developer.projects?.length || 0} production deployments contributed
              </p>
            </div>
          </div>

          {developer.projects && developer.projects.length > 0 ? (
            <div className="space-y-3 pt-2">
              {developer.projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2.5 hover:border-blue-500/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-100">{proj.name}</h4>
                    {proj.roleOnProject && (
                      <span className="text-xs font-semibold text-blue-400 bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-800/40 shrink-0">
                        {proj.roleOnProject}
                      </span>
                    )}
                  </div>
                  {proj.description && (
                    <p className="text-xs text-slate-300 leading-relaxed">{proj.description}</p>
                  )}
                  {proj.skillsUsed && proj.skillsUsed.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {proj.skillsUsed.map((sk) => (
                        <SkillBadge key={sk} name={sk} size="sm" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No projects recorded.</p>
          )}
        </div>
      </div>

      {traversals.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur shadow-xl space-y-5">
          <div className="flex items-start justify-between pb-3 border-b border-slate-800/60 flex-wrap gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GitFork className="w-5 h-5 text-purple-400" />
                Project Skill Dependencies
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-hop traversal: <code className="text-[11px]">Developer → Project → Skill → Prerequisite</code>
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-purple-950/50 text-purple-300 border border-purple-800/50 rounded-full">
              {traversals.length} Projects
            </span>
          </div>

          <div className="space-y-4">
            {traversals.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Project:</span>
                  <span className="text-sm font-bold text-emerald-400">{item.project.name}</span>
                  <span className="text-[11px] text-slate-500">•</span>
                  <span className="text-xs text-slate-400">({item.project.roleOnProject})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {item.skillsUsed.map((sk, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <Link
                          to={`/skills/${encodeURIComponent(sk.name)}`}
                          className="text-xs font-bold text-slate-200 hover:text-emerald-400 transition-colors flex items-center gap-1"
                        >
                          {sk.name}
                          <ChevronRight className="w-3 h-3 opacity-0 hover:opacity-100 transition" />
                        </Link>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">
                          {sk.difficulty}
                        </span>
                      </div>

                      {sk.prerequisites && sk.prerequisites.length > 0 ? (
                        <div className="text-[10px] leading-snug">
                          <span className="text-slate-500 font-semibold uppercase tracking-wider">
                            Prereq chain:{' '}
                          </span>
                          <span className="text-slate-400">{sk.prerequisites.join(' → ')}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">
                          No foundational prerequisites
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur shadow-xl space-y-5">
        <div className="flex items-start justify-between pb-3 border-b border-slate-800/60 flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Collaborative Graph: Related Developers
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Engineers sharing overlapping skillsets — ranked by Jaccard similarity
            </p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-950/50 text-emerald-300 border border-emerald-800/50 rounded-full">
            <Star className="w-3 h-3" />
            <span className="text-[11px] font-bold">
              {relatedDevelopers.length} Match{relatedDevelopers.length === 1 ? '' : 'es'}
            </span>
          </div>
        </div>

        {relatedDevelopers.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-6 text-center">
            No overlapping developer profiles found.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedDevelopers.map((rel, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3 group hover:shadow-lg hover:shadow-emerald-950/10"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <Link
                          to={`/developers/${encodeURIComponent(rel.developerName)}`}
                          className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition-colors flex items-center gap-1"
                        >
                          {rel.developerName}
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
                        </Link>
                        <p className="text-xs text-slate-400">
                          {rel.role} • {rel.company}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-800/50">
                        {Math.round(rel.jaccardSimilarity * 100)}%
                      </span>
                      <p className="text-[9px] uppercase font-bold tracking-wider text-slate-500 mt-0.5">
                        Match
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/50">
                    <span className="text-[10px] uppercase font-bold tracking-wider block mb-2 text-slate-500">
                      {rel.sharedSkillsCount} Shared Skills:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {rel.sharedSkills.map((sk) => (
                        <SkillBadge key={sk} name={sk} size="sm" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
