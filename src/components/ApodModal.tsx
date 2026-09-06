import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share2, ZoomIn, ZoomOut, Sparkles, AlertTriangle, ExternalLink } from 'lucide-react';
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

  // Reset state when modal opens or item changes
  useEffect(() => {
    if (isOpen) {
      setHdLoaded(false);
      setHdFailed(false);
      setIsZoomed(false);
    }
  }, [isOpen, item]);

  // Keyboard accessibility: Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  // Fallback to standard url if hdurl missing or failed
  const effectiveImageUrl = (!hdFailed && item.hdurl) ? item.hdurl : item.url;
  const isVideo = item.media_type === 'video';

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await fetch(effectiveImageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `nasa-apod-${item.date}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback open direct link if fetch blocked by CORS
      window.open(effectiveImageUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-2xl overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Backdrop click to close */}
        <div 
          className="fixed inset-0 cursor-zoom-out" 
          onClick={onClose}
          aria-hidden="true" 
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-6xl max-h-[92vh] bg-[#0C0E12] border border-[#E4A853]/30 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#050608]/80 backdrop-blur-md">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="px-2 py-0.5 rounded bg-[#E4A853]/15 text-[#E4A853] text-[10px] font-mono uppercase font-bold tracking-wider shrink-0">
                {item.hdurl && !hdFailed ? 'HD Telemetry' : 'Standard View'}
              </span>
              <h2 id="modal-title" className="text-sm sm:text-base font-serif font-medium text-slate-100 truncate">
                {item.title}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isVideo && (
                <>
                  <button
                    onClick={() => setIsZoomed(!isZoomed)}
                    className="p-2 text-slate-400 hover:text-slate-100 bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    title={isZoomed ? "Zoom Out" : "Zoom In"}
                    aria-label="Toggle zoom"
                  >
                    {isZoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#E4A853] hover:bg-[#f3be73] text-[#050608] rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(228,168,83,0.3)] cursor-pointer disabled:opacity-50"
                    title="Download high-resolution image"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">{downloading ? 'Downloading...' : 'Download HD'}</span>
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                title="Close viewer (Esc)"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Media Stage with Blur-up Loading */}
          <div className={`relative flex-1 min-h-[300px] sm:min-h-[480px] bg-black/80 flex items-center justify-center overflow-auto p-2 ${isZoomed ? 'cursor-zoom-out' : 'cursor-default'}`}>
            {isVideo ? (
              <div className="w-full h-full min-h-[420px] aspect-video">
                <iframe
                  src={item.url}
                  title={item.title}
                  className="w-full h-full rounded-lg border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center overflow-auto">
                {/* Low-res thumbnail blur placeholder */}
                {!hdLoaded && item.url && (
                  <img
                    src={item.url}
                    alt={item.title}
                    className="absolute max-h-[75vh] w-auto object-contain filter blur-md opacity-60 transition-opacity duration-300"
                    aria-hidden="true"
                  />
                )}

                {/* High-definition image with progressive load */}
                <img
                  src={effectiveImageUrl}
                  alt={item.title}
                  onLoad={() => setHdLoaded(true)}
                  onError={() => setHdFailed(true)}
                  className={`max-h-[75vh] w-auto object-contain transition-all duration-500 ${
                    hdLoaded ? 'opacity-100 scale-100' : 'opacity-0'
                  } ${isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100'}`}
                  onClick={() => setIsZoomed(!isZoomed)}
                />

                {/* Loading indicator until HD finishes */}
                {!hdLoaded && !hdFailed && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/75 border border-[#E4A853]/40 text-[#E4A853] text-xs font-mono">
                      <Sparkles size={14} className="animate-spin" />
                      <span>Resolving High-Definition Telemetry...</span>
                    </div>
                  </div>
                )}

                {/* Notice if HD failed and fell back to standard */}
                {hdFailed && (
                  <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded bg-amber-950/80 border border-amber-500/30 text-amber-200 text-xs font-mono">
                    <AlertTriangle size={13} />
                    <span>HD image unavailable. Displaying standard resolution.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Metadata & Explanation */}
          <div className="px-5 py-4 bg-[#080A0E] border-t border-white/10 text-left space-y-2 max-h-48 overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
              <span className="text-[#E4A853]">Observation Coordinates: {formatDate(item.date)}</span>
              {item.copyright && <span>Credit & Copyright: {item.copyright}</span>}
            </div>
            <p className="text-xs sm:text-sm font-sans font-light leading-relaxed text-slate-300">
              {item.explanation}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
