import React from 'react';
import Navigation from './Navigation';
import { motion } from 'motion/react';
import { Sparkles, Compass, Radio } from 'lucide-react';
import jwstGoldEmblem from '../assets/images/jwst_gold_emblem_1787854317963.jpg';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  selectedDate?: string;
  onDateChange?: (date: string) => void;
}

/**
 * Main application shell layout.
 * 
 * - What it does:
 *   Renders common chrome elements including the cosmic ambient background,
 *   floating top navigation bar, contextual header banner, and footer telemetry.
 * 
 * - Why it exists:
 *   Enforces a consistent layout hierarchy across all views while avoiding
 *   redundant interactive controls. Date selection is delegated strictly to
 *   the dedicated DatePicker toolbar on view components.
 * 
 * - How it fits into the workflow:
 *   Wraps the active view returned by App.tsx, hosting children within the <main> container.
 */
export default function Layout({ children, currentView, onNavigate }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#050608] text-slate-100 flex flex-col items-center pt-3 sm:pt-5 pb-6 px-3 sm:px-6 relative overflow-hidden">
      
      {/* Background radial gold dust glow & deep space ambient star field */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-[#E4A853]/6 blur-[140px] rounded-[100%] pointer-events-none -z-10" />
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-30 bg-[radial-gradient(#E4A853_1px,transparent_1px)] [background-size:48px_48px]" />

      {/* Top Floating Navigation Bar */}
      <header className="sticky top-2 sm:top-4 z-40 w-full flex justify-center mb-6 sm:mb-8 px-2 sm:px-0 pointer-events-none">
        <Navigation currentView={currentView} onNavigate={onNavigate} />
      </header>

      {/* 🪐 Hero Header Banner - Hidden on Landing Page because Landing has its own premium hero */}
      {currentView !== 'landing' && (
        <div className="w-full max-w-4xl mb-6 sm:mb-10 relative rounded-2xl border border-[#E4A853]/30 bg-[#0C0E12]/85 backdrop-blur-xl p-4 sm:p-8 md:p-10 shadow-[0_15px_45px_rgba(0,0,0,0.65)] overflow-hidden select-none z-10 group/hero animate-fade-in">
          {/* Optical JWST Corner Reticle Accents */}
          <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 w-3 h-3 sm:w-4 sm:h-4 border-l-2 border-t-2 border-[#E4A853]/60 pointer-events-none group-hover/hero:border-[#E4A853] transition-colors" />
          <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-3 h-3 sm:w-4 sm:h-4 border-r-2 border-t-2 border-[#E4A853]/60 pointer-events-none group-hover/hero:border-[#E4A853] transition-colors" />
          <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 w-3 h-3 sm:w-4 sm:h-4 border-l-2 border-b-2 border-[#E4A853]/60 pointer-events-none group-hover/hero:border-[#E4A853] transition-colors" />
          <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 w-3 h-3 sm:w-4 sm:h-4 border-r-2 border-b-2 border-[#E4A853]/60 pointer-events-none group-hover/hero:border-[#E4A853] transition-colors" />

          {/* Ambient inner radial glow & stardust overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#E4A853_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#E4A853]/10 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 sm:gap-6 md:gap-8 text-center md:text-left">
            <div className="relative shrink-0">
              <div className="absolute -inset-2 bg-[#E4A853]/20 rounded-full blur-xl group-hover/hero:bg-[#E4A853]/35 transition-all duration-500 pointer-events-none" />
              <motion.img 
                src={jwstGoldEmblem} 
                alt="JWST Gold Hexagonal Mirror Cluster"
                className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain filter drop-shadow-[0_0_30px_rgba(228,168,83,0.45)] rounded-full transition-transform duration-500 group-hover/hero:scale-105"
              />
            </div>

            <div className="flex flex-col gap-2 sm:gap-2.5 max-w-2xl">
              {/* Live Telemetry Status Pill */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-[#050608]/90 border border-[#E4A853]/35 text-[9px] sm:text-[10px] font-mono font-semibold uppercase tracking-wider sm:tracking-widest text-[#E4A853] self-center md:self-start max-w-full">
                <Radio size={12} className="animate-pulse text-[#E4A853] shrink-0" />
                <span className="hidden sm:inline">NASA APOD Vault • Live Astronomical Telemetry</span>
                <span className="sm:hidden">NASA APOD • Live Telemetry</span>
              </div>

              <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl text-[#FFD700] tracking-tight leading-tight drop-shadow-[0_2px_10px_rgba(228,168,83,0.2)]">
                Astronomy Picture of the Day
              </h1>

              <p className="font-serif text-sm sm:text-xl md:text-2xl text-slate-200 tracking-wide leading-snug font-light opacity-95">
                Discover the Cosmic Vault <span className="text-[#E4A853] italic font-normal">&amp; Stellar Horizons</span>
              </p>

              <div className="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 text-[10px] sm:text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded bg-white/5 border border-white/5">
                  <Sparkles size={11} className="text-[#E4A853]" />
                  JWST &amp; Hubble Array
                </span>
                <span className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded bg-white/5 border border-white/5">
                  <Compass size={11} className="text-[#E4A853]" />
                  <span className="hidden sm:inline">Daily Coordinates </span>1995–Present
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="w-full max-w-6xl flex flex-col items-center relative z-10 flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="w-full max-w-6xl mt-16 pt-8 pb-4 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-center z-10 relative">
        <p className="text-[11px] md:text-xs font-mono text-slate-500 uppercase tracking-widest">
          Powered by NASA APOD API
        </p>
        <div className="flex items-center gap-2 text-[#E4A853]/70">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E4A853]/50" />
          <p className="text-[11px] md:text-xs font-mono uppercase tracking-widest">
            Built by Luke Ponga
          </p>
        </div>
      </footer>
    </div>
  );
}
