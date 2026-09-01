import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import {
  SearchResult,
  DeveloperListItem,
  SkillListItem,
  CompanyItem,
  ProjectItem,
  GraphOverviewData,
} from '../types';
import { SearchBar } from '../components/common/SearchBar';
import { DeveloperCard } from '../components/cards/DeveloperCard';
import { ProjectCard } from '../components/cards/ProjectCard';
import { CompanyCard } from '../components/cards/CompanyCard';
import { SkillBadge } from '../components/common/SkillBadge';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { InteractiveGraph } from '../components/graph/InteractiveGraph';
import {
  Network,
  Users,
  Code2,
  FolderGit2,
  Building2,
  Sparkles,
  TrendingUp,
  Compass,
  SearchX,
  ChevronRight,
  Star,
  Shuffle,
  Database,
  GitBranch,
} from 'lucide-react';

type TabKey = 'ALL' | 'DEVELOPER' | 'SKILL' | 'PROJECT' | 'COMPANY';

const TAB_CONFIG: Array<{ key: TabKey; label: string; icon: React.ReactNode; type?: string }> = [
  { key: 'ALL', label: 'All', icon: <SearchX className="w-3.5 h-3.5" /> },
  { key: 'DEVELOPER', label: 'Developers', icon: <Users className="w-3.5 h-3.5" />, type: 'Developer' },
  { key: 'SKILL', label: 'Skills', icon: <Code2 className="w-3.5 h-3.5" />, type: 'Skill' },
  { key: 'PROJECT', label: 'Projects', icon: <FolderGit2 className="w-3.5 h-3.5" />, type: 'Project' },
  { key: 'COMPANY', label: 'Companies', icon: <Building2 className="w-3.5 h-3.5" />, type: 'Company' },
];

