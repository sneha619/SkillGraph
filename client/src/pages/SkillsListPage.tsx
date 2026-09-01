import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { SkillListItem } from '../types';
import { SearchBar } from '../components/common/SearchBar';
import { SkillBadge } from '../components/common/SkillBadge';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import {
  Code2,
  ArrowLeft,
  ChevronDown,
  Layers,
  TrendingUp,
  Filter,
  SortAsc,
  ChevronRight,
  Star,
} from 'lucide-react';

type SortKey = 'name' | 'difficulty' | 'popularity';
type DifficultyFilter = 'ALL' | 'Beginner' | 'Intermediate' | 'Advanced';

const DIFFICULTY_ORDER: Record<string, number> = {
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
};

export const SkillsListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';

  const [skills, setSkills] = useState<SkillListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>('popularity');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>(categoryParam);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const loadSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listSkills();
      setSkills(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  useEffect(() => {
    if (categoryParam && !categoryFilter) {
      setCategoryFilter(categoryParam);
      setShowFilters(true);
    }
  }, [categoryParam]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const s of skills) set.add(s.category);
    return Array.from(set).sort();
  }, [skills]);

  const filteredSkills = useMemo(() => {
    let list = [...skills];

    if (queryParam.trim()) {
      const q = queryParam.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }

    if (difficultyFilter !== 'ALL') {
      list = list.filter((s) => s.difficulty === difficultyFilter);
    }

    if (categoryFilter) {
      list = list.filter((s) => s.category === categoryFilter);
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'difficulty':
          cmp =
            (DIFFICULTY_ORDER[a.difficulty || 'Beginner'] ?? 0) -
            (DIFFICULTY_ORDER[b.difficulty || 'Beginner'] ?? 0);
          break;
        case 'popularity':
          cmp = (a.popularity || 0) - (b.popularity || 0);
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return list;
  }, [skills, queryParam, sortKey, sortDir, difficultyFilter, categoryFilter]);

  const groupedByCategory = useMemo(() => {
    if (categoryFilter) return null;
    const groups = new Map<string, SkillListItem[]>();
    for (const s of filteredSkills) {
      if (!groups.has(s.category)) groups.set(s.category, []);
      groups.get(s.category)!.push(s);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredSkills, categoryFilter]);

  const handleSearch = (term: string) => {
    const params: Record<string, string> = {};
    if (term.trim()) params.q = term.trim();
    if (categoryFilter) params.category = categoryFilter;
    setSearchParams(params);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const clearFilters = () => {
    setDifficultyFilter('ALL');
    setCategoryFilter('');
    setSearchParams({});
  };

  const hasActiveFilters =
    difficultyFilter !== 'ALL' || categoryFilter !== '';

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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-950/40">
            <Code2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Browse Skills
            </h1>
            <p className="text-sm text-slate-400">
              {loading
                ? 'Loading technology catalog…'
                : `${filteredSkills.length} skill${filteredSkills.length === 1 ? '' : 's'} across ${categories.length} domain${categories.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>

        <SearchBar
          initialValue={queryParam}
          onSearch={handleSearch}
          placeholder="Search skills, categories, or descriptions…"
        />
      </div>

      {error && (
        <ErrorState title="Couldn't load skills catalog" message={error} onRetry={loadSkills} />
      )}

      {!error &&
        (loading ? (
          <LoadingState message="Loading skills graph from CognoDB…" size="lg" />
        ) : filteredSkills.length === 0 ? (
          <EmptyState
            title="No skills found"
            description={
              hasActiveFilters || queryParam
                ? 'Try adjusting your search or filters to see more results.'
                : 'No skills in the database yet. Seed the database to load the technology catalog.'
            }
            icon="skills"
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
                {hasActiveFilters && (
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">
                    {(difficultyFilter !== 'ALL' ? 1 : 0) + (categoryFilter ? 1 : 0)}
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
                  { key: 'popularity' as SortKey, label: 'Popular', icon: <Star className="w-3 h-3" /> },
                  { key: 'name' as SortKey, label: 'Name' },
                  { key: 'difficulty' as SortKey, label: 'Level', icon: <Layers className="w-3 h-3" /> },
                ]).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => toggleSort(opt.key)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold transition ${
                      sortKey === opt.key
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-950/40'
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
                      <TrendingUp className="w-3 h-3" /> Difficulty Level
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(['ALL', 'Beginner', 'Intermediate', 'Advanced'] as DifficultyFilter[]).map(
                        (d) => (
                          <button
                            key={d}
                            onClick={() => setDifficultyFilter(d)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                              difficultyFilter === d
                                ? d === 'ALL'
                                  ? 'bg-slate-700 text-white border-slate-600'
                                  : d === 'Beginner'
                                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                                  : d === 'Intermediate'
                                  ? 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                                  : 'bg-purple-950/60 text-purple-300 border-purple-800/60'
                                : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-800 hover:text-slate-300'
                            }`}
                          >
                            {d === 'ALL' ? 'All Levels' : d}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> Category / Domain
                    </label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">All categories</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="flex justify-end pt-2 border-t border-slate-800">
                    <button
                      onClick={clearFilters}
                      className="text-xs font-semibold text-slate-400 hover:text-blue-400 transition"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {groupedByCategory && groupedByCategory.length > 0 && !queryParam ? (
              <div className="space-y-6">
                {groupedByCategory.map(([category, catSkills]) => (
                  <section key={category} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                          {category}
                        </h3>
                        <span className="text-[10px] text-slate-500 font-bold bg-slate-800/60 px-2 py-0.5 rounded-full">
                          {catSkills.length} skill{catSkills.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {catSkills.map((skill) => (
                        <SkillCard key={skill.id} skill={skill} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredSkills.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>
            )}
          </div>
        ))}
    </div>
  );
};

interface SkillCardProps {
  skill: SkillListItem;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill }) => (
  <Link
    to={`/skills/${encodeURIComponent(skill.name)}`}
    className="group p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/40 transition-all shadow-lg hover:shadow-blue-950/20 backdrop-blur flex flex-col justify-between space-y-3"
  >
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition leading-tight">
          {skill.name}
        </h4>
        {skill.difficulty && (
          <span
            className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border shrink-0 ${
              skill.difficulty === 'Beginner'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                : skill.difficulty === 'Intermediate'
                ? 'bg-blue-950/40 text-blue-300 border-blue-800/40'
                : 'bg-purple-950/40 text-purple-300 border-purple-800/40'
            }`}
          >
            {skill.difficulty}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-md">
          {skill.category}
        </span>
        {skill.popularity !== undefined && skill.popularity > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
            <Star className="w-3 h-3" />
            {skill.popularity}
          </span>
        )}
      </div>

      {skill.description && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{skill.description}</p>
      )}
    </div>

    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
      <SkillBadge
        name={skill.name}
        difficulty={skill.difficulty as any}
        clickable={false}
        size="sm"
      />
      <span className="text-xs font-semibold text-blue-400 group-hover:text-blue-300 flex items-center gap-0.5">
        View
        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </span>
    </div>
  </Link>
);
