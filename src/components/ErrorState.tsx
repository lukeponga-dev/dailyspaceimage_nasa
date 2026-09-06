/**
 * ErrorState Component
 * 
 * - What it does:
 *   Renders an accessible error screen with diagnostic details, NASA API rate limit indicators,
 *   and retry/fallback actions.
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  error: string | Error;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({
  error,
  onRetry,
  className = ""
}: ErrorStateProps) {
  const errorMessage = typeof error === 'string' ? error : error?.message || 'Unknown network error';
  const isRateLimit = errorMessage.includes('429') || errorMessage.includes('Rate limit');

  return (
    <div
      id="apod-error-state"
      role="alert"
      className={`min-h-[50vh] flex flex-col items-center justify-center p-8 text-center space-y-4 font-mono max-w-md mx-auto ${className}`}
    >
      <div className="p-3.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
        <AlertTriangle size={32} aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-bold text-white">
          {isRateLimit ? 'NASA Rate Limit Throttle Detected' : 'Telemetry Transmission Interrupted'}
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {isRateLimit
            ? 'The NASA API rate limit was reached. Using cached observations or please retry shortly.'
            : errorMessage}
        </p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E4A853] hover:bg-[#f3be73] text-[#050608] font-bold text-xs transition-all shadow-[0_0_15px_rgba(228,168,83,0.3)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E4A853]"
        >
          <RefreshCw size={14} aria-hidden="true" />
          <span>Re-establish Telemetry Link</span>
        </button>
      )}
    </div>
  );
}
