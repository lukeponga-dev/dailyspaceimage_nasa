/**
 * ApodImage Component
 * 
 * - What the component does:
 *   Renders NASA APOD imagery with responsive layout, progressive stream loading,
 *   and direct one-click triggering into the full-screen `ImageExpansionOverlay` for
 *   deep astrophotography inspection (zoom, pan, spectral filters, mini-map, HD toggle).
 * 
 * - Why it exists:
 *   Provides a self-contained image viewer that can seamlessly trigger deep detail inspection.
 * 
 * - How it fits into the NASA APOD workflow:
 *   Used whenever APOD images are rendered with expandable capabilities.
 */

import React, { useState } from 'react';
import { ZoomIn, Maximize2, AlertCircle, Sparkles, Sliders } from 'lucide-react';
import { ApodData } from '../types';
import ImageExpansionOverlay from './ImageExpansionOverlay';

interface ApodImageProps {
  data: ApodData;
  onOpenHdModal?: () => void;
  className?: string;
  allowSelfOverlay?: boolean;
}

export default function ApodImage({
  data,
  onOpenHdModal,
  className = '',
  allowSelfOverlay = true
}: ApodImageProps) {
  const [internalOverlayOpen, setInternalOverlayOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [preferHd, setPreferHd] = useState(false);

  const isVideo = data.media_type === 'video';
  const displayUrl = preferHd && data.hdurl ? data.hdurl : data.url;

  const handleOpenExpansion = () => {
    if (onOpenHdModal) {
      onOpenHdModal();
    } else if (allowSelfOverlay) {
      setInternalOverlayOpen(true);
    }
  };

  return (
    <>
      <div
        id={`apod-image-stage-${data.date}`}
        className={`relative w-full rounded-2xl overflow-hidden bg-black/90 border border-white/10 shadow-2xl group ${className}`}
      >
        {isVideo ? (
          <div className="relative aspect-video w-full">
            <iframe
              src={data.url}
              title={data.title}
              className="w-full h-full rounded-2xl border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={handleOpenExpansion}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOpenExpansion();
              }
            }}
            aria-label={`Expand image for full-screen detail inspection: ${data.title}`}
            className="relative min-h-[340px] sm:min-h-[460px] md:min-h-[540px] flex items-center justify-center overflow-hidden cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-[#E4A853]"
          >
            {/* Progressive Skeleton Loader */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 animate-pulse">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-[#E4A853]/30 text-[#E4A853] text-xs font-mono">
                  <Sparkles size={14} className="animate-spin" aria-hidden="true" />
                  <span>Loading Astronomical Telemetry Stream...</span>
                </div>
              </div>
            )}

            {/* Fallback error notice */}
            {imageError && (
              <div className="p-8 text-center text-slate-400 space-y-2 font-mono">
                <AlertCircle className="mx-auto text-amber-400" size={32} />
                <p className="text-sm text-slate-200">Failed to render cosmic imagery stream.</p>
              </div>
            )}

            {/* Main Astronomical Image Stage */}
            <img
              src={displayUrl}
              alt={data.title}
              loading="eager"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full max-h-[72vh] object-contain transition-all duration-300 select-none group-hover:scale-[1.01] ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Hover Expand Cue Banner */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0C0E12]/95 border border-[#E4A853]/60 text-[#E4A853] text-xs font-mono backdrop-blur-md shadow-2xl">
                <Maximize2 size={14} />
                <span>Click to Expand &amp; Inspect (Full-Screen HD)</span>
              </div>
            </div>

            {/* Floating Action Controls Overlay */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10 pointer-events-auto">
              {data.hdurl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreferHd(!preferHd);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#E4A853] ${
                    preferHd
                      ? 'bg-[#E4A853] text-[#050608] border-[#E4A853] shadow-[0_0_12px_rgba(228,168,83,0.5)]'
                      : 'bg-black/70 hover:bg-black/90 text-slate-200 border-white/20'
                  }`}
                  title="Toggle standard vs. high-definition stream"
                >
                  {preferHd ? 'HD 4K' : 'SD'}
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenExpansion();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-[#E4A853] hover:text-[#ffd99e] border border-[#E4A853]/40 transition-colors cursor-pointer text-xs font-mono"
                title="Expand Full-Screen Detail Viewer"
                aria-label="Expand Full-Screen Detail Viewer"
              >
                <Maximize2 size={14} />
                <span className="hidden sm:inline">Expand HD</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Self-contained Expansion Overlay */}
      {allowSelfOverlay && !onOpenHdModal && (
        <ImageExpansionOverlay
          item={data}
          isOpen={internalOverlayOpen}
          onClose={() => setInternalOverlayOpen(false)}
        />
      )}
    </>
  );
}
