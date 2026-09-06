/**
 * ApodImage Component
 * 
 * - What it does:
 *   Handles responsive image rendering with tap-to-zoom magnification, standard vs HD resolution toggle,
 *   progressive loading states, video stream iframe embedding, and full-screen controls.
 * 
 * - Why it exists:
 *   Isolates high-definition imagery rendering logic with gesture handling and performance optimizations.
 */

import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize, AlertCircle, Video, Sparkles } from 'lucide-react';
import { ApodData } from '../types';

interface ApodImageProps {
  data: ApodData;
  onOpenHdModal?: () => void;
  className?: string;
}

export default function ApodImage({
  data,
  onOpenHdModal,
  className = ''
}: ApodImageProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [preferHd, setPreferHd] = useState(false);

  const isVideo = data.media_type === 'video';
  const displayUrl = preferHd && data.hdurl ? data.hdurl : data.url;

  return (
    <div
      id="apod-image-stage"
      className={`relative w-full rounded-2xl overflow-hidden bg-black/90 border border-white/10 shadow-2xl group ${className}`}
    >
      {isVideo ? (
        <div className="relative aspect-video w-full">
          <iframe
            src={data.url}
            title={data.title}
            className="w-full h-full rounded-2xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div
          className={`relative min-h-[340px] sm:min-h-[460px] md:min-h-[540px] flex items-center justify-center overflow-hidden cursor-zoom-in ${
            isZoomed ? 'cursor-zoom-out' : ''
          }`}
          onClick={() => setIsZoomed(!isZoomed)}
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
            className={`w-full max-h-[72vh] object-contain transition-transform duration-300 select-none ${
              isZoomed ? 'scale-150 sm:scale-175' : 'scale-100'
            } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Floating Action Controls Overlay */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            {data.hdurl && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreferHd(!preferHd);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E4A853] ${
                  preferHd
                    ? 'bg-[#E4A853] text-[#050608] border-[#E4A853] shadow-[0_0_12px_rgba(228,168,83,0.5)]'
                    : 'bg-black/60 hover:bg-black/80 text-slate-200 border-white/20'
                }`}
                title="Toggle standard vs. high-definition stream"
              >
                {preferHd ? 'HD ACTIVE' : 'SD'}
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(!isZoomed);
              }}
              className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-slate-200 hover:text-white border border-white/20 transition-colors cursor-pointer"
              title={isZoomed ? "Zoom Out" : "Zoom In"}
              aria-label={isZoomed ? "Zoom Out" : "Zoom In"}
            >
              {isZoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
            </button>

            {onOpenHdModal && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenHdModal();
                }}
                className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-slate-200 hover:text-white border border-white/20 transition-colors cursor-pointer"
                title="Open Fullscreen HD Modal"
                aria-label="Open Fullscreen HD Modal"
              >
                <Maximize size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
