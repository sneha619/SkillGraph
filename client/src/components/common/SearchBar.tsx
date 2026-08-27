import React, { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchBarProps {
  initialValue?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialValue = '',
  onSearch,
  placeholder = 'Search developers, skills, projects, companies...',
  isLoading = false,
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <div className="absolute left-4 text-slate-400">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          ) : (
            <Search className="w-5 h-5 text-slate-500" />
          )}
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-24 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xl transition"
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950/40 transition"
          >
            Search
          </button>
        </div>
      </div>
    </form>
  );
};

