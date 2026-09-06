import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, Menu, X, Sparkles, Compass, Star, Eye, ChevronRight } from 'lucide-react';

interface Props {
  onNavigate: (view: string) => void;
  currentView: string;
}

interface ModeItem {
  id: string; // 'landing' | 'today' | 'discover' | 'favorites'
  label: string; // 'Home' | 'Explore' | 'Voyage' | 'Saved'
  description: string; // Micro-description explaining the mode instantly
  icon: React.ElementType;
}

/**
 * Global Navigation Component
 * 
 * - What it does:
 *   1. Provides a minimal Sticky Mobile Header (390-430px) with "NASA Space Image" title and hamburger menu trigger.
 *   2. Provides a full-height Slide-Out Navigation Drawer with 48px tap targets, micro-descriptions, and live telemetry status.
 *   3. Provides a sleek floating desktop tab bar for larger screens with hover micro-descriptions.
 * 
 * - Why it exists:
 *   Adheres strictly to the mobile-first wireframe, preserving vertical space on mobile while offering effortless thumb navigation.
 * 
 * - How it fits into the workflow:
 *   Mounted in the sticky header shell of Layout.tsx, coordinating route states across the application.
 */
export default function Navigation({ onNavigate, currentView }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<ModeItem | null>(null);

  const modes: ModeItem[] = [
    { id: 'landing', label: 'Home', description: 'Mission overview, archive stats & stellar spotlight', icon: Sparkles },
    { id: 'today', label: 'Explore', description: 'Daily NASA APOD observation & astronomical analysis', icon: Eye },
    { id: 'discover', label: 'Voyage', description: 'Chronological feed, date filtering & random discovery', icon: Compass },
    { id: 'favorites', label: 'Saved', description: 'Your personal vault of bookmarked cosmic phenomena', icon: Star },
  ];

  const activeMode = modes.find(m => m.id === currentView);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const handleSelectMode = (id: string) => {
    onNavigate(id);
    setDrawerOpen(false);
  };

  return (
    <div className="w-full pointer-events-auto select-none">
      
      {/* =========================================================================
          1. STICKY MOBILE HEADER (Structured for 390-430px viewports)
          - What it does: Displays minimal "NASA Space Image" brand with a hamburger menu button.
          - Why it exists: Conserves critical vertical space on mobile devices with slight blur on scroll.
          ========================================================================= */}
      <div 
        id="mobile-sticky-header" 
        className="flex md:hidden items-center justify-between w-full px-4 py-3 bg-[#050608]/90 backdrop-blur-xl border-b border-white/10 shadow-lg rounded-2xl"
      >
        <button
          type="button"
          onClick={() => handleSelectMode('landing')}
          className="flex items-center gap-2 text-left cursor-pointer outline-none focus:outline-none"
        >
          <span className="w-2 h-2 rounded-full bg-[#E4A853] animate-pulse" />
          <span className="font-serif font-bold text-base text-[#FFD700] tracking-tight">
            NASA Space Image
          </span>
        </button>

        {/* Hamburger Menu Button (48px tap target) */}
        <button
          id="mobile-hamburger-btn"
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open Navigation Menu"
          aria-expanded={drawerOpen}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-200 hover:text-[#E4A853] hover:bg-white/10 active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E4A853]/50"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
      </div>

      {/* =========================================================================
          2. SLIDE-OUT NAVIGATION DRAWER (Full-height mobile menu)
          - What it does: Slides in from the right/top with 48px tap targets, micro-descriptions, and close button.
          - Why it exists: Provides clear, accessible navigation without obscuring content when closed.
          ========================================================================= */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex justify-end">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              aria-hidden="true"
            />

            {/* Slide-out Drawer Panel */}
            <motion.div
              id="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Main Navigation Menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-xs h-full bg-[#0C0E12] border-l border-white/15 p-6 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-y-auto"
            >
              {/* Drawer Top Header: Close Button & Brand */}
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E4A853] shadow-[0_0_8px_#E4A853]" />
                    <span className="font-serif font-bold text-lg text-white">
                      NASA Space Image
                    </span>
                  </div>
                  
                  {/* Close button with 48px tap target */}
                  <button
                    id="mobile-drawer-close-btn"
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Close Navigation Menu"
                    className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E4A853]/50"
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                </div>

                {/* Navigation Items with 48px min-height tap targets and micro-descriptions */}
                <nav className="mt-6 flex flex-col gap-2.5" aria-label="Mobile Navigation Links">
                  {modes.map((mode) => {
                    const isActive = currentView === mode.id;
                    const IconComponent = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        id={`drawer-link-${mode.id}`}
                        type="button"
                        onClick={() => handleSelectMode(mode.id)}
                        className={`w-full min-h-[48px] p-3.5 rounded-2xl flex items-center justify-between text-left transition-all duration-200 cursor-pointer border ${
                          isActive
                            ? 'bg-[#E4A853]/15 border-[#E4A853]/50 text-[#FFD700] shadow-[0_0_20px_rgba(228,168,83,0.15)]'
                            : 'bg-white/[0.02] border-white/5 hover:bg-white/5 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl mt-0.5 ${isActive ? 'bg-[#E4A853]/20 text-[#E4A853]' : 'bg-white/5 text-slate-400'}`}>
                            <IconComponent size={18} aria-hidden="true" />
                          </div>
                          <div>
                            <span className={`block text-base font-semibold ${isActive ? 'text-[#FFD700]' : 'text-slate-100'}`}>
                              {mode.label}
                            </span>
                            <span className="block text-xs font-sans text-slate-400 mt-0.5 leading-snug">
                              {mode.description}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={16} className={`shrink-0 ${isActive ? 'text-[#E4A853]' : 'text-slate-500'}`} aria-hidden="true" />
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer Bottom: Live Telemetry Indicator */}
              <div className="pt-6 border-t border-white/10 space-y-3">
                <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/30 flex items-center gap-2.5">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <div className="text-left">
                    <p className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">
                      Live Telemetry ● Active
                    </p>
                    <p className="text-[9px] font-mono text-slate-400">
                      JWST NIRCam • 300bps Link
                    </p>
                  </div>
                </div>

                <p className="text-[10px] font-mono text-slate-500 text-center uppercase tracking-widest">
                  Powered by NASA APOD
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          DESKTOP NAVIGATION (Hidden on mobile, displayed on md: and larger)
          ========================================================================= */}
      <div className="hidden md:flex flex-col items-center gap-1.5 w-full max-w-xl mx-auto">
        {/* Real-time Telemetry Status Pill */}
        <div 
          id="nav-telemetry-indicator"
          className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#050608]/90 border border-emerald-500/30 text-[9px] font-mono font-medium text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)] backdrop-blur-md"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <Wifi size={10} className="text-emerald-400/80 animate-pulse" />
          <span className="tracking-wider uppercase font-semibold">JWST link active</span>
          <span className="text-emerald-500/40">•</span>
          <span className="text-slate-400 tracking-wider">300bps Telemetry</span>
        </div>

        <nav 
          id="global-nav-bar"
          className="bg-[#050608]/90 backdrop-blur-2xl border border-white/10 p-1.5 md:py-2.5 md:px-6 rounded-full flex justify-between items-center shadow-[0_15px_45px_rgba(0,0,0,0.85),0_0_30px_rgba(228,168,83,0.08)] relative overflow-visible w-full"
        >
          <div className="flex items-center justify-center w-full gap-5 text-sm font-sans">
            {modes.map((mode, index) => {
              const isActive = currentView === mode.id;
              return (
                <React.Fragment key={mode.id}>
                  {index > 0 && <span className="text-white/20 select-none px-0.5">|</span>}
                  <div
                    className="relative flex flex-col items-center"
                    onMouseEnter={() => setHoveredMode(mode)}
                    onMouseLeave={() => setHoveredMode(null)}
                  >
                    <button
                      id={`nav-btn-${mode.id}`}
                      onClick={() => onNavigate(mode.id)}
                      aria-label={`${mode.label}: ${mode.description}`}
                      className={`
                        relative pb-1 px-3 font-semibold transition-all duration-300 cursor-pointer outline-none focus:outline-none
                        ${isActive 
                          ? 'text-[#E4A853]' 
                          : 'text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(228,168,83,0.35)]'
                        }
                      `}
                    >
                      {mode.label}
                      {isActive && (
                        <motion.div
                          layoutId="desktopActiveUnderline"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E4A853] shadow-[0_0_8px_#E4A853]"
                          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        />
                      )}
                    </button>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </nav>

        {/* Hover Micro-description Display Badge */}
        <div className="h-5 flex items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            {hoveredMode ? (
              <motion.div
                key={hoveredMode.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="px-3 py-0.5 rounded-full bg-[#0C0E12]/95 border border-[#E4A853]/40 text-[10px] sm:text-[11px] font-mono text-[#ffd99e] shadow-[0_4px_16px_rgba(0,0,0,0.8)] backdrop-blur-md whitespace-nowrap tracking-wide"
              >
                <span className="text-[#E4A853] font-bold uppercase mr-1.5">{hoveredMode.label}:</span>
                <span>{hoveredMode.description}</span>
              </motion.div>
            ) : (
              <motion.div
                key="current-mode-description"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[10px] font-mono text-slate-400 tracking-wide truncate max-w-sm"
              >
                {activeMode?.description}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}


