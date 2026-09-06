/**
 * Skeleton Loading Components
 * 
 * - What the component does:
 *   Renders lightweight, pulsed wireframe placeholders that visually match the geometry
 *   of the ApodHero and Gallery components while astronomical data is being fetched over the network.
 * 
 * - Why the design change improves UX:
 *   1. Eliminates Cumulative Layout Shift (CLS) by pre-allocating exact container dimensions.
 *   2. Dramatically enhances perceived performance compared to blank screens or intrusive blocking modals.
 *   3. Conveys active background computation using non-jarring low-frequency pulse animations.
 *   4. Adheres to accessibility best practices via `aria-busy="true"` and descriptive loading labels.
 * 
 * - How the styling works:
 *   Uses Tailwind's `animate-pulse`, dark obsidian backdrops (`bg-[#0C0E12]`), subtle border contours (`border-white/5`),
 *   and translucent fill placeholders (`bg-white/10` and `bg-white/5`).
 * 
 * - How it fits into the NASA APOD workflow:
 *   Displayed by `NasaApod.tsx` and `Gallery.tsx` when awaiting responses from `/api/apod` or local cache resolution.
 */

import React from 'react';

/**
 * HeroSkeleton
 * Matches the exact aspect constraints, action deck, and typography blocks of `ApodHero.tsx`.
 */
export function HeroSkeleton() {
  return (
    <div 
      role="status"
      aria-busy="true"
      aria-label="Loading Astronomy Picture of the Day observation"
      className="w-full max-w-4xl mx-auto rounded-2xl border border-white/10 bg-[#0C0E12]/80 backdrop-blur-xl p-6 sm:p-8 md:p-10 shadow-2xl overflow-hidden animate-pulse"
    >
      {/* Top telemetry bar placeholder */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
        <div className="h-6 w-44 bg-white/10 rounded-full" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-white/10 rounded-lg" />
          <div className="h-8 w-8 bg-white/10 rounded-lg" />
        </div>
      </div>

      {/* Hero media placeholder with central stardust spinner */}
      <div className="w-full h-[360px] sm:h-[460px] rounded-xl bg-white/5 flex items-center justify-center mb-6 overflow-hidden relative">
        <div className="w-16 h-16 rounded-full border-2 border-[#E4A853]/20 border-t-[#E4A853] animate-spin" />
      </div>

      {/* Title & Metadata placeholders */}
      <div className="space-y-3">
        <div className="h-8 w-3/4 bg-white/10 rounded" />
        <div className="h-4 w-1/4 bg-white/5 rounded" />
        <div className="pt-4 space-y-2">
          <div className="h-4 w-full bg-white/5 rounded" />
          <div className="h-4 w-5/6 bg-white/5 rounded" />
          <div className="h-4 w-4/6 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * GalleryCardSkeleton
 * Matches the exact 48-unit media thumbnail and 3-tier card text structure of gallery items.
 */
export function GalleryCardSkeleton() {
  return (
    <div 
      role="status"
      aria-busy="true"
      aria-label="Loading observation card"
      className="rounded-xl border border-white/5 bg-[#0C0E12] overflow-hidden animate-pulse"
    >
      <div className="h-48 w-full bg-white/10" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-1/3 bg-[#E4A853]/20 rounded" />
        <div className="h-5 w-4/5 bg-white/10 rounded" />
        <div className="h-3 w-full bg-white/5 rounded" />
      </div>
    </div>
  );
}

/**
 * GalleryGridSkeleton
 * Renders an array of `GalleryCardSkeleton` items inside a responsive CSS grid.
 */
export function GalleryGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div 
      role="status"
      aria-busy="true"
      aria-label="Loading gallery grid"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {Array.from({ length: count }).map((_, i) => (
        <GalleryCardSkeleton key={i} />
      ))}
    </div>
  );
}

