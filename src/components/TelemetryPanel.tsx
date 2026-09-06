/**
 * TelemetryPanel Component
 * 
 * - What it does:
 *   Renders an astrometric HUD panel with real-time status indicators, target categorization,
 *   distance vectors in multiple scales (ly / AU / km), telemetry carrier logs, and keyword tokens.
 * 
 * - Why it exists:
 *   Encapsulates complex deep-space scientific metadata into a clean, reusable interface component.
 */

import React from 'react';
import { Activity } from 'lucide-react';
import { formatCategoryName } from '../lib/apodClassifier';
import { FormattedDistance } from '../lib/distanceFormatter';
import CategoryBadge from './CategoryBadge';
import DistanceDisplay from './DistanceDisplay';

interface TelemetryPanelProps {
  category: string;
  confidence: number;
  matchedKeywords?: string[];
  distanceLightYears?: number | null;
  distance?: FormattedDistance | null;
  carrierRate?: string;
  isLive?: boolean;
  className?: string;
}

export default function TelemetryPanel({
  category,
  confidence,
  matchedKeywords = [],
  distanceLightYears = null,
  distance = null,
  carrierRate = '300 bps',
  isLive = true,
  className = ''
}: TelemetryPanelProps) {
  return (
    <section
      id="telemetry-panel-root"
      aria-label="Astrometric Telemetry Panel"
      className={`p-4 sm:p-5 rounded-xl bg-black/70 border border-emerald-500/35 text-left space-y-3.5 shadow-inner relative overflow-hidden font-mono ${className}`}
    >
      {/* Subtle green telemetry background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-2xl rounded-full pointer-events-none" />

      {/* Header Bar: Pulsing Live Radar Dot & Link Rate */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3 shrink-0 items-center justify-center">
            {isLive && (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80 [animation-duration:1.5s]" />
                <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-emerald-500/30 opacity-50 [animation-duration:2.5s]" />
              </>
            )}
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_#10B981]" />
          </span>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            {isLive ? 'Live Telemetry Active' : 'Archival Telemetry Log'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400">
          <Activity size={12} className={isLive ? 'animate-pulse' : ''} aria-hidden="true" />
          <span>{carrierRate}</span>
        </div>
      </div>

      {/* Structured Telemetry Data Stream */}
      <div className="text-xs text-slate-300 space-y-3 pl-4 border-l-2 border-emerald-500/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Target Taxonomy:</span>
            <CategoryBadge category={category} size="sm" />
          </div>
          <span className="text-emerald-400 text-[10px] font-normal">LOCK ESTABLISHED</span>
        </div>

        {/* Multi-Unit Distance Vectors */}
        <DistanceDisplay
          distance={distance}
          distanceLightYears={distanceLightYears}
          variant="compact"
        />

        {/* Metadata Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400 text-[11px] pt-1">
          <p>
            Classifier Confidence: <span className="text-emerald-400 font-semibold">{Math.round(confidence * 100)}%</span>
          </p>
          <p>
            Telemetry Carrier: <span className="text-slate-200">DSN Deep Space Link</span>
          </p>
          <p className="sm:col-span-2">
            Spectral Tokens: <span className="text-slate-300">{matchedKeywords.length > 0 ? matchedKeywords.join(', ') : 'Direct Astrometric Stream'}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
