import React from 'react';
import { AlertCircle, RefreshCw, Database } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  isDbError?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  isDbError,
}) => {
  return (
    <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-200 shadow-xl space-y-4">
      <div className="flex items-start gap-3.5">
        {isDbError ? (
          <Database className="w-6 h-6 text-rose-400 mt-0.5 shrink-0" />
        ) : (
          <AlertCircle className="w-6 h-6 text-rose-400 mt-0.5 shrink-0" />
        )}
        <div className="flex-1">
          <h4 className="text-base font-bold text-rose-100">{title}</h4>
          <p className="text-xs sm:text-sm text-rose-200/80 mt-1 leading-relaxed">{message}</p>
        </div>
      </div>

      {onRetry && (
        <div className="flex justify-end pt-2">
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition shadow-md shadow-rose-950/40"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

