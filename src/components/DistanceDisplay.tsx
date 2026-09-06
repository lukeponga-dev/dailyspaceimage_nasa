/**
 * DistanceDisplay Component
 * 
 * - What it does:
 *   Renders multi-unit celestial distance metrics (Light-Years, Astronomical Units, and Kilometers).
 * 
 * - Why it exists:
 *   Translates raw coordinate numbers into human-readable scientific measurements across both
 *   solar-system scale and deep-space scale.
 */

import React from 'react';
import { FormattedDistance } from '../lib/distanceFormatter';

interface DistanceDisplayProps {
  distance?: FormattedDistance | null;
  distanceLightYears?: number | null;
  variant?: 'compact' | 'cards' | 'inline';
  className?: string;
}

export default function DistanceDisplay({
  distance,
  distanceLightYears,
  variant = 'compact',
  className = ''
}: DistanceDisplayProps) {
  // If no distance data is available
  const hasValidDistance = (distance && distance.ly !== null) || (distanceLightYears !== null && distanceLightYears !== undefined);

  if (!hasValidDistance) {
    return (
      <div className={`text-slate-400 text-xs font-mono italic ${className}`}>
        Distance: Coordinates Pending / Not Measured
      </div>
    );
  }

  const lyValue = distance?.ly ?? distanceLightYears ?? 0;
  const auValue = distance?.au ?? (lyValue ? Number((lyValue * 63241.1).toFixed(2)) : null);
  const kmValue = distance?.km ?? (lyValue ? Math.round(lyValue * 9.4607e12) : null);

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono tracking-wide ${className}`}>
        <span>Distance:</span>
        <span className="font-semibold text-white">{lyValue} ly</span>
        {auValue !== null && (
          <span className="text-slate-400">({auValue.toLocaleString()} AU)</span>
        )}
      </span>
    );
  }

  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono ${className}`}>
        <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-left">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Light-Years (ly)</span>
          <span className="text-sm font-bold text-white">{lyValue.toLocaleString()} ly</span>
        </div>
        <div className="p-2.5 rounded-lg bg-white/5 border border-cyan-500/20 text-left">
          <span className="text-[10px] text-cyan-400 uppercase tracking-wider block">Astronomical Units (AU)</span>
          <span className="text-sm font-bold text-cyan-200">{auValue ? auValue.toLocaleString() : 'N/A'} AU</span>
        </div>
        <div className="p-2.5 rounded-lg bg-white/5 border border-emerald-500/20 text-left">
          <span className="text-[10px] text-emerald-400 uppercase tracking-wider block">Kilometers (km)</span>
          <span className="text-sm font-bold text-emerald-300">{kmValue ? kmValue.toLocaleString() : 'N/A'} km</span>
        </div>
      </div>
    );
  }

  // Default: Compact panel layout
  return (
    <div className={`space-y-1 bg-white/5 p-3 rounded-lg border border-white/10 font-mono text-left ${className}`}>
      <span className="text-slate-300 font-semibold block text-[11px] uppercase tracking-wide">
        Astrometric Distance Vectors
      </span>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-200 text-xs pt-1">
        <div className="flex items-center gap-1">
          <span className="text-slate-400 text-[10px]">LY:</span>
          <strong className="text-white font-bold">{lyValue.toLocaleString()}</strong>
          <span className="text-slate-400 text-[10px]">ly</span>
        </div>
        {auValue !== null && (
          <div className="flex items-center gap-1">
            <span className="text-cyan-400 text-[10px]">AU:</span>
            <strong className="text-cyan-200 font-semibold">{auValue.toLocaleString()}</strong>
            <span className="text-slate-400 text-[10px]">AU</span>
          </div>
        )}
        {kmValue !== null && (
          <div className="flex items-center gap-1">
            <span className="text-emerald-400 text-[10px]">KM:</span>
            <strong className="text-emerald-300 font-semibold">{kmValue.toLocaleString()}</strong>
            <span className="text-slate-400 text-[10px]">km</span>
          </div>
        )}
      </div>
    </div>
  );
}
