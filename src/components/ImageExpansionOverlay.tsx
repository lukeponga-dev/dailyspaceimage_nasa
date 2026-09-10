/**
 * ImageExpansionOverlay Component
 * 
 * - What the component does:
 *   Provides an immersive, full-screen deep detail inspection overlay for NASA Astronomy Picture
 *   of the Day imagery. Features multi-scale zoom (50% to 500%), smooth click-and-drag panning,
 *   mouse wheel zoom, double-click to magnify at cursor coordinates, progressive HD master asset loading,
 *   astrometric visual enhancement filters (Invert, HDR Contrast, Nebula Boost, Monochrome),
 *   interactive mini-map radar navigation when zoomed, collapsible scientific telemetry drawer,
 *   native full-screen support, and full keyboard hotkey accessibility.
 * 
 * - Why it exists:
 *   Allows astronomers, researchers, educators, and space enthusiasts to deeply inspect fine deep-sky structures,
 *   distant galaxy clusters, planetary surface craters, and faint nebula gas lanes without viewport restrictions.
 * 
 * - How it fits into the NASA APOD workflow:
 *   Triggered whenever a user clicks on any APOD image across `ApodHero`, `ApodImage`, `Gallery`,
 *   `Favorites`, or `Discover`.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  RotateCcw,
  Sparkles,
  Info,
  Sliders,
  Compass,
  AlertTriangle,
  ExternalLink,
  HelpCircle,
  Eye,
  Layers,
  ChevronRight,
  ChevronLeft,
  Video
} from 'lucide-react';
import { ApodData } from '../types';
import { formatDate } from '../utils/dateUtils';
import ApodVideoPlayer from './ApodVideoPlayer';
import { formatCategoryName, formatDistance } from '../lib/apodClassifier';

export type AstroFilter = 'none' | 'contrast' | 'invert' | 'nebula' | 'mono';

interface ImageExpansionOverlayProps {
  item: ApodData | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectDate?: (date: string) => void;
}

const FILTER_CONFIGS: Record<AstroFilter, { label: string; description: string; cssFilter: string }> = {
  none: {
    label: 'Natural Color',
    description: 'Original true-color celestial exposure',
    cssFilter: 'none'
  },
  contrast: {
    label: 'HDR Contrast',
    description: 'Enhances faint gas filaments & dark dust lanes',
    cssFilter: 'contrast(140%) brightness(105%)'
  },
  invert: {
    label: 'Astronomical Negative',
    description: 'Classic negative invert for faint stars & asteroid halos',
    cssFilter: 'invert(100%) hue-rotate(180deg) contrast(110%)'
  },
  nebula: {
    label: 'Nebula Spectral Boost',
    description: 'Amplifies H-alpha and O-III emission spectrums',
    cssFilter: 'saturate(190%) contrast(125%)'
  },
  mono: {
    label: 'Monochrome Luminance',
    description: 'Isolates luminance data, removing chromatic noise',
    cssFilter: 'grayscale(100%) contrast(135%)'
  }
};

export default function ImageExpansionOverlay({
  item,
  isOpen,
  onClose,
  onSelectDate
}: ImageExpansionOverlayProps) {
  // Image loading & resolution states
  const [preferHd, setPreferHd] = useState(true);
  const [hdLoaded, setHdLoaded] = useState(false);
  const [hdFailed, setHdFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Transform & Pan/Zoom states
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // UI Drawer & HUD states
  const [showInfo, setShowInfo] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [activeFilter, setActiveFilter] = useState<AstroFilter>('none');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // DOM Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const touchDistanceRef = useRef<number | null>(null);

  // Reset state when a new item is loaded or modal is opened
  useEffect(() => {
    if (isOpen && item) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setHdLoaded(false);
      setHdFailed(false);
      setActiveFilter('none');
      setShowInfo(false);
      setShowFilters(false);
      setShowShortcuts(false);
    }
  }, [isOpen, item]);

  // Track native browser fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Lock body scroll when overlay is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const isVideo = item?.media_type === 'video';
  const effectiveImageUrl = preferHd && item?.hdurl && !hdFailed ? item.hdurl : (item?.url || '');

  // Zoom manipulation helpers
  const handleZoomIn = () => {
    setScale((prev) => Math.min(Number((prev + 0.35).toFixed(2)), 5.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(Number((prev - 0.35).toFixed(2)), 0.5);
      if (next <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleSetScale100 = () => {
    setScale(1.5);
    setPosition({ x: 0, y: 0 });
  };

  const handleSetScale200 = () => {
    setScale(2.5);
  };

  // Double-click to toggle between 1x and 2.2x zoom centered on clicked point
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isVideo) return;
    if (scale > 1.2) {
      handleResetZoom();
    } else {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left - rect.width / 2;
      const clickY = e.clientY - rect.top - rect.height / 2;
      setScale(2.2);
      setPosition({ x: -clickX * 1.2, y: -clickY * 1.2 });
    }
  };

  // Mouse wheel zoom handler
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (isVideo) return;
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0015;
    setScale((prev) => {
      const nextScale = Math.min(Math.max(Number((prev + zoomDelta).toFixed(2)), 0.5), 5.0);
      if (nextScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return nextScale;
    });
  };

  // Mouse drag to pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isVideo) return;
    if (e.button !== 0) return; // Only primary mouse button
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isVideo) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch pinch-to-zoom and touch-pan handlers for mobile & tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isVideo) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isVideo) return;
    if (e.touches.length === 1 && isDragging) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (dist - touchDistanceRef.current) * 0.005;
      setScale((prev) => Math.min(Math.max(Number((prev + delta).toFixed(2)), 0.5), 5.0));
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchDistanceRef.current = null;
  };

  // Toggle browser fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Download high-resolution celestial photograph
  const handleDownload = async () => {
    if (!item) return;
    try {
      setDownloading(true);
      const downloadUrl = item.hdurl || item.url;
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Failed to stream asset');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = `nasa-apod-${item.date}-master.jpg`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(item.hdurl || item.url, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  };

  // Keyboard navigation & shortcut hotkeys
  useEffect(() => {
    if (!isOpen || !item) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid hotkeys if an input is active
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          if (showShortcuts) {
            setShowShortcuts(false);
          } else if (showFilters) {
            setShowFilters(false);
          } else if (showInfo) {
            setShowInfo(false);
          } else {
            onClose();
          }
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
        case 'f':
        case 'F':
          e.preventDefault();
          handleResetZoom();
          break;
        case '1':
          e.preventDefault();
          handleSetScale100();
          break;
        case '2':
          e.preventDefault();
          handleSetScale200();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setPosition((prev) => ({ ...prev, y: prev.y + 60 }));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setPosition((prev) => ({ ...prev, y: prev.y - 60 }));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setPosition((prev) => ({ ...prev, x: prev.x + 60 }));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setPosition((prev) => ({ ...prev, x: prev.x - 60 }));
          break;
        case 'h':
        case 'H':
          if (item.hdurl) {
            setPreferHd((prev) => !prev);
          }
          break;
        case 'i':
        case 'I':
          setShowInfo((prev) => !prev);
          break;
        case 'c':
        case 'C': {
          const filterKeys = Object.keys(FILTER_CONFIGS) as AstroFilter[];
          const currentIndex = filterKeys.indexOf(activeFilter);
          const nextFilter = filterKeys[(currentIndex + 1) % filterKeys.length];
          setActiveFilter(nextFilter);
          break;
        }
        case '?':
          setShowShortcuts((prev) => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, item, onClose, showShortcuts, showFilters, showInfo, activeFilter, item?.hdurl]);

  if (!isOpen || !item) return null;

  return (
    <AnimatePresence>
      <div
        ref={containerRef}
        id="image-expansion-overlay-root"
        role="dialog"
        aria-modal="true"
        aria-label={`Full-screen detail inspection: ${item.title}`}
        className="fixed inset-0 z-50 flex flex-col bg-[#050608]/98 backdrop-blur-2xl overflow-hidden select-none"
      >
        {/* Optical Reticle Accents for Space Observatory Aesthetic */}
        <div aria-hidden="true" className="absolute top-4 left-4 w-5 h-5 border-l-2 border-t-2 border-[#E4A853]/40 pointer-events-none z-30" />
        <div aria-hidden="true" className="absolute top-4 right-4 w-5 h-5 border-r-2 border-t-2 border-[#E4A853]/40 pointer-events-none z-30" />
        <div aria-hidden="true" className="absolute bottom-4 left-4 w-5 h-5 border-l-2 border-b-2 border-[#E4A853]/40 pointer-events-none z-30" />
        <div aria-hidden="true" className="absolute bottom-4 right-4 w-5 h-5 border-r-2 border-b-2 border-[#E4A853]/40 pointer-events-none z-30" />

        {/* Ambient Subtle Stardust Grid */}
        <div aria-hidden="true" className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#E4A853_1px,transparent_1px)] [background-size:40px_40px] z-0" />

        {/* =========================================================================
            1. TOP HUD TOOLBAR
            - Title, Date, HD Badge, Filters toggle, Info toggle, Fullscreen, Close
            ========================================================================= */}
        <header className="relative z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#0C0E12]/90 border-b border-white/10 backdrop-blur-xl shadow-lg">
          {/* Observation Metadata Title */}
          <div className="flex items-center gap-3 overflow-hidden pr-2">
            <time
              dateTime={item.date}
              className="px-2.5 py-0.5 rounded-full bg-[#E4A853]/15 border border-[#E4A853]/35 text-[#E4A853] text-[10px] sm:text-xs font-mono font-bold tracking-wider shrink-0"
            >
              {formatDate(item.date)}
            </time>
            <h2 className="text-xs sm:text-sm md:text-base font-serif font-medium text-white truncate max-w-xs sm:max-w-md md:max-w-xl">
              {item.title}
            </h2>
            {item.category && (
              <span className="hidden lg:inline-block px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#FFD700] text-[10px] font-mono uppercase tracking-wider shrink-0">
                {formatCategoryName(item.category)}
              </span>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* HD / SD Stream Quality Toggle */}
            {!isVideo && item.hdurl && (
              <button
                type="button"
                onClick={() => setPreferHd(!preferHd)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#E4A853] ${
                  preferHd && !hdFailed
                    ? 'bg-[#E4A853] text-[#050608] border-[#E4A853] shadow-[0_0_12px_rgba(228,168,83,0.4)]'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
                title="Toggle Master High-Definition Stream (Key: H)"
                aria-label={preferHd ? 'High-definition master stream active' : 'Standard resolution stream active'}
              >
                <Sparkles size={13} className={preferHd && !hdFailed ? 'fill-[#050608]' : ''} />
                <span>{preferHd && !hdFailed ? 'HD 4K' : 'SD'}</span>
              </button>
            )}

            {/* Astrophotography Filter Dropdown Button */}
            {!isVideo && (
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg border transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#E4A853] ${
                  activeFilter !== 'none' || showFilters
                    ? 'bg-[#E4A853]/20 border-[#E4A853]/60 text-[#E4A853]'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10'
                }`}
                title="Astrometric Spectral Filters (Key: C)"
                aria-label="Astrometric Spectral Filters"
                aria-expanded={showFilters}
              >
                <Sliders size={16} aria-hidden="true" />
              </button>
            )}

            {/* Telemetry Info Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              className={`p-2 rounded-lg border transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#E4A853] ${
                showInfo
                  ? 'bg-[#E4A853]/20 border-[#E4A853]/60 text-[#E4A853]'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10'
              }`}
              title="Toggle Scientific Details & Intel Drawer (Key: I)"
              aria-label="Toggle Scientific Details & Intel Drawer"
              aria-expanded={showInfo}
            >
              <Info size={16} aria-hidden="true" />
            </button>

            {/* Download HD Master */}
            {!isVideo && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 rounded-lg text-xs font-mono transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-[#E4A853]"
                title="Download High-Resolution Celestial Asset"
                aria-label="Download High-Resolution Celestial Asset"
              >
                <Download size={14} aria-hidden="true" />
                <span>{downloading ? 'Downloading...' : 'Download'}</span>
              </button>
            )}

            {/* Native Fullscreen Toggle */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#E4A853]"
              title={isFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen Viewport"}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen Viewport"}
            >
              {isFullscreen ? <Minimize2 size={16} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}
            </button>

            {/* Shortcuts Help Toggle */}
            <button
              type="button"
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="hidden md:flex p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#E4A853]"
              title="Keyboard Shortcuts Cheatsheet (Key: ?)"
              aria-label="Keyboard Shortcuts Cheatsheet"
            >
              <HelpCircle size={16} aria-hidden="true" />
            </button>

            {/* Close Overlay */}
            <button
              id="image-expansion-close-btn"
              type="button"
              onClick={onClose}
              className="p-2 bg-red-950/30 hover:bg-red-900/50 text-red-200 hover:text-white border border-red-500/30 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400 ml-1"
              title="Close Fullscreen Inspection (Esc)"
              aria-label="Close Fullscreen Inspection"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* =========================================================================
            2. ASTROPHOTOGRAPHY FILTERS FLOATING POPUP MENU
            ========================================================================= */}
        <AnimatePresence>
          {showFilters && !isVideo && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="absolute top-16 right-6 z-40 w-72 rounded-xl bg-[#0C0E12]/95 border border-[#E4A853]/40 p-3 shadow-2xl backdrop-blur-2xl space-y-2 text-left"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-[11px] font-mono uppercase font-bold text-[#E4A853] flex items-center gap-1.5">
                  <Sliders size={12} />
                  Spectral Inspection Filter
                </span>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="space-y-1">
                {(Object.keys(FILTER_CONFIGS) as AstroFilter[]).map((filterKey) => {
                  const config = FILTER_CONFIGS[filterKey];
                  const isSelected = activeFilter === filterKey;
                  return (
                    <button
                      key={filterKey}
                      type="button"
                      onClick={() => {
                        setActiveFilter(filterKey);
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer flex flex-col ${
                        isSelected
                          ? 'bg-[#E4A853]/20 border border-[#E4A853]/50 text-[#FFD700]'
                          : 'hover:bg-white/5 text-slate-300 border border-transparent'
                      }`}
                    >
                      <span className="font-semibold">{config.label}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{config.description}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =========================================================================
            3. KEYBOARD SHORTCUTS CHEATSHEET POPUP
            ========================================================================= */}
        <AnimatePresence>
          {showShortcuts && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowShortcuts(false)}
            >
              <div
                className="w-full max-w-md rounded-2xl bg-[#0C0E12] border border-[#E4A853]/40 p-6 shadow-2xl space-y-4 text-left"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-sm font-mono uppercase font-bold text-[#E4A853] flex items-center gap-2">
                    <HelpCircle size={15} />
                    Observatory Keyboard Shortcuts
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowShortcuts(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-white/5 flex items-center justify-between">
                    <span className="text-slate-400">Zoom In / Out</span>
                    <kbd className="px-2 py-0.5 bg-black border border-white/20 rounded text-[#E4A853]">+</kbd>
                    <kbd className="px-2 py-0.5 bg-black border border-white/20 rounded text-[#E4A853]">-</kbd>
                  </div>
                  <div className="p-2 rounded bg-white/5 flex items-center justify-between">
                    <span className="text-slate-400">Reset View</span>
                    <kbd className="px-2 py-0.5 bg-black border border-white/20 rounded text-[#E4A853]">0 / F</kbd>
                  </div>
                  <div className="p-2 rounded bg-white/5 flex items-center justify-between">
                    <span className="text-slate-400">100% / 200% Zoom</span>
                    <kbd className="px-2 py-0.5 bg-black border border-white/20 rounded text-[#E4A853]">1 / 2</kbd>
                  </div>
                  <div className="p-2 rounded bg-white/5 flex items-center justify-between">
                    <span className="text-slate-400">Pan Image</span>
                    <kbd className="px-2 py-0.5 bg-black border border-white/20 rounded text-[#E4A853]">Arrows</kbd>
                  </div>
                  <div className="p-2 rounded bg-white/5 flex items-center justify-between">
                    <span className="text-slate-400">Toggle HD/SD</span>
                    <kbd className="px-2 py-0.5 bg-black border border-white/20 rounded text-[#E4A853]">H</kbd>
                  </div>
                  <div className="p-2 rounded bg-white/5 flex items-center justify-between">
                    <span className="text-slate-400">Cycle Filter</span>
                    <kbd className="px-2 py-0.5 bg-black border border-white/20 rounded text-[#E4A853]">C</kbd>
                  </div>
                  <div className="p-2 rounded bg-white/5 flex items-center justify-between">
                    <span className="text-slate-400">Intel Drawer</span>
                    <kbd className="px-2 py-0.5 bg-black border border-white/20 rounded text-[#E4A853]">I</kbd>
                  </div>
                  <div className="p-2 rounded bg-white/5 flex items-center justify-between">
                    <span className="text-slate-400">Dismiss Overlay</span>
                    <kbd className="px-2 py-0.5 bg-black border border-white/20 rounded text-[#E4A853]">Esc</kbd>
                  </div>
                </div>
                <p className="text-[11px] font-sans text-slate-400 pt-1">
                  Tip: You can also use the mouse wheel to zoom in and out, double-click to magnify at your cursor position, and drag to pan across the celestial field.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =========================================================================
            4. MAIN STAGE / INTERACTIVE PAN & ZOOM CANVAS
            ========================================================================= */}
        <div
          id="image-expansion-canvas"
          className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden z-10"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
          style={{
            cursor: isVideo ? 'default' : scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
          }}
        >
          {isVideo ? (
            <div className="w-full max-w-5xl aspect-video p-4">
              <ApodVideoPlayer
                url={item.url}
                title={`NASA APOD Video Stream: ${item.title}`}
                className="w-full h-full rounded-2xl shadow-2xl border border-white/10"
              />
            </div>
          ) : (
            <div
              className="relative transition-transform ease-out"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transitionDuration: isDragging ? '0ms' : '150ms',
                transformOrigin: 'center center'
              }}
            >
              {/* Progressive Blur-Up Background Placeholder */}
              {!hdLoaded && item.url && (
                <img
                  src={item.url}
                  alt=""
                  aria-hidden="true"
                  className="max-w-[90vw] max-h-[82vh] object-contain filter blur-md opacity-60 pointer-events-none select-none"
                  style={{ filter: FILTER_CONFIGS[activeFilter].cssFilter }}
                />
              )}

              {/* High-Definition Master Asset Image Element */}
              <img
                ref={imageRef}
                src={effectiveImageUrl}
                alt={item.title}
                loading="eager"
                decoding="async"
                draggable={false}
                onLoad={() => setHdLoaded(true)}
                onError={() => setHdFailed(true)}
                className={`max-w-[90vw] max-h-[82vh] object-contain select-none transition-opacity duration-300 ${
                  hdLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
                }`}
                style={{
                  filter: FILTER_CONFIGS[activeFilter].cssFilter
                }}
              />

              {/* Progressive Stream Resolving Telemetry Badge */}
              {!hdLoaded && !hdFailed && (
                <div
                  aria-live="polite"
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/80 border border-[#E4A853]/40 text-[#E4A853] text-xs font-mono shadow-2xl backdrop-blur-md">
                    <Sparkles size={14} className="animate-spin" aria-hidden="true" />
                    <span>Resolving Astronomical Master Stream...</span>
                  </div>
                </div>
              )}

              {/* HD Stream Fallback Warning */}
              {hdFailed && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/90 border border-amber-500/40 text-amber-200 text-xs font-mono shadow-xl">
                  <AlertTriangle size={14} />
                  <span>Displaying standard resolution stream</span>
                </div>
              )}
            </div>
          )}

          {/* Active Filter HUD Chip (when filter is applied) */}
          {activeFilter !== 'none' && !isVideo && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 border border-[#E4A853]/50 text-[#FFD700] text-[10px] font-mono shadow-lg backdrop-blur-md">
              <Sliders size={11} />
              <span>Filter: {FILTER_CONFIGS[activeFilter].label}</span>
              <button
                type="button"
                onClick={() => setActiveFilter('none')}
                className="ml-1 hover:text-white text-slate-400"
                title="Reset Filter"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* =========================================================================
              5. FLOATING MINI-MAP RADAR NAVIGATOR (Visible when zoomed in > 1x)
              ========================================================================= */}
          {scale > 1.05 && !isVideo && item.url && (
            <div
              className="absolute bottom-20 left-6 z-20 hidden md:flex flex-col items-start gap-1 p-2 rounded-xl bg-[#0C0E12]/90 border border-[#E4A853]/35 shadow-2xl backdrop-blur-md pointer-events-auto group"
              title="Mini-Map Navigation Radar"
            >
              <div className="text-[9px] font-mono text-[#E4A853] font-bold uppercase tracking-wider flex items-center gap-1">
                <Compass size={10} />
                <span>Sector Radar</span>
              </div>
              <div className="relative w-28 h-20 bg-black/80 rounded border border-white/10 overflow-hidden flex items-center justify-center">
                <img
                  src={item.url}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-contain opacity-50"
                />
                {/* Active Viewport Rectangle Indicator */}
                <div
                  className="absolute border-2 border-[#E4A853] bg-[#E4A853]/15 transition-all pointer-events-none"
                  style={{
                    width: `${Math.max(100 / scale, 15)}%`,
                    height: `${Math.max(100 / scale, 15)}%`,
                    transform: `translate(${-position.x / (scale * 8)}px, ${-position.y / (scale * 8)}px)`
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            6. FLOATING BOTTOM CONTROL ISLAND / DOCK
            - Multi-Scale Zoom controls, Percentage badge, 1:1, Reset
            ========================================================================= */}
        {!isVideo && (
          <footer className="relative z-30 flex items-center justify-center pb-4 sm:pb-6 px-4 pointer-events-none">
            <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-[#0C0E12]/95 border border-[#E4A853]/40 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(228,168,83,0.15)] backdrop-blur-2xl pointer-events-auto">
              {/* Zoom Out Button */}
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                className="p-1.5 sm:p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-200 hover:text-white transition-colors cursor-pointer disabled:opacity-30 focus:outline-none focus:ring-1 focus:ring-[#E4A853]"
                title="Zoom Out (-)"
                aria-label="Zoom Out"
              >
                <ZoomOut size={16} aria-hidden="true" />
              </button>

              {/* Zoom Slider / Stepper */}
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-20 sm:w-28 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#E4A853] focus:outline-none"
                aria-label="Zoom Magnification Slider"
              />

              {/* Zoom Percentage Pill */}
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2.5 py-1 rounded-md bg-black/60 border border-white/10 text-[#E4A853] font-mono text-xs font-bold min-w-[54px] text-center hover:border-[#E4A853]/50 transition-colors cursor-pointer"
                title="Click to reset zoom"
              >
                {Math.round(scale * 100)}%
              </button>

              {/* Zoom In Button */}
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= 5.0}
                className="p-1.5 sm:p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-200 hover:text-white transition-colors cursor-pointer disabled:opacity-30 focus:outline-none focus:ring-1 focus:ring-[#E4A853]"
                title="Zoom In (+)"
                aria-label="Zoom In"
              >
                <ZoomIn size={16} aria-hidden="true" />
              </button>

              <div className="w-[1px] h-5 bg-white/15 mx-1" aria-hidden="true" />

              {/* Fit / Reset View */}
              <button
                type="button"
                onClick={handleResetZoom}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                  scale === 1 && position.x === 0 && position.y === 0
                    ? 'bg-[#E4A853]/20 text-[#E4A853] border border-[#E4A853]/40'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
                title="Fit to Viewport (0 / F)"
              >
                <RotateCcw size={12} />
                <span className="hidden sm:inline">Fit</span>
              </button>

              {/* 100% Native Pixel Scale */}
              <button
                type="button"
                onClick={handleSetScale100}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                  scale === 1.5
                    ? 'bg-[#E4A853]/20 text-[#E4A853] border border-[#E4A853]/40'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
                title="100% Native Resolution (1)"
              >
                1:1
              </button>
            </div>
          </footer>
        )}

        {/* =========================================================================
            7. COLLAPSIBLE SCIENTIFIC INTEL & TELEMETRY SIDE DRAWER
            ========================================================================= */}
        <AnimatePresence>
          {showInfo && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute top-0 right-0 bottom-0 z-40 w-full max-w-md bg-[#0C0E12]/95 border-l border-[#E4A853]/30 p-6 shadow-2xl backdrop-blur-2xl flex flex-col justify-between overflow-y-auto text-left"
              role="complementary"
              aria-label="Astronomical Mission Details and Telemetry"
            >
              <div className="space-y-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#E4A853] shadow-[0_0_8px_#E4A853]" />
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#E4A853]">
                      Astronomical Telemetry
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInfo(false)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Close Intel Drawer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Observation Meta & Category Badges */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-[#E4A853] uppercase tracking-widest font-semibold block">
                    Target Identification
                  </span>
                  <h4 className="text-xl font-serif font-bold text-white leading-snug">
                    {item.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E4A853]/15 border border-[#E4A853]/30 text-[#E4A853] text-[10px] font-mono font-bold">
                      {formatDate(item.date)}
                    </span>
                    {item.category && (
                      <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#FFD700] text-[10px] font-mono uppercase">
                        {formatCategoryName(item.category)}
                      </span>
                    )}
                    {item.distance && item.distance.ly !== null && (
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono">
                        {item.distance.ly} Light Years
                      </span>
                    )}
                  </div>
                </div>

                {/* Scientific Narrative Explanation */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-[#E4A853] uppercase tracking-widest font-semibold block">
                    Astrophysical Analysis
                  </span>
                  <p className="text-xs sm:text-sm font-sans font-light text-slate-300 leading-relaxed bg-[#050608]/60 p-4 rounded-xl border border-white/5">
                    {item.explanation}
                  </p>
                </div>

                {/* Mission & Copyright Credits */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2 text-xs font-mono text-slate-400">
                  <span className="text-[10px] text-[#E4A853] uppercase tracking-widest font-semibold block">
                    Observatory &amp; Archival Data
                  </span>
                  {item.copyright && (
                    <p>
                      <span className="text-slate-500">Credit / Copyright:</span>{' '}
                      <span className="text-slate-200">{item.copyright}</span>
                    </p>
                  )}
                  <p>
                    <span className="text-slate-500">Asset Stream:</span>{' '}
                    <span className="text-[#E4A853]">
                      {item.hdurl ? 'Master 4K+ HD Available' : 'Standard 1080p'}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-500">Archive Link:</span>{' '}
                    <a
                      href={item.hdurl || item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#E4A853] hover:underline inline-flex items-center gap-1"
                    >
                      NASA Direct Raw Asset <ExternalLink size={11} />
                    </a>
                  </p>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-6 border-t border-white/10 flex items-center justify-between gap-2">
                {onSelectDate && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDate(item.date);
                      onClose();
                    }}
                    className="flex-1 py-2.5 px-3 bg-[#E4A853] hover:bg-[#ffd99e] text-[#050608] rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer text-center"
                  >
                    View in Main Array
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 rounded-xl text-xs font-mono transition-colors cursor-pointer"
                  title="Download Image"
                >
                  <Download size={14} />
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}
