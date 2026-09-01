import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { DeveloperListItem } from '../types';
import { SearchBar } from '../components/common/SearchBar';
import { DeveloperCard } from '../components/cards/DeveloperCard';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import {
  Users,
  ArrowLeft,
  ChevronDown,
  TrendingUp,
  Clock,
  Filter,
  SortAsc,
} from 'lucide-react';

type SortKey = 'name' | 'experience' | 'skills';

export const DevelopersListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [developers, setDevelopers] = useState<DeveloperListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>('experience');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [minExperience, setMinExperience] = useState<number | ''>('');
  const [skillFilter, setSkillFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const loadDevelopers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listDevelopers();
      setDevelopers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load developers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevelopers();
  }, [loadDevelopers]);

  const allSkillNames = useMemo(() => {
    const set = new Set<string>();
    for (const d of developers) {
      for (const s of d.skills) {
        set.add(s.name);
      }
    }
    return Array.from(set).sort();
  }, [developers]);

  const filteredDevelopers = useMemo(() => {
    let list = [...developers];

    if (queryParam.trim()) {
      const q = queryParam.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.title.toLowerCase().includes(q) ||
          d.skills.some((s) => s.name.toLowerCase().includes(q))
      );
    }

    if (minExperience !== '' && !isNaN(Number(minExperience))) {
      list = list.filter((d) => d.experienceYears >= Number(minExperience));
    }

    if (skillFilter) {
      list = list.filter((d) => d.skills.some((s) => s.name === skillFilter));
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'experience':
          cmp = a.experienceYears - b.experienceYears;
          break;
        case 'skills':
          cmp = a.skills.length - b.skills.length;
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return list;
  }, [developers, queryParam, sortKey, sortDir, minExperience, skillFilter]);

  const handleSearch = (term: string) => {
    if (term.trim()) {
      setSearchParams({ q: term.trim() });
    } else {
      setSearchParams({});
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Exploration
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/40">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Browse Developers
            </h1>
            <p className="text-sm text-slate-400">
              {loading
                ? 'Loading developer directory…'
                : `${filteredDevelopers.length} developer${filteredDevelopers.length === 1 ? '' : 's'} in the knowledge graph`}
            </p>
          </div>
        </div>

        <SearchBar
          initialValue={queryParam}
          onSearch={handleSearch}
          placeholder="Search developer names, titles, or skills…"
        />
      </div>

      {error && (
        <ErrorState title="Couldn't load developers" message={error} onRetry={loadDevelopers} />
      )}

      {!error &&
        (loading ? (
          <LoadingState message="Loading developer profiles from CognoDB…" size="lg" />
        ) : filteredDevelopers.length === 0 ? (
          <EmptyState
            title="No developers found"
            description={
              queryParam || minExperience !== '' || skillFilter
                ? 'Try adjusting your search or filters to see more results.'
                : 'No developers in the database yet. Seed the database to load sample data.'
            }
            icon="developers"
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={() => setShowFilters((f) => !f)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-900/60 border border-slate-700/60 rounded-xl hover:bg-slate-800 transition"
              >
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Filters
                {(minExperience !== '' || skillFilter) && (
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">
                    {(minExperience !== '' ? 1 : 0) + (skillFilter ? 1 : 0)}
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                />
              </button>

              <div className="flex items-center gap-1 text-xs">
                <SortAsc className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500 font-medium mr-1.5">Sort:</span>
                {([
                  { key: 'experience' as SortKey, label: 'Experience', icon: <Clock className="w-3 h-3" /> },
                  { key: 'name' as SortKey, label: 'Name' },
                  { key: 'skills' as SortKey, label: 'Skills', icon: <TrendingUp className="w-3 h-3" /> },
                ]).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => toggleSort(opt.key)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold transition ${
                      sortKey === opt.key
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                    {sortKey === opt.key && (
                      <span className="text-[10px] ml-0.5">{sortDir === 'desc' ? '↓' : '↑'}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {showFilters && (
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Minimum Experience (years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={minExperience}
                      onChange={(e) =>
                        setMinExperience(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="e.g. 3"
                      className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Has Skill
                    </label>
                    <select
                      value={skillFilter}
                      onChange={(e) => setSkillFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">Any skill</option>
                      {allSkillNames.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {(minExperience !== '' || skillFilter) && (
                  <div className="flex justify-end pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setMinExperience('');
                        setSkillFilter('');
                      }}
                      className="text-xs font-semibold text-slate-400 hover:text-emerald-400 transition"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDevelopers.map((dev) => (
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
          </div>
        ))}
    </div>
  );
};
