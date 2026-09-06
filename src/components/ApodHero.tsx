/**
 * ApodHero Component
 * 
 * - What the component does:
 *   Renders the primary focal showcase for NASA's Astronomy Picture of the Day.
 *   Displays the high-resolution celestial photograph or video embed, along with
 *   astronomical observation date, author copyright credits, curated analysis,
 *   and interactive controls for favoriting, sharing, downloading, and launching the HD modal viewer.
 * 
 * - Why the design change improves UX:
 *   1. Eliminates layout shifts (CLS) by utilizing responsive aspect constraints and fallback stages.
 *   2. Provides tactile visual feedback with optical reticle corner accents and gold telemetry badges,
 *      giving users the sensation of operating a deep-space observatory console.
 *   3. Supports full keyboard navigation (Space/Enter triggers HD modal, interactive focus rings).
 *   4. Safely accommodates both video streams (YouTube/Vimeo embeds) and high-res imagery without UI breakage.
 * 
 * - How the styling works:
 *   Built using Tailwind CSS utilities with a dark obsidian palette (`bg-[#0C0E12]/90`),
 *   subtle stardust backdrop blur (`backdrop-blur-xl`), gold accent borders (`border-[#E4A853]/25`),
 *   and responsive typography pairing Playfair Display (headings) with Plus Jakarta Sans (body).
 * 
 * - How it fits into the NASA APOD workflow:
 *   Receives normalized `ApodData` from `NasaApod.tsx` (fetched via `/api/apod` or cached storage).
 *   Acts as the primary presentation layer when users browse daily or historical astronomical entries.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  Download, 
  Share2, 
  Star, 
  Sparkles, 
  AlertTriangle, 
  ExternalLink,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  Shuffle,
  BookOpen,
  ListFilter,
  Radio,
  Compass,
  Cpu
} from 'lucide-react';
import { motion } from 'motion/react';
import { ApodData } from '../types';
import { formatDate } from '../utils/dateUtils';
import { parseScientificSummary } from '../utils/textUtils';

interface ApodHeroProps {
  data: ApodData;
  onOpenModal: () => void;
  onToggleFavorite: (item: ApodData) => void;
  isFavorite: boolean;
  onShare: (item: ApodData) => void;
  onRandom?: () => void;
}

export default function ApodHero({
  data,
  onOpenModal,
  onToggleFavorite,
  isFavorite,
  onShare,
  onRandom,
}: ApodHeroProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const isVideo = data.media_type === 'video';

  // Parse explanation into structured, mobile-skimmable stacked cards
  const summary = useMemo(() => {
    return parseScientificSummary(data.explanation, data.title, data.copyright, data.date, data.media_type);
  }, [data.explanation, data.title, data.copyright, data.date, data.media_type]);

  // Listen for native fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  /**
   * Toggles native browser full-screen mode on the image stage.
   */
  const handleToggleFullscreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!document.fullscreenElement) {
      stageRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  /**
   * Toggles in-place tap-to-zoom magnification.
   */
  const handleToggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZoomed(prev => !prev);
  };

  /**
   * Dispatches client-side download for HD celestial imagery.
   */
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const downloadUrl = data.hdurl || data.url;
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Download stream rejected');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = `nasa-apod-${data.date}.jpg`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  /**
   * Keyboard accessibility handler for triggering the full HD modal.
   */
  const handleStageKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenModal();
    }
  };

  return (
    <motion.article
      id="apod-hero-article"
      aria-label={`Astronomy Picture of the Day: ${data.title}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-4xl mx-auto rounded-2xl border border-[#E4A853]/25 bg-[#0C0E12]/95 backdrop-blur-xl p-4 sm:p-7 md:p-9 shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden text-left space-y-6"
    >
      {/* Optical Reticle Corner Accents */}
      <div aria-hidden="true" className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-[#E4A853]/40 pointer-events-none" />
      <div aria-hidden="true" className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-[#E4A853]/40 pointer-events-none" />
      <div aria-hidden="true" className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-[#E4A853]/40 pointer-events-none" />
      <div aria-hidden="true" className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-[#E4A853]/40 pointer-events-none" />

      {/* Observation Date & Feed Tag */}
      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <time
            dateTime={data.date}
            className="px-2.5 py-1 rounded-full bg-[#E4A853]/15 border border-[#E4A853]/30 text-[#E4A853] text-[10px] font-mono uppercase font-bold tracking-wider"
          >
            {formatDate(data.date)}
          </time>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            {isVideo ? 'Video Stream' : 'Deep Space Imagery'}
          </span>
        </div>

        <span className="text-[10px] font-mono text-[#E4A853]/70 uppercase tracking-widest hidden sm:inline">
          NASA APOD ARCHIVE
        </span>
      </div>

      {/* =========================================================================
          4. PRIMARY IMAGE (Mobile Optimized)
          - 100% width, auto height
          - Tap-to-zoom opens full-screen viewer or toggles magnification
          - Reachable zoom pill
          ========================================================================= */}
      <section 
        ref={stageRef}
        className={`relative rounded-xl overflow-hidden bg-black/80 border border-white/10 shadow-inner group ${
          isFullscreen ? 'flex items-center justify-center p-4 bg-black min-h-screen' : ''
        }`}
      >
        {isVideo ? (
          <div className="aspect-video w-full">
            <iframe
              src={data.url}
              title={`NASA APOD Video Stream: ${data.title}`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div
            id="hero-media-stage"
            role="button"
            tabIndex={0}
            onClick={onOpenModal}
            onKeyDown={handleStageKeyDown}
            aria-label={`Inspect high-definition observation in modal: ${data.title}`}
            className="relative cursor-pointer overflow-hidden flex items-center justify-center min-h-[300px] sm:min-h-[440px] focus:outline-none focus:ring-2 focus:ring-[#E4A853] rounded-xl"
          >
            {!imageError ? (
              <>
                {!imageLoaded && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center justify-center bg-[#0C0E12] animate-pulse"
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-[#E4A853]/20 border-t-[#E4A853] animate-spin" />
                  </div>
                )}
                <img
                  src={data.url}
                  alt={`NASA Astronomy Observation: ${data.title}`}
                  loading="eager"
                  decoding="async"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  className={`w-full h-auto max-h-[560px] object-contain transition-all duration-500 ease-out select-none ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  } ${isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'}`}
                />
              </>
            ) : (
              <div className="p-10 text-center text-slate-400 space-y-3">
                <AlertTriangle className="mx-auto text-amber-400" size={32} aria-hidden="true" />
                <p className="text-sm font-mono text-slate-300">Image stream unavailable</p>
                <a
                  href={data.hdurl || data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#E4A853] hover:underline inline-flex items-center gap-1.5 font-mono"
                >
                  Direct NASA Source Link <ExternalLink size={12} aria-hidden="true" />
                </a>
              </div>
            )}

            {/* Tap-to-Zoom & Fullscreen Quick Action Pills (always easily accessible) */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10 pointer-events-auto">
              <button
                id="hero-tap-to-zoom-btn"
                type="button"
                onClick={handleToggleZoom}
                className="min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#050608]/90 hover:bg-[#050608] border border-[#E4A853]/50 text-[#E4A853] text-[11px] font-mono backdrop-blur-md shadow-lg transition-all active:scale-95 cursor-pointer"
                title={isZoomed ? "Reset Zoom" : "Tap to Zoom in"}
              >
                {isZoomed ? <ZoomOut size={13} /> : <ZoomIn size={13} />}
                <span>{isZoomed ? 'Reset Zoom' : 'Tap to Zoom 🔍'}</span>
              </button>

              <button
                id="hero-fullscreen-pill-btn"
                type="button"
                onClick={handleToggleFullscreen}
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-full bg-[#050608]/90 hover:bg-[#050608] border border-[#E4A853]/50 text-[#E4A853] text-[11px] font-mono backdrop-blur-md shadow-lg transition-all active:scale-95 cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Full-Screen Mode"}
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>

            {/* Hover Fullscreen HUD Overlay Indicator */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0C0E12]/90 border border-[#E4A853]/50 text-[#E4A853] text-xs font-mono backdrop-blur-md shadow-xl">
                <Maximize2 size={14} />
                <span>Open Full HD Modal</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Scroll Cue: Guides users down into the stacked summary cards */}
      <div className="flex justify-center -my-1">
        <button
          id="hero-scroll-cue-btn"
          type="button"
          onClick={() => summaryRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.03] hover:bg-[#E4A853]/10 border border-white/10 hover:border-[#E4A853]/40 text-slate-400 hover:text-[#E4A853] text-[10px] font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-sm active:scale-95"
          aria-label="Scroll down to read scientific summary cards"
        >
          <span>Scroll to Discover</span>
          <ChevronDown size={12} className="animate-bounce text-[#E4A853]" />
        </button>
      </div>

      {/* =========================================================================
          5. IMAGE TITLE + QUICK ACTIONS
          - Inline actions for thumb reach
          - Star icon toggles saved state
          - Randomizer boosts engagement
          ========================================================================= */}
      <section id="hero-title-actions-section" className="space-y-3 pt-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-white tracking-tight leading-snug">
          {data.title}
        </h1>

        {/* Inline Quick Action Buttons for Thumb Reach */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* ★ Save / Saved Button */}
          <button
            id="hero-toggle-favorite-btn"
            type="button"
            onClick={() => onToggleFavorite(data)}
            aria-label={isFavorite ? `Remove ${data.title} from favorites` : `Add ${data.title} to favorites`}
            className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer border active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#E4A853]/50 ${
              isFavorite
                ? 'bg-[#E4A853] text-[#050608] border-[#E4A853] font-bold shadow-[0_0_15px_rgba(228,168,83,0.3)]'
                : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/15 hover:border-[#E4A853]/40'
            }`}
          >
            <Star size={14} className={isFavorite ? 'fill-[#050608]' : ''} aria-hidden="true" />
            <span>{isFavorite ? '★ Saved' : '★ Save'}</span>
          </button>

          {/* ⟳ Random Button */}
          {onRandom && (
            <button
              id="hero-random-btn"
              type="button"
              onClick={onRandom}
              aria-label="Randomize celestial observation"
              className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer border bg-white/5 hover:bg-[#E4A853]/15 text-slate-200 hover:text-[#E4A853] border-white/15 hover:border-[#E4A853]/40 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#E4A853]/50"
            >
              <Shuffle size={14} aria-hidden="true" />
              <span>⟳ Random</span>
            </button>
          )}

          {/* Share Action */}
          <button
            id="hero-share-telemetry-btn"
            type="button"
            onClick={() => onShare(data)}
            aria-label="Share this astronomical observation"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-[#E4A853]/40 rounded-xl transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#E4A853]/50"
            title="Share"
          >
            <Share2 size={15} aria-hidden="true" />
          </button>

          {/* Download Action (if image) */}
          {!isVideo && (
            <button
              id="hero-download-image-btn"
              type="button"
              onClick={handleDownload}
              aria-label="Download high-resolution image"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-[#E4A853]/40 rounded-xl transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#E4A853]/50"
              title="Download HD Image"
            >
              <Download size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </section>

      {/* =========================================================================
          6. SCIENTIFIC SUMMARY (Stacked Cards)
          - Card 1: Key Insight
          - Card 2: Scientific Notes (bullet points)
          - Card 3: Mission Context
          - Card layout improves readability and suits mobile vertical scrolling
          ========================================================================= */}
      <section ref={summaryRef} id="hero-scientific-summary-cards" className="space-y-3 pt-2">
        
        {/* Card 1: Key Insight */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-[#E4A853]/30 transition-colors shadow-sm text-left">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#E4A853] font-bold mb-2">
            <BookOpen size={14} className="text-[#E4A853]" aria-hidden="true" />
            <span>Key Insight</span>
          </div>
          <p className="text-slate-200 text-sm font-sans font-light leading-relaxed">
            {summary.keyInsight}
          </p>
        </div>

        {/* Card 2: Scientific Notes */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-[#E4A853]/30 transition-colors shadow-sm text-left">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#E4A853] font-bold mb-2.5">
            <ListFilter size={14} className="text-[#E4A853]" aria-hidden="true" />
            <span>Scientific Notes</span>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm font-sans text-slate-300 font-light leading-relaxed">
            {summary.notes.map((note, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-[#E4A853] font-bold select-none">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Card 3: Mission Context */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-[#E4A853]/30 transition-colors shadow-sm text-left">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#E4A853] font-bold mb-2">
            <Compass size={14} className="text-[#E4A853]" aria-hidden="true" />
            <span>Mission Context</span>
          </div>
          <div className="space-y-1.5 text-xs font-mono text-slate-300">
            <p>
              <span className="text-slate-400">Array/Mission:</span>{' '}
              <span className="text-white font-semibold">{summary.missionContext.instrumentOrMission}</span>
            </p>
            <p>
              <span className="text-slate-400">Credit &amp; Copyright:</span>{' '}
              <span className="text-slate-200">{summary.missionContext.credit}</span>
            </p>
            <p>
              <span className="text-slate-400">Telemetry Stream:</span>{' '}
              <span className="text-[#E4A853]">{summary.missionContext.observationType}</span>
            </p>
          </div>
        </div>

      </section>

      {/* =========================================================================
          7. LIVE TELEMETRY (Compact)
          - Pulsing dot for "active"
          - 4-5 lines max
          - Strictly single-column layout (no horizontal layout that breaks mobile)
          ========================================================================= */}
      <section id="hero-compact-telemetry" className="p-4 rounded-xl bg-black/60 border border-emerald-500/30 text-left space-y-2 shadow-inner">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            Live Telemetry ● Active
          </span>
        </div>

        <div className="text-xs font-mono text-slate-300 space-y-1 pl-4 border-l border-emerald-500/30">
          <p className="text-white font-semibold">JWST (NIRCam) &amp; Deep Space Relay</p>
          <p className="text-slate-400">Core Temp: 6.2 K • DSN Link 300bps</p>
          <p className="text-slate-400">Archival Logs: 11,380+ Records Active</p>
        </div>
      </section>

    </motion.article>
  );
}


