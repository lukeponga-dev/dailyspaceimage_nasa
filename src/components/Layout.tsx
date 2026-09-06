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
        <div className="w-full max-w-4xl mb-4 sm:mb-8 relative rounded-2xl border border-[#E4A853]/25 bg-[#0C0E12]/90 backdrop-blur-xl p-4 sm:p-6 md:p-8 shadow-[0_15px_45px_rgba(0,0,0,0.65)] overflow-hidden select-none z-10 group/hero animate-fade-in text-center">
          {/* Optical Corner Reticle Accents */}
          <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 w-3 h-3 sm:w-4 sm:h-4 border-l-2 border-t-2 border-[#E4A853]/50 pointer-events-none" />
          <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-3 h-3 sm:w-4 sm:h-4 border-r-2 border-t-2 border-[#E4A853]/50 pointer-events-none" />
          <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 w-3 h-3 sm:w-4 sm:h-4 border-l-2 border-b-2 border-[#E4A853]/50 pointer-events-none" />
          <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 w-3 h-3 sm:w-4 sm:h-4 border-r-2 border-b-2 border-[#E4A853]/50 pointer-events-none" />

          {/* Ambient inner glow */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#E4A853_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#E4A853]/10 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-2 sm:gap-3 max-w-2xl mx-auto">
            {/* Live Telemetry Status Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#050608]/90 border border-[#E4A853]/35 text-[9px] sm:text-[10px] font-mono font-semibold uppercase tracking-wider text-[#E4A853]">
              <Radio size={11} className="animate-pulse text-[#E4A853] shrink-0" />
              <span>NASA APOD • Live Telemetry</span>
            </div>

            <h1 className="font-serif text-xl sm:text-3xl md:text-4xl text-[#FFD700] tracking-tight leading-tight drop-shadow-[0_2px_10px_rgba(228,168,83,0.2)]">
              Astronomy Picture of the Day
            </h1>

            <p className="font-sans text-xs sm:text-sm text-slate-300 tracking-wide leading-relaxed font-light">
              Discover the Cosmic Vault <span className="text-[#E4A853] italic font-normal">&amp; Stellar Horizons</span>
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="w-full max-w-6xl flex flex-col items-center relative z-10 flex-1">
        {children}
      </main>
      
      {/* 8. Minimal Footer (Single-column centered flow, lightweight) */}
      <footer className="w-full max-w-4xl mt-12 pt-6 pb-6 border-t border-white/10 flex flex-col items-center justify-center gap-1.5 text-center z-10 relative">
        <p className="text-xs font-mono text-slate-400 tracking-wider">
          Powered by NASA APOD API
        </p>
        <p className="text-xs font-mono text-[#E4A853]/90 tracking-wider">
          Built by Luke Ponga
        </p>
      </footer>
    </div>
  );
}
