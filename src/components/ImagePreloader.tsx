/**
 * ImagePreloader Component
 * 
 * - What the component does:
 *   An image preloader and stage component designed for NASA APOD imagery.
 *   Preloads high-resolution celestial photography in memory using asynchronous decoding,
 *   displays a cosmic skeleton/telemetry shimmer while loading, and performs
 *   a smooth cross-fade transition when switching between different NASA APOD dates or image streams.
 * 
 * - Why it exists:
 *   1. Eliminates Cumulative Layout Shift (CLS) and sudden white/blank flashes when switching images.
 *   2. Provides a smooth cross-fade transition between observations with AnimatePresence.
 *   3. Offers a stylized loading state matching the Cosmic Indigo & Ion Blue theme.
 *   4. Handles error fallbacks gracefully with direct NASA archive links.
 * 
 * - How it fits into the NASA APOD workflow:
 *   Integrated into ApodHero, ApodImage, Gallery, Discover, and Modal components.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  AlertCircle, 
  ExternalLink, 
  Radio, 
  Layers, 
  RefreshCw 
} from 'lucide-react';

export interface ImagePreloaderProps {
  /** The primary image URL to display and preload */
  src: string;
  /** Accessible alternative text */
  alt: string;
  /** Optional High-Definition master image URL */
  hdUrl?: string;
  /** APOD observation date string (YYYY-MM-DD) */
  date?: string;
  /** Optional title of the astronomical observation */
  title?: string;
  /** CSS class applied to the outer container */
  className?: string;
  /** CSS class applied to the inner image element */
  imageClassName?: string;
  /** Minimum container height for responsive constraints */
  minHeight?: string;
  /** Aspect ratio constraint (e.g., 'aspect-video', 'aspect-auto', or custom) */
  aspectRatio?: string;
  /** Object fit mode for the image */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /** Whether to show in-place tap-to-zoom controls */
  enableZoom?: boolean;
  /** Controlled zoom state from parent */
  isZoomed?: boolean;
  /** Callback when in-place zoom is toggled */
  onToggleZoom?: () => void;
  /** Callback when user clicks the image stage to open full-screen inspector */
  onOpenModal?: () => void;
  /** Whether to show standard vs. 4K HD quality toggle switch */
  showQualityToggle?: boolean;
  /** Callback fired once image finishes preloading and decoding */
  onImageLoaded?: (url: string) => void;
  /** Callback fired on image load failure */
  onImageError?: (error: Error) => void;
  /** Custom badge / telemetry label during loading */
  loadingLabel?: string;
  /** Priority loading flag */
  priority?: boolean;
}

