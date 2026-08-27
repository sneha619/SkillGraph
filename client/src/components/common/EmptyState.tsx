import React from 'react';
import { SearchX, Database, Users, Code, Building2 } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: 'search' | 'database' | 'developers' | 'skills' | 'companies';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon = 'search',
}) => {
  const renderIcon = () => {
    switch (icon) {
      case 'database':
        return <Database className="w-10 h-10 text-slate-500" />;
      case 'developers':
        return <Users className="w-10 h-10 text-slate-500" />;
      case 'skills':
        return <Code className="w-10 h-10 text-slate-500" />;
      case 'companies':
        return <Building2 className="w-10 h-10 text-slate-500" />;
      default:
        return <SearchX className="w-10 h-10 text-slate-500" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur">
      <div className="p-4 rounded-2xl bg-slate-800/60 mb-4 border border-slate-700/50">
        {renderIcon()}
      </div>
      <h3 className="text-lg font-bold text-slate-200">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md mt-1.5 mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-lg shadow-emerald-950/40"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
