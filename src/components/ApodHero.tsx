/**
 * ApodHero Component
 * 
 * - What the component does:
 *   Renders the primary focal showcase for NASA's Astronomy Picture of the Day.
 *   Displays the high-resolution celestial photograph or video embed, along with
 *   tap-to-zoom magnification, persistent action controls (★ Save, ⟳ Random, Share, Download),
 *   scroll guidance cues, stacked scientific summary cards (Key Insight, Scientific Notes, Mission Context),
 *   and live animated telemetry metrics.
 * 
 * - Why the design change improves UX:
 *   1. Eliminates layout shifts (CLS) by utilizing responsive aspect constraints and fallback stages.
 *   2. Tap-to-zoom and click-to-open HD modal allow immediate full-screen inspection of deep-space photography.
 *   3. Persistent inline and sticky thumb-reach action bars ensure the "★ Save" and "⟳ Random" buttons are always accessible.
 *   4. Animated scroll cue guides mobile users seamlessly into the scientific breakdown.
 *   5. Real-time animated telemetry with multi-ring radar pulse and ambient data flow.
 * 
 * - How the styling works:
 *   Built using Tailwind CSS utilities with a dark obsidian palette (`bg-[#0C0E12]/95`),
 *   subtle stardust backdrop blur (`backdrop-blur-xl`), gold accent borders (`border-[#E4A853]/25`),
 *   and responsive typography pairing Playfair Display (headings) with Plus Jakarta Sans (body).
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Maximize2 as MaximizeIcon, 
  Minimize2 as MinimizeIcon, 
  Download as DownloadIcon, 
  Share2 as ShareIcon, 
  Star as StarIcon, 
  Sparkles as SparklesIcon, 
  AlertTriangle as AlertTriangleIcon, 
  ExternalLink as ExternalLinkIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  ChevronDown as ChevronDownIcon,
  Shuffle as ShuffleIcon,
  BookOpen as BookOpenIcon,
  ListFilter as ListFilterIcon,
  Compass as CompassIcon,
  Activity as ActivityIcon,
  Radio as RadioIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { ApodData } from '../types';
import { formatDate } from '../utils/dateUtils';
import { parseScientificSummary } from '../utils/textUtils';
import { buildApodTelemetry } from '../lib/apodClassifier';
import CategoryBadge from './CategoryBadge';
import DistanceDisplay from './DistanceDisplay';
import TelemetryPanel from './TelemetryPanel';

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

  // Compute or extract astrometric classification & distance telemetry
  const telemetry = useMemo(() => {
    if (data.category && data.confidence !== undefined && data.distance) {
      return {
        category: data.category,
        confidence: data.confidence,
        matchedKeywords: data.matchedKeywords || [],
        distanceLightYears: data.distanceLightYears ?? null,
        distance: data.distance
      };
    }
    return buildApodTelemetry({ title: data.title, explanation: data.explanation });
  }, [data.title, data.explanation, data.category, data.confidence, data.matchedKeywords, data.distanceLightYears, data.distance]);

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
          1. TAP-TO-ZOOM / FULL-SCREEN IMAGE VIEWER
          - 100% width, auto height
          - Tap-to-zoom opens full-screen viewer or toggles in-place magnification
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
                <AlertTriangleIcon className="mx-auto text-amber-400" size={32} aria-hidden="true" />
                <p className="text-sm font-mono text-slate-300">Image stream unavailable</p>
                <a
                  href={data.hdurl || data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#E4A853] hover:underline inline-flex items-center gap-1.5 font-mono"
                >
                  Direct NASA Source Link <ExternalLinkIcon size={12} aria-hidden="true" />
                </a>
              </div>
            )}

            {/* Expand Fullscreen & Quick Action Pills */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10 pointer-events-auto">
              <button
                id="hero-expand-detail-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenModal();
                }}
                className="min-h-[38px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#050608]/90 hover:bg-[#050608] border border-[#E4A853]/60 text-[#E4A853] text-[11px] font-mono backdrop-blur-md shadow-xl transition-all active:scale-95 cursor-pointer hover:border-[#E4A853] hover:text-[#ffd99e]"
                title="Expand image in full-screen detail inspection overlay"
              >
                <MaximizeIcon size={13} />
                <span>Expand Detail View</span>
              </button>

              <button
                id="hero-tap-to-zoom-btn"
                type="button"
                onClick={handleToggleZoom}
                className="min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#050608]/90 hover:bg-[#050608] border border-white/20 text-slate-300 text-[11px] font-mono backdrop-blur-md shadow-lg transition-all active:scale-95 cursor-pointer"
                title={isZoomed ? "Reset In-Place Zoom" : "Quick Zoom In-Place"}
              >
                {isZoomed ? <ZoomOutIcon size={13} /> : <ZoomInIcon size={13} />}
                <span>{isZoomed ? 'Reset' : 'Quick Zoom'}</span>
              </button>
            </div>

            {/* Hover Fullscreen HUD Overlay Indicator */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0C0E12]/95 border border-[#E4A853]/60 text-[#E4A853] text-xs font-mono backdrop-blur-md shadow-2xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
                <MaximizeIcon size={15} />
                <span>Click image to expand in full-screen detail viewer</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          4. SCROLL CUE UNDER HERO SECTION
          - Prominent animated scroll indicator with bouncing chevron
          - Smoothly scrolls viewport to the scientific cards and telemetry
          ========================================================================= */}
      <div className="flex justify-center -my-1">
        <button
          id="hero-scroll-cue-btn"
          type="button"
          onClick={() => summaryRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#050608]/90 hover:bg-[#0C0E12] border border-[#E4A853]/35 hover:border-[#E4A853] text-[#E4A853] text-xs font-mono tracking-wider transition-all duration-300 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.8),0_0_15px_rgba(228,168,83,0.15)] active:scale-95"
          aria-label="Scroll down to read scientific summary cards"
        >
          <span className="font-semibold">Scroll to Discover</span>
          <ChevronDownIcon size={14} className="animate-bounce text-[#FFD700]" />
        </button>
      </div>

      {/* =========================================================================
          2. PERSISTENT INLINE ACTION BAR & TITLE
          - Save button (toggles saved state with gold glow)
          - Random Image button
          - Share and Download actions within thumb reach
          ========================================================================= */}
      <section id="hero-title-actions-section" className="space-y-3 pt-2">
        {/* Astrometric Classification & Distance Header Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge
            category={telemetry.category}
            confidence={telemetry.confidence}
            showConfidence
            size="md"
          />
          <DistanceDisplay
            distance={telemetry.distance}
            distanceLightYears={telemetry.distanceLightYears}
            variant="inline"
          />
        </div>

        <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-white tracking-tight leading-snug">
          {data.title}
        </h1>

        {/* Inline Quick Action Buttons for Thumb Reach */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* Save / Saved Button */}
          <button
            id="hero-toggle-favorite-btn"
            type="button"
            onClick={() => onToggleFavorite(data)}
            aria-label={isFavorite ? `Remove ${data.title} from favorites` : `Add ${data.title} to favorites`}
            className={`min-h-[46px] flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer border active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#E4A853] ${
              isFavorite
                ? 'bg-[#E4A853] text-[#050608] border-[#E4A853] font-bold shadow-[0_0_20px_rgba(228,168,83,0.4)]'
                : 'bg-white/5 hover:bg-white/10 text-slate-100 border-white/20 hover:border-[#E4A853]/60'
            }`}
          >
            <StarIcon size={16} className={isFavorite ? 'fill-[#050608]' : 'text-[#E4A853]'} aria-hidden="true" />
            <span className="font-semibold tracking-wide">
              {isFavorite ? 'Saved' : 'Save'}
            </span>
          </button>

          {/* Random Image Button */}
          {onRandom && (
            <button
              id="hero-random-btn"
              type="button"
              onClick={onRandom}
              aria-label="Randomize celestial observation"
              className="min-h-[46px] flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer border bg-white/5 hover:bg-[#E4A853]/15 text-slate-200 hover:text-[#E4A853] border-white/20 hover:border-[#E4A853]/60 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#E4A853]"
            >
              <ShuffleIcon size={15} className="text-[#E4A853]" aria-hidden="true" />
              <span>Random Image</span>
            </button>
          )}

          {/* Share Action */}
          <button
            id="hero-share-telemetry-btn"
            type="button"
            onClick={() => onShare(data)}
            aria-label="Share this astronomical observation"
            className="min-h-[46px] min-w-[46px] flex items-center justify-center p-2.5 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/20 hover:border-[#E4A853]/60 rounded-xl transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#E4A853]"
            title="Share observation"
          >
            <ShareIcon size={16} aria-hidden="true" />
          </button>

          {/* Download Action (if image) */}
          {!isVideo && (
            <button
              id="hero-download-image-btn"
              type="button"
              onClick={handleDownload}
              aria-label="Download high-resolution image"
              className="min-h-[46px] min-w-[46px] flex items-center justify-center p-2.5 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/20 hover:border-[#E4A853]/60 rounded-xl transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#E4A853]"
              title="Download HD Image"
            >
              <DownloadIcon size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </section>

      {/* =========================================================================
          3. CARD-BASED SCIENTIFIC SUMMARY (Stacked Architecture)
          - Card 1: Key Insight
          - Card 2: Scientific Notes (concise bullet points)
          - Card 3: Mission Context
          ========================================================================= */}
      <section ref={summaryRef} id="hero-scientific-summary-cards" className="space-y-3 pt-2">
        
        {/* Card 1: Key Insight */}
        <div className="p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-[#E4A853]/40 transition-colors shadow-sm text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#E4A853] font-bold">
            <BookOpenIcon size={15} className="text-[#E4A853]" aria-hidden="true" />
            <span>Key Insight</span>
          </div>
          <p className="text-slate-200 text-sm font-sans font-light leading-relaxed">
            {summary.keyInsight}
          </p>
        </div>

        {/* Card 2: Scientific Notes */}
        <div className="p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-[#E4A853]/40 transition-colors shadow-sm text-left space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#E4A853] font-bold">
            <ListFilterIcon size={15} className="text-[#E4A853]" aria-hidden="true" />
            <span>Scientific Notes</span>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm font-sans text-slate-300 font-light leading-relaxed">
            {summary.notes.map((note, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="text-[#E4A853] font-bold select-none text-base leading-none mt-0.5">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Card 3: Mission Context */}
        <div className="p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-[#E4A853]/40 transition-colors shadow-sm text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#E4A853] font-bold">
            <CompassIcon size={15} className="text-[#E4A853]" aria-hidden="true" />
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
              <span className="text-[#E4A853] font-medium">{summary.missionContext.observationType}</span>
            </p>
          </div>
        </div>

      </section>

      {/* =========================================================================
          5. TELEMETRY PANEL (Live radar pulse, category badge, and multi-unit distance)
          ========================================================================= */}
      <TelemetryPanel
        category={telemetry.category}
        confidence={telemetry.confidence}
        matchedKeywords={telemetry.matchedKeywords}
        distanceLightYears={telemetry.distanceLightYears}
        distance={telemetry.distance}
        isLive={true}
        carrierRate="300 bps"
      />

    </motion.article>
  );
}
