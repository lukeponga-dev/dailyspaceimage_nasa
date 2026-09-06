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
  const [imageError, setImageError] = useState(false);
  const isVideo = data.media_type === 'video';

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const downloadUrl = data.hdurl || data.url;
    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `nasa-apod-${data.date}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-4xl mx-auto rounded-2xl border border-[#E4A853]/25 bg-[#0C0E12]/90 backdrop-blur-xl p-6 sm:p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden text-left"
    >
      {/* Reticle Accents */}
      <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-[#E4A853]/40 pointer-events-none" />
      <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-[#E4A853]/40 pointer-events-none" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-[#E4A853]/40 pointer-events-none" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-[#E4A853]/40 pointer-events-none" />

      {/* Top Header telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-[#E4A853]/15 border border-[#E4A853]/30 text-[#E4A853] text-[10px] font-mono uppercase font-bold tracking-wider">
            {formatDate(data.date)}
          </span>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            {isVideo ? 'Astronomy Video Stream' : 'Deep Space Imagery'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFavorite(data)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
              isFavorite
                ? 'bg-[#E4A853] text-[#050608] border-[#E4A853] font-bold shadow-[0_0_15px_rgba(228,168,83,0.3)]'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
            }`}
            title={isFavorite ? "De-catalog from Favorites" : "Catalog to Favorites"}
          >
            <Star size={13} className={isFavorite ? "fill-[#050608]" : ""} />
            <span className="hidden sm:inline">{isFavorite ? 'Saved' : 'Favorite'}</span>
          </button>

          <button
            onClick={() => onShare(data)}
            className="p-2 text-slate-400 hover:text-slate-100 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer"
            title="Share Telemetry"
          >
            <Share2 size={15} />
          </button>

          {!isVideo && (
            <button
              onClick={handleDownload}
              className="p-2 text-slate-400 hover:text-slate-100 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer"
              title="Download HD Image"
            >
              <Download size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Main Visual Display */}
      <div className="relative mb-8 rounded-xl overflow-hidden bg-black/60 border border-white/10 shadow-inner group">
        {isVideo ? (
          <div className="aspect-video w-full">
            <iframe
              src={data.url}
              title={data.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div 
            onClick={onOpenModal}
            className="relative cursor-pointer overflow-hidden flex items-center justify-center min-h-[360px] sm:min-h-[480px]"
          >
            {!imageError ? (
              <img
                src={data.url}
                alt={data.title}
                onError={() => setImageError(true)}
                className="w-full h-auto max-h-[600px] object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              />
            ) : (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <AlertTriangle className="mx-auto text-amber-400" size={32} />
                <p className="text-sm font-mono">Image stream unavailable</p>
                <a
                  href={data.hdurl || data.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#E4A853] hover:underline inline-flex items-center gap-1"
                >
                  Direct NASA Source Link <ExternalLink size={12} />
                </a>
              </div>
            )}

            {/* Hover Fullscreen Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0C0E12]/90 border border-[#E4A853]/50 text-[#E4A853] text-xs font-mono backdrop-blur-md shadow-xl">
                <Maximize2 size={14} />
                <span>Open Full HD Viewer</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Title & Metadata */}
      <div className="space-y-4">
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

        {/* Detailed Explanation */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#E4A853] font-semibold">
            <Sparkles size={12} />
            <span>Astronomical Analysis</span>
          </div>
          <p className="text-slate-300 text-sm sm:text-base font-light leading-relaxed font-sans">
            {data.explanation}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
