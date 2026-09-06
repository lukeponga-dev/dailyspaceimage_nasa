import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi } from 'lucide-react';

interface Props {
  onNavigate: (view: string) => void;
  currentView: string;
}

interface ModeItem {
  id: string; // 'landing' | 'today' | 'discover' | 'favorites'
  label: string; // 'Home' | 'Explore' | 'Voyage' | 'Saved'
  description: string; // Micro-description explaining the mode instantly
}

/**
 * Global Navigation Component
 * 
 * - What it does:
 *   Provides seamless mode switching between Home, Explore, Voyage, and Saved views.
 *   Features instant hover micro-descriptions to guide first-time visitors and
 *   a live telemetry indicator ("JWST link active") reinforcing the deep-space concept.
 * 
 * - Why it exists:
 *   Ensures immediate clarity on view functions while maintaining aerospace-grade aesthetics.
 * 
 * - How it fits into the workflow:
 *   Mounted in the sticky header shell of Layout.tsx, coordinating route states.
 */
export default function Navigation({ onNavigate, currentView }: Props) {
  const [hoveredMode, setHoveredMode] = useState<ModeItem | null>(null);

  const modes: ModeItem[] = [
    { id: 'landing', label: 'Home', description: 'Mission overview, archive stats & stellar spotlight' },
    { id: 'today', label: 'Explore', description: 'Daily NASA APOD observation & astronomical analysis' },
    { id: 'discover', label: 'Voyage', description: 'Chronological feed, date filtering & random discovery' },
    { id: 'favorites', label: 'Saved', description: 'Your personal vault of bookmarked cosmic phenomena' },
  ];

  const activeMode = modes.find(m => m.id === currentView);

  return (
    <div className="flex flex-col items-center gap-1.5 w-full max-w-sm sm:max-w-md md:max-w-xl mx-auto pointer-events-auto select-none">
      
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
        {/* Desktop Tabs View (hidden md:flex) */}
        <div className="hidden md:flex items-center justify-center w-full gap-5 text-sm font-sans">
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

        {/* Mobile Segmented Control View (flex md:hidden) */}
        <div className="grid grid-cols-4 w-full gap-1 p-0.5 md:hidden">
          {modes.map((mode) => {
            const isActive = currentView === mode.id;
            return (
              <button
                key={mode.id}
                id={`nav-mobile-btn-${mode.id}`}
                onClick={() => onNavigate(mode.id)}
                aria-label={`${mode.label}: ${mode.description}`}
                className={`
                  relative min-h-[44px] flex items-center justify-center rounded-full text-xs font-semibold tracking-tight transition-all duration-300 cursor-pointer outline-none focus:outline-none px-2 py-2
                  ${isActive 
                    ? 'text-[#E4A853] bg-[#E4A853]/15 border border-[#E4A853]/40 shadow-[0_0_12px_rgba(228,168,83,0.2)] font-bold' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent active:bg-white/10'
                  }
                `}
              >
                <span className="truncate">{mode.label}</span>
              </button>
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
              className="text-[10px] font-mono text-slate-400 tracking-wide hidden sm:block truncate max-w-sm"
            >
              {activeMode?.description}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}

