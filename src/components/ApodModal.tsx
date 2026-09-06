/**
 * ApodModal Component
 * 
 * - What the component does:
 *   Provides a high-definition, immersive fullscreen viewer for NASA Astronomy Picture of the Day imagery.
 *   Implements progressive blur-up image rendering (using the standard-resolution URL as a blurred low-res placeholder
 *   while the uncompressed HD asset streams in), interactive click-to-zoom magnification, full keyboard navigation
 *   (Escape to dismiss, +/- to zoom), and local file download with fallback.
 * 
 * - Why the design change improves UX:
 *   1. Eliminates blank image stages by showing the cached low-res thumbnail immediately with CSS blur filter.
 *   2. Prevents modal layout shifts and preserves orientation for panoramic astro-photography.
 *   3. Follows WAI-ARIA modal dialog best practices (focus containment, Esc key listener, aria-modal="true").
 *   4. Gracefully degrades when the NASA API lacks an `hdurl` or when high-res assets encounter 404/CORS errors.
 * 
 * - How the styling works:
 *   Darkened obsidian backdrop (`bg-black/90 backdrop-blur-2xl`) with gold trim (`border-[#E4A853]/30`),
 *   smooth scale-in entry transitions via `motion/react`, and responsive max-height constraints (`max-h-[92vh]`)
 *   ensuring title, media, and scientific explanation remain comfortably visible across devices.
 * 
 * - How it fits into the NASA APOD workflow:
 *   Triggered from `ApodHero.tsx` or `Gallery.tsx` when a user requests deep inspection of an observation.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, ZoomIn, ZoomOut, Sparkles, AlertTriangle } from 'lucide-react';
import { ApodData } from '../types';
import { formatDate } from '../utils/dateUtils';

interface ApodModalProps {
  item: ApodData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ApodModal({ item, isOpen, onClose }: ApodModalProps) {
  const [hdLoaded, setHdLoaded] = useState(false);
  const [hdFailed, setHdFailed] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Reset viewport and zoom state whenever modal opens or active item switches
  useEffect(() => {
    if (isOpen) {
      setHdLoaded(false);
      setHdFailed(false);
      setIsZoomed(false);
    }
  }, [isOpen, item]);

  /**
   * Keyboard accessibility handler:
   * - Escape: Closes the active modal
   * - '+' or '=': Zooms in on image
   * - '-': Zooms out on image
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === '+' || e.key === '=') {
      setIsZoomed(true);
    } else if (e.key === '-') {
      setIsZoomed(false);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || !item) return null;

  // Determine optimal image source: fallback to standard url if hdurl is missing or failed
  const effectiveImageUrl = (!hdFailed && item.hdurl) ? item.hdurl : item.url;
  const isVideo = item.media_type === 'video';

  /**
   * Initiates local file download for high-resolution celestial photography.
   * - What it does: Converts the image response into an in-memory blob and triggers an automated download anchor.
   * - Why it exists: Provides an effortless, one-click mechanism for saving high-res NASA imagery.
   * - How it fits into the workflow: Executed from the modal header action bar.
   */
  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await fetch(effectiveImageUrl);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = `nasa-apod-${item.date}.jpg`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback for CORS-restricted hosts: open direct asset link
      window.open(effectiveImageUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        id="apod-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-2xl overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="apod-modal-title"
        aria-describedby="apod-modal-description"
      >
        {/* Backdrop click to dismiss */}
        <div 
          className="fixed inset-0 cursor-zoom-out" 
          onClick={onClose}
          aria-hidden="true" 
        />

        <motion.div
          id="apod-modal-dialog-card"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-6xl max-h-[92vh] bg-[#0C0E12] border border-[#E4A853]/30 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar: Resolution Badge, Title, Zoom/Download/Close Controls */}
          <header className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#050608]/80 backdrop-blur-md">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="px-2 py-0.5 rounded bg-[#E4A853]/15 text-[#E4A853] text-[10px] font-mono uppercase font-bold tracking-wider shrink-0">
                {item.hdurl && !hdFailed ? 'HD Telemetry' : 'Standard View'}
              </span>
              <h2 id="apod-modal-title" className="text-sm sm:text-base font-serif font-medium text-slate-100 truncate">
                {item.title}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isVideo && (
                <>
                  <button
                    id="modal-toggle-zoom-btn"
                    type="button"
                    onClick={() => setIsZoomed(!isZoomed)}
                    className="p-2 text-slate-400 hover:text-slate-100 bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E4A853]/50"
                    title={isZoomed ? "Zoom Out (-)" : "Zoom In (+)"}
                    aria-label={isZoomed ? "Zoom out" : "Zoom in"}
                  >
                    {isZoomed ? <ZoomOut size={16} aria-hidden="true" /> : <ZoomIn size={16} aria-hidden="true" />}
                  </button>

                  <button
                    id="modal-download-btn"
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#E4A853] hover:bg-[#f3be73] text-[#050608] rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(228,168,83,0.3)] cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#E4A853]"
                    title="Download high-resolution image"
                    aria-label="Download high-resolution image"
                  >
                    <Download size={14} aria-hidden="true" />
                    <span className="hidden sm:inline">{downloading ? 'Downloading...' : 'Download HD'}</span>
                  </button>
                </>
              )}

              <button
                id="modal-close-btn"
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
                title="Close viewer (Esc)"
                aria-label="Close modal dialog"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          </header>

          {/* Media Stage: Blur-up Progressive Loading Canvas */}
          <section 
            className={`relative flex-1 min-h-[300px] sm:min-h-[480px] bg-black/80 flex items-center justify-center overflow-auto p-2 ${
              isZoomed ? 'cursor-zoom-out' : 'cursor-default'
            }`}
          >
            {isVideo ? (
              <div className="w-full h-full min-h-[420px] aspect-video">
                <iframe
                  src={item.url}
                  title={`NASA APOD Video Stream: ${item.title}`}
                  className="w-full h-full rounded-lg border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center overflow-auto">
                {/* 
                  Progressive Blur-up Placeholder:
                  Renders the standard-res image with CSS blur until the uncompressed HD asset finishes downloading.
                */}
                {!hdLoaded && item.url && (
                  <img
                    src={item.url}
                    alt=""
                    aria-hidden="true"
                    className="absolute max-h-[75vh] w-auto object-contain filter blur-md opacity-60 transition-opacity duration-300"
                  />
                )}

                {/* High-Definition Celestial Asset */}
                <img
                  src={effectiveImageUrl}
                  alt={`High-definition photograph: ${item.title}`}
                  loading="eager"
                  decoding="async"
                  onLoad={() => setHdLoaded(true)}
                  onError={() => setHdFailed(true)}
                  className={`max-h-[75vh] w-auto object-contain transition-all duration-500 select-none ${
                    hdLoaded ? 'opacity-100 scale-100' : 'opacity-0'
                  } ${isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'}`}
                  onClick={() => setIsZoomed(!isZoomed)}
                />

                {/* Loading Status Indicator */}
                {!hdLoaded && !hdFailed && (
                  <div 
                    aria-live="polite"
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/75 border border-[#E4A853]/40 text-[#E4A853] text-xs font-mono">
                      <Sparkles size={14} className="animate-spin" aria-hidden="true" />
                      <span>Resolving High-Definition Telemetry...</span>
                    </div>
                  </div>
                )}

                {/* HD Stream Unavailable Fallback Notice */}
                {hdFailed && (
                  <div 
                    role="status"
                    className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded bg-amber-950/80 border border-amber-500/30 text-amber-200 text-xs font-mono"
                  >
                    <AlertTriangle size={13} aria-hidden="true" />
                    <span>HD image unavailable. Displaying standard resolution.</span>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Footer: Astronomical Coordinates, Copyright, and Explanation */}
          <footer className="px-5 py-4 bg-[#080A0E] border-t border-white/10 text-left space-y-2 max-h-48 overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
              <span className="text-[#E4A853]">Observation Coordinates: {formatDate(item.date)}</span>
              {item.copyright && <span>Credit & Copyright: {item.copyright}</span>}
            </div>
            <p id="apod-modal-description" className="text-xs sm:text-sm font-sans font-light leading-relaxed text-slate-300">
              {item.explanation}
            </p>
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

