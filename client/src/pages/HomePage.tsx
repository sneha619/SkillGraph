import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { SearchResult } from '../types';
import { SearchBar } from '../components/common/SearchBar';
import { DeveloperCard } from '../components/cards/DeveloperCard';
import { ProjectCard } from '../components/cards/ProjectCard';
import { CompanyCard } from '../components/cards/CompanyCard';
import { SkillBadge } from '../components/common/SkillBadge';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Network, Users, Code2, FolderGit2, Building2, Sparkles } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const executeSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.search(searchTerm.trim());
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to execute graph search on CognoDB');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryParam) {
      executeSearch(queryParam);
    } else {
      // Default explore query
      executeSearch('Alex');
    }
  }, [queryParam]);

  const handleSearchSubmit = (term: string) => {
    if (term) {
      setSearchParams({ q: term });
    } else {
      setSearchParams({});
      setResults([]);
    }
  };

  const sampleQueries = [
    'Alex Chen',
    'React',
    'Graph Databases & Cypher',
    'Wexa AI',
    'Docker',
    'Distributed Microservices Engine',
  ];

  // Filtering results
  const filteredResults = results.filter((item) => {
    if (activeFilter === 'ALL') return true;
    return item.type.toUpperCase() === activeFilter;
  });

  const developerResults = results.filter((r) => r.type === 'Developer');
  const skillResults = results.filter((r) => r.type === 'Skill');
  const projectResults = results.filter((r) => r.type === 'Project');
  const companyResults = results.filter((r) => r.type === 'Company');

  return (
    <div className="space-y-10">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Graph-Powered Developer Knowledge Engine
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Explore Connected <span className="text-emerald-400">Developer Talent</span> & Technology Paths
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Navigate developers, skills, companies, and project dependencies as an interconnected property graph powered by CognoDB.
        </p>

        {/* Main Search Bar */}
        <div className="pt-2">
          <SearchBar
            initialValue={queryParam || 'Alex'}
            onSearch={handleSearchSubmit}
            isLoading={loading}
          />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-500">Try searching:</span>
          {sampleQueries.map((sample) => (
            <button
              key={sample}
              onClick={() => handleSearchSubmit(sample)}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-600 transition"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Error View */}
      {error && (
        <ErrorState
          title="Search Failed"
          message={error}
          onRetry={() => executeSearch(queryParam || 'Alex')}
        />
      )}

      {/* Filter Tabs */}
      {!error && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                  activeFilter === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                All Results ({results.length})
              </button>

              {developerResults.length > 0 && (
                <button
                  onClick={() => setActiveFilter('DEVELOPER')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    activeFilter === 'DEVELOPER'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Developers ({developerResults.length})
                </button>
              )}

              {skillResults.length > 0 && (
                <button
                  onClick={() => setActiveFilter('SKILL')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    activeFilter === 'SKILL'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  Skills ({skillResults.length})
                </button>
              )}

              {projectResults.length > 0 && (
                <button
                  onClick={() => setActiveFilter('PROJECT')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    activeFilter === 'PROJECT'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <FolderGit2 className="w-3.5 h-3.5" />
                  Projects ({projectResults.length})
                </button>
              )}

              {companyResults.length > 0 && (
                <button
                  onClick={() => setActiveFilter('COMPANY')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    activeFilter === 'COMPANY'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Companies ({companyResults.length})
                </button>
              )}
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Showing {filteredResults.length} matching graph entities
            </span>
          </div>

          {/* Loading View */}
          {loading ? (
            <LoadingState message="Executing graph pattern search in CognoDB..." />
          ) : filteredResults.length === 0 ? (
            <EmptyState
              title="No Results Found"
              description={`We couldn't find any graph nodes matching "${queryParam}". Try searching for another developer, skill, or company.`}
              actionLabel="Search 'Alex Chen'"
              onAction={() => handleSearchSubmit('Alex Chen')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                  return (
                    <div
                      key={`skill-${idx}`}
                      className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/50 transition-all shadow-lg backdrop-blur space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-base font-bold text-slate-100">{item.name}</h4>
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
                          className="text-xs font-semibold text-emerald-400 hover:underline"
                        >
                          View Skill Topology →
                        </Link>
                      </div>
                    </div>
                  );
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
  );
};

