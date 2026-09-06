/**
 * LoadingState Component
 * 
 * - What it does:
 *   Displays a refined cosmic loader skeleton with constellation pulse and telemetry link indicator.
 */

import React from 'react';
import { Activity, Sparkles } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export default function LoadingState({
  message = "Establishing Deep Space Telemetry Link...",
  className = ""
}: LoadingStateProps) {
  return (
    <div
      id="apod-loading-state"
      className={`min-h-[50vh] flex flex-col items-center justify-center p-8 text-center space-y-4 font-mono ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
        <Sparkles className="absolute text-[#E4A853] animate-pulse" size={20} />
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-slate-100">{message}</p>
        <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400">
          <Activity size={12} className="animate-pulse" />
          <span>Synchronizing NASA Planetary Telemetry (300 bps)</span>
        </div>
      </div>
    </div>
  );
}
