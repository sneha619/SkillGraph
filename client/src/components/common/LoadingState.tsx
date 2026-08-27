import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading graph data from CognoDB...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-emerald-400`} />
      {message && (
        <p className="text-sm font-medium text-slate-400 animate-pulse">{message}</p>
      )}
    </div>
  );
};

