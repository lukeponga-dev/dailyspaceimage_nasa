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

import React, { useState } from 'react';
import { Maximize2, Download, Share2, Star, Sparkles, AlertTriangle, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { ApodData } from '../types';
import { formatDate } from '../utils/dateUtils';

interface ApodHeroProps {
  data: ApodData;
  onOpenModal: () => void;
  onToggleFavorite: (item: ApodData) => void;
  isFavorite: boolean;
  onShare: (item: ApodData) => void;
}

export default function ApodHero({
  data,
  onOpenModal,
  onToggleFavorite,
  isFavorite,
  onShare,
}: ApodHeroProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isVideo = data.media_type === 'video';

  /**
   * Dispatches client-side download for HD celestial imagery.
   * - What it does: Fetches the image blob and initiates a browser file download.
   * - Why it exists: Grants users direct local access to high-resolution NASA photography.
   * - How it fits into the workflow: Triggered from the hero action bar; falls back to direct URL in a new tab if CORS blocks client blobs.
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
      // Fallback: direct window redirect for cross-origin resources
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  /**
   * Keyboard accessibility handler for triggering the full HD modal.
   * Enables keyboard users to activate the zoom modal via Enter or Space.
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
      className="relative w-full max-w-4xl mx-auto rounded-2xl border border-[#E4A853]/25 bg-[#0C0E12]/90 backdrop-blur-xl p-6 sm:p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden text-left"
    >
      {/* Visual Reticle Corner Accents mimicking astronomical telescope HUDs */}
      <div aria-hidden="true" className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-[#E4A853]/40 pointer-events-none" />
      <div aria-hidden="true" className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-[#E4A853]/40 pointer-events-none" />
      <div aria-hidden="true" className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-[#E4A853]/40 pointer-events-none" />
      <div aria-hidden="true" className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-[#E4A853]/40 pointer-events-none" />

      {/* Top Header: Observation Timestamp & Interactive Action Controls */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <time
            dateTime={data.date}
            className="px-2.5 py-1 rounded-full bg-[#E4A853]/15 border border-[#E4A853]/30 text-[#E4A853] text-[10px] font-mono uppercase font-bold tracking-wider"
          >
            {formatDate(data.date)}
          </time>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            {isVideo ? 'Astronomy Video Stream' : 'Deep Space Imagery'}
          </span>
        </div>

        {/* Action Controls: Favorite, Share, Download */}
        <div className="flex items-center gap-2">
          <button
            id="hero-toggle-favorite-btn"
            type="button"
            onClick={() => onToggleFavorite(data)}
            aria-label={isFavorite ? `Remove ${data.title} from favorites` : `Add ${data.title} to favorites`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer border focus:outline-none focus:ring-2 focus:ring-[#E4A853]/50 ${
              isFavorite
                ? 'bg-[#E4A853] text-[#050608] border-[#E4A853] font-bold shadow-[0_0_15px_rgba(228,168,83,0.3)]'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
            }`}
          >
            <Star size={13} className={isFavorite ? 'fill-[#050608]' : ''} aria-hidden="true" />
            <span className="hidden sm:inline">{isFavorite ? 'Saved' : 'Favorite'}</span>
          </button>

          <button
            id="hero-share-telemetry-btn"
            type="button"
            onClick={() => onShare(data)}
            aria-label="Share this astronomical observation"
            className="p-2 text-slate-400 hover:text-slate-100 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E4A853]/50"
          >
            <Share2 size={15} aria-hidden="true" />
          </button>

          {!isVideo && (
            <button
              id="hero-download-image-btn"
              type="button"
              onClick={handleDownload}
              aria-label="Download high-resolution image"
              className="p-2 text-slate-400 hover:text-slate-100 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E4A853]/50"
            >
              <Download size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      {/* Main Visual Display: Image Stage or Video Frame with Blur-up/Progressive Rendering */}
      <section className="relative mb-8 rounded-xl overflow-hidden bg-black/60 border border-white/10 shadow-inner group">
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
            className="relative cursor-pointer overflow-hidden flex items-center justify-center min-h-[360px] sm:min-h-[480px] focus:outline-none focus:ring-2 focus:ring-[#E4A853] rounded-xl"
          >
            {!imageError ? (
              <>
                {/* Visual loading pulse while full image downloads */}
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
                  className={`w-full h-auto max-h-[600px] object-contain transition-all duration-700 ease-out group-hover:scale-[1.02] ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </>
            ) : (
              <div className="p-12 text-center text-slate-400 space-y-3">
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

            {/* Hover Fullscreen HUD Overlay Indicator */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0C0E12]/90 border border-[#E4A853]/50 text-[#E4A853] text-xs font-mono backdrop-blur-md shadow-xl">
                <Maximize2 size={14} />
                <span>Open Full HD Viewer</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Title & Observational Metadata */}
      <footer className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
            {data.title}
          </h1>
          {data.copyright && (
            <p className="text-xs font-mono text-slate-400">
              Credit & Copyright: <span className="text-slate-200">{data.copyright.trim()}</span>
            </p>
          )}
        </div>

        {/* Detailed Astronomical Analysis */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#E4A853] font-semibold">
            <Sparkles size={12} aria-hidden="true" />
            <span>Astronomical Analysis</span>
          </div>
          <p className="text-slate-300 text-sm sm:text-base font-light leading-relaxed font-sans">
            {data.explanation}
          </p>
        </div>
      </footer>
    </motion.article>
  );
}

