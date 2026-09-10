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
import ApodVideoPlayer from './ApodVideoPlayer';
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
import ImagePreloader from './ImagePreloader';

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
  const handleToggleZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
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
      className="relative w-full max-w-4xl mx-auto rounded-2xl border border-white/5 bg-void/60 backdrop-blur-2xl p-4 sm:p-7 md:p-9 shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden text-left space-y-8"
    >
      {/* Optical Reticle Corner Accents */}
      <div aria-hidden="true" className="absolute top-4 left-4 w-6 h-6 border-l border-t border-gold/30 pointer-events-none" />
      <div aria-hidden="true" className="absolute top-4 right-4 w-6 h-6 border-r border-t border-gold/30 pointer-events-none" />
      <div aria-hidden="true" className="absolute bottom-4 left-4 w-6 h-6 border-l border-b border-gold/30 pointer-events-none" />
      <div aria-hidden="true" className="absolute bottom-4 right-4 w-6 h-6 border-r border-b border-gold/30 pointer-events-none" />

      {/* Observation Date & Feed Tag */}
      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <time
            dateTime={data.date}
            className="px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] font-mono uppercase font-bold tracking-[0.2em]"
          >
            {formatDate(data.date)}
          </time>
          <span className="text-[10px] font-mono text-orbit-silver uppercase tracking-widest font-bold opacity-60">
            {isVideo ? 'Stream' : 'IMAGERY'}
          </span>
        </div>

        <span className="text-[10px] font-mono text-gold/60 uppercase tracking-[0.2em] font-bold hidden sm:inline">
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
            <ApodVideoPlayer
              url={data.url}
              title={`NASA APOD Video Stream: ${data.title}`}
              className="w-full h-full border-0 rounded-xl"
            />
          </div>
        ) : (
          <ImagePreloader
            src={data.url}
            hdUrl={data.hdurl}
            date={data.date}
            title={data.title}
            alt={`NASA Astronomy Observation: ${data.title}`}
            enableZoom={true}
            isZoomed={isZoomed}
            onToggleZoom={handleToggleZoom}
            onOpenModal={onOpenModal}
            showQualityToggle={Boolean(data.hdurl)}
            loadingLabel={`Synchronizing stream for ${formatDate(data.date)}...`}
            priority={true}
            minHeight="min-h-[300px] sm:min-h-[440px] md:min-h-[520px]"
          />
        )}
      </section>

      {/* =========================================================================
          4. SCROLL CUE UNDER HERO SECTION
          - Prominent animated scroll indicator with bouncing chevron
          - Smoothly scrolls viewport to the scientific cards and telemetry
          ========================================================================= */}
      <div className="flex justify-center -my-2">
        <button
          id="hero-scroll-cue-btn"
          type="button"
          onClick={() => summaryRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-void/90 border border-gold/20 hover:border-gold text-gold text-[10px] font-mono font-bold tracking-[0.2em] uppercase transition-all duration-500 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(227,164,92,0.1)] active:scale-95"
          aria-label="Scroll down"
        >
          <span>SCAN DETAILS</span>
          <ChevronDownIcon size={14} className="animate-bounce" />
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

        <h1 className="text-2xl sm:text-3xl md:text-5xl font-sans font-bold text-stellar-white tracking-tight leading-[1.2] uppercase">
          {data.title}
        </h1>

        {/* Inline Quick Action Buttons for Thumb Reach */}
        <div className="flex flex-wrap items-center gap-3 pt-4">
          {/* Save / Saved Button */}
          <button
            id="hero-toggle-favorite-btn"
            type="button"
            onClick={() => onToggleFavorite(data)}
            aria-label={isFavorite ? `Remove ${data.title} from favorites` : `Add ${data.title} to favorites`}
            className={`min-h-[48px] flex items-center gap-2.5 px-6 py-2.5 rounded-2xl text-[11px] font-mono transition-all cursor-pointer border active:scale-95 focus:outline-none ${
              isFavorite
                ? 'bg-gold text-void border-gold font-bold shadow-[0_0_25px_rgba(227,164,92,0.4)]'
                : 'bg-white/5 hover:bg-gold/10 text-stellar-white border-white/10 hover:border-gold/50'
            }`}
          >
            <StarIcon size={16} className={isFavorite ? 'fill-void' : 'text-gold'} aria-hidden="true" />
            <span className="font-bold tracking-[0.1em] uppercase">
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
              className="min-h-[48px] flex items-center gap-2.5 px-6 py-2.5 rounded-2xl text-[11px] font-mono font-bold transition-all cursor-pointer border bg-white/5 hover:bg-gold/10 text-stellar-white border-white/10 hover:border-gold/50 active:scale-95 focus:outline-none uppercase tracking-[0.1em]"
            >
              <ShuffleIcon size={15} className="text-gold" aria-hidden="true" />
              <span>Randomize</span>
            </button>
          )}

          {/* Share Action */}
          <button
            id="hero-share-telemetry-btn"
            type="button"
            onClick={() => onShare(data)}
            aria-label="Share this astronomical observation"
            className="min-h-[48px] min-w-[48px] flex items-center justify-center p-2.5 text-stellar-white hover:text-gold bg-white/5 hover:bg-gold/10 border border-white/10 hover:border-gold/50 rounded-2xl transition-all cursor-pointer active:scale-95 focus:outline-none"
            title="Share"
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
              className="min-h-[48px] min-w-[48px] flex items-center justify-center p-2.5 text-stellar-white hover:text-gold bg-white/5 hover:bg-gold/10 border border-white/10 hover:border-gold/50 rounded-2xl transition-all cursor-pointer active:scale-95 focus:outline-none"
              title="Download HD"
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
      <section ref={summaryRef} id="hero-scientific-summary-cards" className="space-y-4 pt-4">
        
        {/* Card 1: Key Insight */}
        <div className="p-6 rounded-2xl bg-void/30 border border-white/5 hover:border-gold/20 transition-all duration-500 shadow-sm text-left space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-gold font-bold">
            <BookOpenIcon size={15} className="text-gold" aria-hidden="true" />
            <span>Core Intel</span>
          </div>
          <p className="text-orbit-silver text-base font-sans font-medium leading-relaxed opacity-90">
            {summary.keyInsight}
          </p>
        </div>

        {/* Card 2: Scientific Notes */}
        <div className="p-6 rounded-2xl bg-void/30 border border-white/5 hover:border-gold/20 transition-all duration-500 shadow-sm text-left space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-gold font-bold">
            <ListFilterIcon size={15} className="text-gold" aria-hidden="true" />
            <span>Spectral Findings</span>
          </div>
          <ul className="space-y-3 text-[13px] font-sans text-orbit-silver font-medium leading-relaxed">
            {summary.notes.map((note, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="text-gold font-bold select-none text-lg leading-none mt-[-2px]">•</span>
                <span className="opacity-80">{note}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Card 3: Mission Context */}
        <div className="p-6 rounded-2xl bg-void/40 border border-white/5 hover:border-gold/30 transition-all duration-500 shadow-2xl text-left space-y-4 group/card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.2em] text-gold font-bold">
              <div className="p-1.5 rounded-lg bg-gold/10 border border-gold/20">
                <CompassIcon size={15} className="text-gold" aria-hidden="true" />
              </div>
              <span>Uplink Context</span>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-gold/10 text-gold border border-gold/20 uppercase tracking-[0.2em] font-bold">
              SECURE
            </span>
          </div>
          <div className="space-y-3 text-[11px] font-mono text-orbit-silver bg-white/[0.02] p-4 rounded-xl border border-white/5">
            <p className="flex justify-between items-center">
              <span className="opacity-60 uppercase tracking-widest">Antenna/Mission</span>{' '}
              <span className="text-stellar-white font-bold uppercase">{summary.missionContext.instrumentOrMission}</span>
            </p>
            <div className="h-px w-full bg-white/5" />
            <p className="flex justify-between items-center">
              <span className="opacity-60 uppercase tracking-widest">Origin Source</span>{' '}
              <span className="text-stellar-white truncate max-w-[200px] uppercase font-bold" title={summary.missionContext.credit}>{summary.missionContext.credit}</span>
            </p>
            <div className="h-px w-full bg-white/5" />
            <p className="flex justify-between items-center">
              <span className="opacity-60 uppercase tracking-widest">Protocol Type</span>{' '}
              <span className="text-gold font-bold uppercase">{summary.missionContext.observationType}</span>
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
