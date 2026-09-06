import React from 'react';

export function HeroSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl border border-white/10 bg-[#0C0E12]/80 backdrop-blur-xl p-6 sm:p-8 md:p-10 shadow-2xl overflow-hidden animate-pulse">
      {/* Top telemetry bar placeholder */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
        <div className="h-6 w-44 bg-white/10 rounded-full" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-white/10 rounded-lg" />
          <div className="h-8 w-8 bg-white/10 rounded-lg" />
        </div>
      </div>

      {/* Hero media placeholder */}
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

export function GalleryCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/5 bg-[#0C0E12] overflow-hidden animate-pulse">
      <div className="h-48 w-full bg-white/10" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-1/3 bg-[#E4A853]/20 rounded" />
        <div className="h-5 w-4/5 bg-white/10 rounded" />
        <div className="h-3 w-full bg-white/5 rounded" />
      </div>
    </div>
  );
}

export function GalleryGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <GalleryCardSkeleton key={i} />
      ))}
    </div>
  );
}