export const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const hasQuery = queryParam.trim().length > 0;

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<TabKey>('ALL');

  const [developers, setDevelopers] = useState<DeveloperListItem[]>([]);
  const [skills, setSkills] = useState<SkillListItem[]>([]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [graphData, setGraphData] = useState<GraphOverviewData>({ nodes: [], links: [] });
  const [dashboardLoading, setDashboardLoading] = useState<boolean>(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const executeSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    try {
      const data = await api.search(searchTerm.trim());
      setSearchResults(data);
    } catch (err: any) {
      setSearchError(err.message || 'Failed to execute graph search');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const [devs, sks, comps, projs, graph] = await Promise.all([
        api.listDevelopers().catch(() => []),
        api.listSkills().catch(() => []),
        api.listCompanies().catch(() => []),
        api.listProjects().catch(() => []),
        api.getGraphOverview().catch(() => ({ nodes: [], links: [] })),
      ]);
      setDevelopers(devs);
      setSkills(sks);
      setCompanies(comps);
      setProjects(projs);
      setGraphData(graph);
    } catch (err: any) {
      setDashboardError(err.message || 'Failed to load exploration data');
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (hasQuery) {
      executeSearch(queryParam);
    } else {
      setSearchResults([]);
      setSearchError(null);
      setSearchLoading(false);
    }
  }, [queryParam, hasQuery, executeSearch]);

  const handleSearchSubmit = (term: string) => {
    const trimmed = term.trim();
    if (trimmed) {
      setSearchParams({ q: trimmed });
    } else {
      setSearchParams({});
      setSearchResults([]);
      setActiveFilter('ALL');
    }
  };

  const developerResults = useMemo(
    () => searchResults.filter((r) => r.type === 'Developer'),
    [searchResults]
  );
  const skillResults = useMemo(() => searchResults.filter((r) => r.type === 'Skill'), [searchResults]);
  const projectResults = useMemo(
    () => searchResults.filter((r) => r.type === 'Project'),
    [searchResults]
  );
  const companyResults = useMemo(
    () => searchResults.filter((r) => r.type === 'Company'),
    [searchResults]
  );

  const filteredResults = useMemo(() => {
    if (activeFilter === 'ALL') return searchResults;
    const tab = TAB_CONFIG.find((t) => t.key === activeFilter);
    if (!tab?.type) return searchResults;
    return searchResults.filter((r) => r.type === tab.type);
  }, [activeFilter, searchResults]);

  const popularSkills = useMemo(
    () => [...skills].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 12),
    [skills]
  );
  const featuredDevelopers = useMemo(
    () => [...developers].sort((a, b) => b.experienceYears - a.experienceYears).slice(0, 3),
    [developers]
  );
  const featuredProjects = useMemo(() => projects.slice(0, 3), [projects]);
  const featuredCompanies = useMemo(
    () => [...companies].sort((a, b) => (b.employeesCount || 0) - (a.employeesCount || 0)).slice(0, 4),
    [companies]
  );

  const skillCategories = useMemo(() => {
    const cats = new Map<string, SkillListItem[]>();
    for (const s of skills) {
      if (!cats.has(s.category)) cats.set(s.category, []);
      cats.get(s.category)!.push(s);
    }
    return Array.from(cats.entries());
  }, [skills]);

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Hero Header */}
      <div className="text-center max-w-4xl mx-auto space-y-5 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-semibold shadow-lg shadow-emerald-950/20">
          <Sparkles className="w-3.5 h-3.5" />
          Graph-Powered Developer Knowledge Engine
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
          Explore Connected{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            Developer Talent
          </span>{' '}
          &amp; Technology Paths
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Navigate developers, skills, companies, and project dependencies as an interconnected
          property graph. Discover relationships, prerequisites, and career pathways powered by CognoDB.
        </p>

        <div className="pt-1">
          <SearchBar
            initialValue={queryParam || ''}
            onSearch={handleSearchSubmit}
            isLoading={searchLoading}
          />
        </div>
      </div>

      {/* Error View */}
      {searchError && (
        <ErrorState
          title="Search Failed"
          message={searchError}
          onRetry={() => executeSearch(queryParam)}
        />
      )}

      {!searchError &&
        (hasQuery ? (
          /* ====================== SEARCH RESULTS VIEW ====================== */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filter Tabs - Always visible */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1">
                {TAB_CONFIG.map((tab) => {
                  const count =
                    tab.key === 'ALL'
                      ? searchResults.length
                      : tab.type
                      ? searchResults.filter((r) => r.type === tab.type).length
                      : 0;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveFilter(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-150 ${
                        activeFilter === tab.key
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 scale-[1.02]'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                      <span
                        className={`px-1.5 py-px rounded-md text-[10px] font-bold ${
                          activeFilter === tab.key
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <span className="text-xs text-slate-500 font-medium">
                {searchLoading
                  ? 'Searching graph entities...'
                  : `Found ${filteredResults.length} result${filteredResults.length === 1 ? '' : 's'}${
                      activeFilter !== 'ALL' ? ` in ${TAB_CONFIG.find((t) => t.key === activeFilter)?.label.toLowerCase()}` : ''
                    }`}
              </span>
            </div>

            {/* Loading / Empty / Results */}
            {searchLoading ? (
              <LoadingState message="Traversing CognoDB property graph..." />
            ) : filteredResults.length === 0 ? (
              <EmptyState
                title="No matching results"
                description="Try another search term. Explore developers, skills, projects, or companies across the knowledge graph."
                icon="search"
              />
            ) : (
              <div className="space-y-8">
                {activeFilter === 'ALL' ? (
                  /* Grouped Results */
                  <div className="space-y-8">
                    {developerResults.length > 0 && (
                      <ResultGroup
                        type="Developer"
                        title="Developers"
                        icon={<Users className="w-4 h-4 text-emerald-400" />}
                        count={developerResults.length}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {developerResults.map((item, idx) => (
                            <DeveloperCard
                              key={`dev-${idx}`}
                              name={item.name}
                              role={item.subtitle.split(' at ')[0]}
                              company={item.subtitle.split(' at ')[1]}
                              experienceYears={item.details?.experienceYears}
                            />
                          ))}
                        </div>
                      </ResultGroup>
                    )}

                    {skillResults.length > 0 && (
                      <ResultGroup
                        type="Skill"
                        title="Skills"
                        icon={<Code2 className="w-4 h-4 text-blue-400" />}
                        count={skillResults.length}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {skillResults.map((item, idx) => (
                            <SkillResultCard key={`skill-${idx}`} item={item} />
                          ))}
                        </div>
                      </ResultGroup>
                    )}

                    {projectResults.length > 0 && (
                      <ResultGroup
                        type="Project"
                        title="Projects"
                        icon={<FolderGit2 className="w-4 h-4 text-purple-400" />}
                        count={projectResults.length}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {projectResults.map((item, idx) => (
                            <ProjectCard
                              key={`proj-${idx}`}
                              name={item.name}
                              description={item.details?.description}
                              status={item.details?.status}
                            />
                          ))}
                        </div>
                      </ResultGroup>
                    )}

                    {companyResults.length > 0 && (
                      <ResultGroup
                        type="Company"
                        title="Companies"
                        icon={<Building2 className="w-4 h-4 text-amber-400" />}
                        count={companyResults.length}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {companyResults.map((item, idx) => (
                            <CompanyCard
                              key={`comp-${idx}`}
                              name={item.name}
                              industry={item.details?.industry}
                              location={item.details?.location}
                            />
                          ))}
                        </div>
                      </ResultGroup>
                    )}
                  </div>
                ) : (
                  /* Filtered flat list */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredResults.map((item, idx) => {
                      if (item.type === 'Developer') {
                        return (
                          <DeveloperCard
                            key={`dev-${idx}`}
                            name={item.name}
                            role={item.subtitle.split(' at ')[0]}
                            company={item.subtitle.split(' at ')[1]}
                            experienceYears={item.details?.experienceYears}
                          />
                        );
                      }
                      if (item.type === 'Skill') {
                        return <SkillResultCard key={`skill-${idx}`} item={item} />;
                      }
                      if (item.type === 'Project') {
                        return (
                          <ProjectCard
                            key={`proj-${idx}`}
                            name={item.name}
                            description={item.details?.description}
                            status={item.details?.status}
                          />
                        );
                      }
                      if (item.type === 'Company') {
                        return (
                          <CompanyCard
                            key={`comp-${idx}`}
                            name={item.name}
                            industry={item.details?.industry}
                            location={item.details?.location}
                          />
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ====================== EXPLORATION / DASHBOARD VIEW ====================== */
          <div className="space-y-8 sm:space-y-10 animate-in fade-in duration-500">
            {dashboardError && (
              <ErrorState
                title="Couldn't load exploration data"
                message={dashboardError}
                onRetry={loadDashboard}
              />
            )}

            {dashboardLoading ? (
              <LoadingState message="Loading graph exploration dashboard..." size="lg" />
            ) : (
              <>
                {/* Stats Row (compact) */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard
                    label="Developers"
                    value={developers.length}
                    icon={<Users className="w-4 h-4" />}
                    color="emerald"
                  />
                  <StatCard
                    label="Skills"
                    value={skills.length}
                    icon={<Code2 className="w-4 h-4" />}
                    color="blue"
                  />
                  <StatCard
                    label="Projects"
                    value={projects.length}
                    icon={<FolderGit2 className="w-4 h-4" />}
                    color="purple"
                  />
                  <StatCard
                    label="Companies"
                    value={companies.length}
                    icon={<Building2 className="w-4 h-4" />}
                    color="amber"
                  />
                </section>

                {/* Interactive Graph (centerpiece) */}
                <section className="space-y-3">
                  <SectionHeader
                    icon={<Network className="w-4 h-4 text-emerald-400" />}
                    title="Knowledge Graph"
                    subtitle="Explore the interconnected ecosystem of skills, people, projects and organizations. Click a node to explore."
                    badge={
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-[10px] font-bold">
                        <GitBranch className="w-3 h-3" /> Graph-Native
                      </span>
                    }
                  />
                  <InteractiveGraph data={graphData} height={500} />
                </section>

                {/* Featured Developers */}
                <section className="space-y-4">
                  <SectionHeader
                    icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
                    title="Featured Engineers"
                    subtitle="Developers with verified competencies across the graph"
                  >
                    <Link
                      to="/developers"
                      className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      View all <ChevronRight className="w-3 h-3" />
                    </Link>
                  </SectionHeader>
                  {featuredDevelopers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {featuredDevelopers.map((dev) => (
                        <DeveloperCard
                          key={dev.id}
                          name={dev.name}
                          role={dev.title}
                          experienceYears={dev.experienceYears}
                          skills={dev.skills.slice(0, 4).map((s) => ({
                            name: s.name,
                            proficiency: (s.level as any) || 'Intermediate',
                          }))}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="No developers yet" description="Seed the database to load sample data." icon="developers" />
                  )}
                </section>

                {/* Popular Skills */}
                <section className="space-y-4">
                  <SectionHeader
                    icon={<Star className="w-4 h-4 text-blue-400" />}
                    title="Popular Technology Stack"
                    subtitle="Most widely adopted skills across the developer graph"
                  >
                    <Link
                      to="/skills"
                      className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1"
                    >
                      View all <ChevronRight className="w-3 h-3" />
                    </Link>
                  </SectionHeader>
                  {popularSkills.length > 0 ? (
                    <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur">
                      <div className="flex flex-wrap gap-2">
                        {popularSkills.map((skill) => (
                          <SkillBadge
                            key={skill.id}
                            name={skill.name}
                            difficulty={(skill.difficulty as any) || 'Intermediate'}
                            size="md"
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      title="No skills yet"
                      description="Seed the database to load the technology catalog."
                      icon="skills"
                    />
                  )}
                </section>

                {/* Skill Categories */}
                {skillCategories.length > 0 && (
                  <section className="space-y-4">
                    <SectionHeader
                      icon={<Database className="w-4 h-4 text-slate-400" />}
                      title="Browse by Domain"
                      subtitle="Explore skills organized by engineering domain"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {skillCategories.map(([category, catSkills]) => (
                        <Link
                          key={category}
                          to={`/skills?category=${encodeURIComponent(category)}`}
                          className="group p-4 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-800/40 transition-all cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-slate-200 group-hover:text-blue-400 flex items-center gap-2 transition-colors">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              {category}
                            </h4>
                            <span className="text-[10px] text-slate-500 group-hover:text-blue-400 font-bold bg-slate-800/60 group-hover:bg-blue-950/40 px-2 py-0.5 rounded-full transition-all flex items-center gap-1">
                              {catSkills.length} skills
                              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {catSkills.slice(0, 8).map((s) => (
                              <SkillBadge key={s.id} name={s.name} size="sm" />
                            ))}
                            {catSkills.length > 8 && (
                              <span className="px-2 py-0.5 text-[11px] text-slate-500 self-center">
                                +{catSkills.length - 8} more
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Projects + Companies Row */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <SectionHeader
                      icon={<FolderGit2 className="w-4 h-4 text-purple-400" />}
                      title="Active Projects"
                      subtitle="Production deployments in the knowledge graph"
                    />
                    {featuredProjects.length > 0 ? (
                      <div className="space-y-3">
                        {featuredProjects.map((proj) => (
                          <ProjectCard
                            key={proj.name}
                            name={proj.name}
                            description={proj.description}
                            status={proj.status}
                            skillsUsed={proj.skills.slice(0, 4).map((s) => s.name)}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        title="No projects yet"
                        description="Seed the database to load project data."
                      />
                    )}
                  </div>

                  <div className="space-y-4">
                    <SectionHeader
                      icon={<Building2 className="w-4 h-4 text-amber-400" />}
                      title="Companies Hiring"
                      subtitle="Organizations with talent in the knowledge graph"
                    />
                    {featuredCompanies.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {featuredCompanies.map((comp) => (
                          <CompanyCard
                            key={comp.name}
                            name={comp.name}
                            industry={comp.industry}
                            location={comp.location}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        title="No companies yet"
                        description="Seed the database to load company data."
                        icon="companies"
                      />
                    )}
                  </div>
                </section>

                {/* Suggested Explorations */}
                <section className="space-y-4">
                  <SectionHeader
                    icon={<Compass className="w-4 h-4 text-teal-400" />}
                    title="Suggested Explorations"
                    subtitle="Start here to discover relationships across the graph"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <ExplorationCard
                      title="Full-Stack Career Path"
                      description="Trace the skill progression from HTML → React → Next.js → Microservices"
                      gradient="from-blue-600/20 to-emerald-600/20"
                      onClick={() => handleSearchSubmit('TypeScript')}
                      icon={<Shuffle className="w-4 h-4" />}
                    />
                    <ExplorationCard
                      title="DevOps Skill Chain"
                      description="Navigate Docker → Kubernetes → Terraform and CI/CD pipelines"
                      gradient="from-amber-600/20 to-orange-600/20"
                      onClick={() => handleSearchSubmit('Docker')}
                      icon={<GitBranch className="w-4 h-4" />}
                    />
                    <ExplorationCard
                      title="AI & Graph RAG Stack"
                      description="Explore the PyTorch → LLMs → Graph Databases knowledge chain"
                      gradient="from-purple-600/20 to-pink-600/20"
                      onClick={() => handleSearchSubmit('LLM')}
                      icon={<Network className="w-4 h-4" />}
                    />
                  </div>
                </section>
              </>
            )}
          </div>
        ))}
    </div>
  );
};

/* ============== Helper Components ============== */

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, subtitle, badge, children }) => (
  <div className="flex items-start justify-between gap-3 flex-wrap">
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {badge}
      </div>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'emerald' | 'blue' | 'purple' | 'amber';
}

const colorMap = {
  emerald: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-950/30',
    border: 'border-emerald-900/40',
    ring: 'ring-emerald-500/10',
  },
  blue: {
    text: 'text-blue-400',
    bg: 'bg-blue-950/30',
    border: 'border-blue-900/40',
    ring: 'ring-blue-500/10',
  },
  purple: {
    text: 'text-purple-400',
    bg: 'bg-purple-950/30',
    border: 'border-purple-900/40',
    ring: 'ring-purple-500/10',
  },
  amber: {
    text: 'text-amber-400',
    bg: 'bg-amber-950/30',
    border: 'border-amber-900/40',
    ring: 'ring-amber-500/10',
  },
};

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  const c = colorMap[color];
  return (
    <div
      className={`p-4 rounded-2xl ${c.bg} border ${c.border} backdrop-blur-sm ring-1 ${c.ring} hover:scale-[1.02] transition-transform duration-200`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`${c.text}`}>{icon}</span>
        <span className="text-2xl sm:text-3xl font-extrabold text-white">{value}</span>
      </div>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
  );
};

interface ResultGroupProps {
  type: string;
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}

const ResultGroup: React.FC<ResultGroupProps> = ({ type, title, icon, count, children }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <div className="h-5 w-px bg-slate-700" />
      <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
        {icon}
        {title}
      </h4>
      <span className="text-[10px] font-bold text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">
        {count}
      </span>
    </div>
    {children}
  </div>
);

interface ExplorationCardProps {
  title: string;
  description: string;
  gradient: string;
  onClick: () => void;
  icon: React.ReactNode;
}

const ExplorationCard: React.FC<ExplorationCardProps> = ({
  title,
  description,
  gradient,
  onClick,
  icon,
}) => (
  <button
    onClick={onClick}
    className={`text-left p-4 rounded-2xl bg-gradient-to-br ${gradient} border border-slate-800 hover:border-slate-600 transition-all hover:scale-[1.02] active:scale-[0.99] group`}
  >
    <div className="flex items-start justify-between mb-2">
      <div className="p-2 rounded-lg bg-slate-900/60 text-slate-300 group-hover:text-white transition">
        {icon}
      </div>
      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
    </div>
    <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
    <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
  </button>
);

const SkillResultCard: React.FC<{ item: SearchResult }> = ({ item }) => (
  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/40 transition-all shadow-lg backdrop-blur space-y-3 flex flex-col justify-between group">
    <div>
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition">
          {item.name}
        </h4>
        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {item.details?.difficulty || 'Skill'}
        </span>
      </div>
      <p className="text-xs text-slate-400 mt-1">{item.subtitle}</p>
      {item.details?.description && (
        <p className="text-xs text-slate-300 mt-2.5 line-clamp-2 leading-relaxed">
          {item.details.description}
        </p>
      )}
    </div>

    <div className="pt-3 border-t border-slate-800 flex justify-end">
      <Link
        to={`/skills/${encodeURIComponent(item.name)}`}
        className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1"
      >
        View Skill Topology <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  </div>
);
