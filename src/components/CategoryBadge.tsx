/**
 * CategoryBadge Component
 * 
 * - What it does:
 *   Renders a styled badge indicating the classified celestial target taxonomy
 *   (e.g., Dwarf Planet, Extragalactic System, Nebula) along with optional confidence rating.
 * 
 * - Why it exists:
 *   Standardizes astrometric category labeling across Hero, Gallery, and Modal views.
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { formatCategoryName } from '../lib/apodClassifier';

interface CategoryBadgeProps {
  category: string;
  confidence?: number;
  showConfidence?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CategoryBadge({
  category,
  confidence,
  showConfidence = false,
  className = '',
  size = 'md'
}: CategoryBadgeProps) {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-[11px] px-2.5 py-1 gap-1.5',
    lg: 'text-xs px-3 py-1.5 gap-2'
  };

  const formattedName = formatCategoryName(category);

  return (
    <div className={`inline-flex items-center flex-wrap gap-2 ${className}`}>
      <span
        id={`category-badge-${category}`}
        className={`inline-flex items-center rounded-full bg-[#E4A853]/15 border border-[#E4A853]/40 text-[#FFD700] font-mono font-semibold uppercase tracking-wider ${sizeClasses[size]}`}
      >
        <Sparkles size={size === 'sm' ? 10 : 12} className="text-[#E4A853]" aria-hidden="true" />
        <span>{formattedName}</span>
      </span>

      {showConfidence && confidence !== undefined && (
        <span
          id={`confidence-tag-${category}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px] font-mono"
        >
          <span>Confidence:</span>
          <span className="text-emerald-400 font-semibold">{Math.round(confidence * 100)}%</span>
        </span>
      )}
    </div>
  );
}