export default function ImagePreloader({
  src,
  alt,
  hdUrl,
  date,
  title,
  className = '',
  imageClassName = '',
  minHeight = 'min-h-[320px] sm:min-h-[460px] md:min-h-[520px]',
  aspectRatio = '',
  objectFit = 'contain',
  enableZoom = false,
  isZoomed: controlledZoom,
  onToggleZoom,
  onOpenModal,
  showQualityToggle = false,
  onImageLoaded,
  onImageError,
  loadingLabel = 'Synchronizing deep space stream...',
  priority = true,
}: ImagePreloaderProps) {
  // Quality resolution preference
  const [preferHd, setPreferHd] = useState(false);
  
  // Active target URL based on preference
  const targetUrl = preferHd && hdUrl ? hdUrl : src;

  // Track the currently displayed image source for cross-fading
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [loadProgress, setLoadProgress] = useState<number>(10);

  // Internal zoom state if not controlled from parent
  const [internalZoom, setInternalZoom] = useState(false);
  const isZoomed = controlledZoom !== undefined ? controlledZoom : internalZoom;

  // Reference for cancelable image preload tasks
  const preloadImageRef = useRef<HTMLImageElement | null>(null);

  /**
   * Preloads and decodes the image in memory before triggering the cross-fade animation.
   */
  useEffect(() => {
    if (!targetUrl) return;

    let isMounted = true;
    setLoading(true);
    setError(false);
    setLoadProgress(15);

    // Progress tick simulation for smooth visual feedback
    const progressInterval = setInterval(() => {
      setLoadProgress((prev) => (prev < 85 ? prev + Math.floor(Math.random() * 15 + 5) : prev));
    }, 120);

    const img = new Image();
    preloadImageRef.current = img;
    img.src = targetUrl;

    const handleSuccess = async () => {
      if (!isMounted) return;

      clearInterval(progressInterval);
      setLoadProgress(100);

      // Attempt async GPU decoding for stutter-free presentation
      try {
        if ('decode' in img) {
          await img.decode();
        }
      } catch {
        // Decode fallback ignored; image is already cached in browser memory
      }

      if (isMounted) {
        setCurrentSrc(targetUrl);
        setLoading(false);
        setError(false);
        onImageLoaded?.(targetUrl);
      }
    };

    const handleError = () => {
      if (!isMounted) return;
      clearInterval(progressInterval);
      setLoading(false);
      setError(true);
      onImageError?.(new Error(`Failed to load celestial imagery from ${targetUrl}`));
    };

    if (img.complete && img.naturalWidth > 0) {
      handleSuccess();
    } else {
      img.onload = handleSuccess;
      img.onerror = handleError;
    }

    return () => {
      isMounted = false;
      clearInterval(progressInterval);
      if (preloadImageRef.current) {
        preloadImageRef.current.onload = null;
        preloadImageRef.current.onerror = null;
      }
    };
  }, [targetUrl, onImageLoaded, onImageError]);

  const handleToggleZoomClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleZoom) {
      onToggleZoom();
    } else {
      setInternalZoom((prev) => !prev);
    }
  };

  const handleStageClick = () => {
    if (onOpenModal) {
      onOpenModal();
    } else if (enableZoom) {
      handleToggleZoomClick({ stopPropagation: () => {} } as React.MouseEvent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleStageClick();
    }
  };

  const objectFitClass = {
    contain: 'object-contain',
    cover: 'object-cover',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down',
  }[objectFit];

  return (
    <div
      id={date ? `apod-preloader-${date}` : 'apod-image-preloader'}
      role="region"
      aria-label={title || 'Cosmic Image Viewer'}
      className={`relative w-full rounded-2xl overflow-hidden bg-[#070611] border border-[#2C2655]/60 shadow-[0_20px_50px_rgba(7,6,17,0.7)] group select-none ${className}`}
    >
      {/* Interactive Media Stage */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleStageClick}
        onKeyDown={handleKeyDown}
        aria-label={title ? `Inspect observation: ${title}` : 'Inspect high-definition observation'}
        className={`relative w-full flex items-center justify-center overflow-hidden cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-[#3B82F6] ${minHeight} ${aspectRatio}`}
      >
        {/* =========================================================================
            1. COSMIC SHIMMER SKELETON / LOADING STATE WITH CROSSFADE
            ========================================================================= */}
        <AnimatePresence>
          {loading && (
            <motion.div
              key="loading-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeOut' } }}
              aria-busy="true"
              aria-label={loadingLabel}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#070611]/90 backdrop-blur-md p-6 text-center"
            >
              {/* Background ambient radar glow */}
              <div className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-[#3B82F6]/10 to-[#8B5CF6]/10 blur-3xl animate-pulse pointer-events-none" />
              
              {/* Orbital Preloader Graphic */}
              <div className="relative w-20 h-20 mb-5 flex items-center justify-center">
                {/* Outer rotating pulse ring */}
                <div className="absolute inset-0 rounded-full border border-[#3B82F6]/20 border-t-[#3B82F6] animate-spin [animation-duration:2.5s]" />
                
                {/* Secondary counter-rotating plasma ring */}
                <div className="absolute inset-2 rounded-full border border-[#8B5CF6]/25 border-b-[#8B5CF6] animate-spin [animation-duration:4s] [animation-direction:reverse]" />
                
                {/* Pulsing center cosmic core */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center shadow-[0_0_16px_rgba(59,130,246,0.6)] animate-pulse">
                  <Sparkles size={14} className="text-white animate-spin [animation-duration:8s]" />
                </div>
              </div>

              {/* Status pill with telemetry percentage */}
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#110F24]/95 border border-[#2C2655] shadow-lg mb-2">
                <Radio size={12} className="text-[#3B82F6] animate-pulse shrink-0" />
                <span className="text-[11px] font-mono font-semibold tracking-wider text-[#F5F5F7]">
                  {loadingLabel}
                </span>
                <span className="text-[10px] font-mono text-[#7FAFFF] font-bold">
                  {loadProgress}%
                </span>
              </div>

              {/* Progress Line */}
              <div className="w-48 h-1 bg-[#191635] rounded-full overflow-hidden border border-[#2C2655]/40 mt-1">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-full"
                  initial={{ width: '10%' }}
                  animate={{ width: `${loadProgress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.3 }}
                />
              </div>

              {title && (
                <p className="text-xs font-mono text-[#C4C4CC] mt-3 max-w-sm truncate opacity-70">
                  {title}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* =========================================================================
            2. ERROR RECOVERY BANNER
            ========================================================================= */}
        {error && (
          <div className="p-8 text-center text-[#C4C4CC] space-y-3 font-mono z-10 bg-[#110F24]/90 rounded-xl border border-[#FC3D21]/30 max-w-md mx-4 shadow-2xl">
            <AlertCircle className="mx-auto text-[#FC3D21]" size={32} />
            <p className="text-sm text-[#F5F5F7] font-semibold">Astronomy Image Stream Interrupted</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              The direct telemetry link for this observation could not be decoded.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-[#7FAFFF] text-xs hover:bg-[#3B82F6]/30 transition-colors"
              >
                <span>NASA Source Direct</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}

        {/* =========================================================================
            3. SMOOTH CROSS-FADING ASTRONOMICAL IMAGE
            ========================================================================= */}
        <AnimatePresence mode="wait">
          {currentSrc && !error && (
            <motion.img
              key={currentSrc}
              src={currentSrc}
              alt={alt}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              initial={{ opacity: 0, scale: 0.98, filter: 'blur(6px)' }}
              animate={{ 
                opacity: 1, 
                scale: isZoomed ? 1.45 : 1, 
                filter: 'blur(0px)' 
              }}
              exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
              transition={{ 
                opacity: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                scale: { duration: 0.35, ease: 'easeOut' },
                filter: { duration: 0.3 }
              }}
              className={`w-full h-auto max-h-[72vh] select-none transition-transform duration-300 ${objectFitClass} ${imageClassName} ${
                isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in group-hover:scale-[1.01]'
              }`}
            />
          )}
        </AnimatePresence>

        {/* =========================================================================
            4. HOVER HUD EXPAND CUE OVERLAY
            ========================================================================= */}
        {!loading && !error && (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none z-10"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#110F24]/95 border border-[#3B82F6]/50 text-[#7FAFFF] text-xs font-mono backdrop-blur-md shadow-[0_0_20px_rgba(59,130,246,0.3)] transform translate-y-1 group-hover:translate-y-0 transition-transform">
              <Maximize2 size={14} className="text-[#3B82F6]" />
              <span>Click to Expand &amp; Inspect (Full HD)</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            5. FLOATING HUD CONTROLS (HD TOGGLE & ZOOM PILLS)
            ========================================================================= */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-20 pointer-events-auto">
          {showQualityToggle && hdUrl && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreferHd((prev) => !prev);
              }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#3B82F6] ${
                preferHd
                  ? 'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white border-transparent shadow-[0_0_14px_rgba(59,130,246,0.5)]'
                  : 'bg-[#110F24]/90 hover:bg-[#191635] text-[#C4C4CC] border-[#2C2655]'
              }`}
              title="Toggle standard vs. master 4K high-definition stream"
            >
              {preferHd ? '4K MASTER' : 'STANDARD HD'}
            </button>
          )}

          {enableZoom && (
            <button
              type="button"
              onClick={handleToggleZoomClick}
              className="min-h-[34px] flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#110F24]/90 hover:bg-[#191635] border border-[#2C2655] text-[#C4C4CC] hover:text-[#F5F5F7] text-xs font-mono backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-md"
              title={isZoomed ? 'Reset in-place zoom' : 'Magnify in-place'}
            >
              {isZoomed ? <ZoomOut size={13} /> : <ZoomIn size={13} />}
              <span className="hidden sm:inline">{isZoomed ? 'Reset' : 'Zoom'}</span>
            </button>
          )}

          {onOpenModal && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenModal();
              }}
              className="min-h-[34px] flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#110F24]/90 hover:bg-[#191635] border border-[#3B82F6]/50 text-[#7FAFFF] hover:text-white text-xs font-mono backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-md"
              title="Full-Screen Deep Detail Inspector"
              aria-label="Full-Screen Deep Detail Inspector"
            >
              <Maximize2 size={13} className="text-[#3B82F6]" />
              <span className="hidden sm:inline">Inspect</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
