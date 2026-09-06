import React from 'react';
import Navigation from './Navigation';
import AmbientStarfield from './AmbientStarfield';
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
    <div className="min-h-screen bg-[#0B0D17] text-white flex flex-col items-center pt-3 sm:pt-5 pb-6 px-3 sm:px-6 relative overflow-hidden">
      
      {/* Dynamic Ambient Cosmic Starfield Canvas Animation */}
      <AmbientStarfield />

      {/* Background ambient star field & telemetry glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-[#1E90FF]/5 blur-[140px] rounded-[100%] pointer-events-none -z-10" />
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-20 bg-[radial-gradient(#1E90FF_1px,transparent_1px)] [background-size:48px_48px]" />

      {/* Top Floating Navigation Bar */}
      <header className="sticky top-2 sm:top-4 z-40 w-full flex justify-center mb-6 sm:mb-8 px-2 sm:px-0 pointer-events-none">
        <Navigation currentView={currentView} onNavigate={onNavigate} />
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-6xl flex flex-col items-center relative z-10 flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="w-full max-w-4xl mt-16 pt-6 pb-6 border-t border-white/10 flex flex-col items-center justify-center gap-1.5 text-center z-10 relative">
        <p className="text-xs font-mono text-[#9CA3AF] tracking-wider">
          NASA Astronomy Picture of the Day API • Public Domain Dataset
        </p>
        <p className="text-xs font-mono text-[#1E90FF] tracking-wider font-semibold">
          Built by Luke Ponga
        </p>
      </footer>
    </div>
  );
}
