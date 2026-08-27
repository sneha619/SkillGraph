import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import {
  DeveloperDetail,
  RelatedDeveloper,
  DeveloperProjectSkillTraversal,
} from '../types';
import { SkillBadge } from '../components/common/SkillBadge';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
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

  if (loading) {
    return <LoadingState message={`Traversing CognoDB graph for ${name}...`} size="lg" />;
  }

  if (error || !developer) {
    return (
      <div className="space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Graph Search
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
    <div className="space-y-10">
      {/* Back navigation */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Graph Search
        </Link>
      </div>

      {/* Developer Profile Card */}
      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-950/50">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {developer.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-400 mt-1">
                {developer.role && (
                  <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                    <Briefcase className="w-4 h-4 text-emerald-400" />
                    {developer.role}
                  </span>
                )}
                {developer.company && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      {developer.company}
                    </span>
                  </>
                )}
                {developer.experienceYears !== undefined && (
                  <>
                    <span>•</span>
                    <span>{developer.experienceYears} Years Experience</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {developer.email && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-300">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>{developer.email}</span>
            </div>
          )}
        </div>

        {developer.bio && (
          <p className="text-sm text-slate-300 leading-relaxed max-w-4xl pt-2 border-t border-slate-800">
            {developer.bio}
          </p>
        )}
      </div>

      {/* 2-Column Layout: Verified Skills & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Verified Skills */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              Verified Competencies ({developer.skills?.length || 0})
            </h3>
            <span className="text-xs text-slate-400">Click to explore topology</span>
          </div>

          {developer.skills && developer.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {developer.skills.map((skill) => (
                <SkillBadge
                  key={skill.name}
                  name={skill.name}
                  proficiency={skill.proficiency}
                  size="md"
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No skills registered yet.</p>
          )}
        </div>

        {/* Projects Contributed To */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-blue-400" />
              Projects & Contributions ({developer.projects?.length || 0})
            </h3>
            <span className="text-xs text-slate-400">Production Deployments</span>
          </div>

          {developer.projects && developer.projects.length > 0 ? (
            <div className="space-y-4 pt-2">
              {developer.projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-bold text-slate-100">{proj.name}</h4>
                    {proj.roleOnProject && (
                      <span className="text-xs font-semibold text-blue-400 bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-800/40">
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

      {/* Multi-Hop Traversal: Developer -> Project -> Skills -> Prerequisites */}
      {traversals.length > 0 && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GitFork className="w-5 h-5 text-purple-400" />
                Multi-Hop Project Skill Dependencies
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Demonstrates deep graph traversal: <code>(:Developer)-[:WORKED_ON]-&gt;(:Project)-[:USES_SKILL]-&gt;(:Skill)-[:REQUIRES*]-&gt;(:Prerequisite)</code>
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-purple-950/50 text-purple-300 border border-purple-800/50 rounded-full">
              Multi-Hop Traversal
            </span>
          </div>

          <div className="space-y-4">
            {traversals.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">Project:</span>
                  <span className="text-sm font-bold text-emerald-400">{item.project.name}</span>
                  <span className="text-xs text-slate-500">({item.project.roleOnProject})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {item.skillsUsed.map((sk, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <Link
                          to={`/skills/${encodeURIComponent(sk.name)}`}
                          className="text-xs font-bold text-slate-200 hover:text-emerald-400"
                        >
                          {sk.name}
                        </Link>
                        <span className="text-[10px] text-slate-400">{sk.difficulty}</span>
                      </div>

                      {sk.prerequisites.length > 0 ? (
                        <div className="text-[10px] text-slate-400">
                          <span className="text-slate-500">Prereqs:</span> {sk.prerequisites.join(' → ')}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">No foundational prereq</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Developers via Shared Skills */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Collaborative Graph: Related Developers
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Engineers sharing overlapping skillsets in CognoDB (ranked by Jaccard similarity index)
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-950/50 text-emerald-300 border border-emerald-800/50 rounded-full">
            Co-occurrence Filtering
          </span>
        </div>

        {relatedDevelopers.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No overlapping developer profiles found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedDevelopers.map((rel, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        to={`/developers/${encodeURIComponent(rel.developerName)}`}
                        className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition flex items-center gap-1"
                      >
                        {rel.developerName}
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
                      </Link>
                      <p className="text-xs text-slate-400">
                        {rel.role} • {rel.company}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-800/50">
                        {Math.round(rel.jaccardSimilarity * 100)}% Match
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">
                      {rel.sharedSkillsCount} Shared Skills:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {rel.sharedSkills.map((sk) => (
                        <SkillBadge key={sk} name={sk} size="sm" />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-right">
                  <Link
                    to={`/developers/${encodeURIComponent(rel.developerName)}`}
                    className="text-xs font-semibold text-slate-400 group-hover:text-emerald-400 transition"
                  >
                    View Full Graph Profile →
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

