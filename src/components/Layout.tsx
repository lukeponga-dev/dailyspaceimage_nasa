import React, { useMemo } from 'react';
import Navigation from './Navigation';
import { motion } from 'motion/react';
import jwstGoldEmblem from '../assets/images/jwst_gold_emblem_1787854317963.jpg';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function Layout({ children, currentView, onNavigate, selectedDate, onDateChange }: LayoutProps) {
  const minDate = "1995-06-16";
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const formattedDate = useMemo(() => {
    try {
      const d = new Date(selectedDate + 'T00:00:00');
      return `${d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} ${d.getDate()} ${d.getFullYear()}`;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-[#050608] text-slate-100 flex flex-col items-center pt-8 md:pt-16 pb-6 px-4 sm:px-6 relative overflow-hidden">
      
      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#E4A853]/5 blur-[120px] rounded-[100%] pointer-events-none -z-10" />

      {/* 🪐 Hero Graphic Area */}
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 mb-10 w-full max-w-4xl justify-center text-center md:text-left select-none relative z-10">
        <motion.img 
          src={jwstGoldEmblem} 
          alt="JWST Gold Hexagonal Mirror Cluster"
          className="w-24 h-24 sm:w-28 sm:h-28 object-contain filter drop-shadow-[0_0_30px_rgba(228,168,83,0.35)] rounded-full transition-all duration-500"
        />
        <div className="flex flex-col gap-1.5 md:gap-2">
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#FFD700] tracking-tight leading-tight drop-shadow-md">
            Astronomy Picture of the Day
          </h1>
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-slate-100 tracking-tight leading-none opacity-90">
            Discover the Cosmic Vault
          </h2>
        </div>
      </div>

      {/* Telescope Control Dial (Spherical Orb) Date Picker */}
      <div className="mb-8 relative group/dial flex items-center justify-center z-10">
        {/* Pulsing orbital halo rings */}
        <span className="absolute -inset-4 border border-dashed border-[#E4A853]/20 rounded-full animate-spin [animation-duration:40s] pointer-events-none opacity-50 group-hover/dial:opacity-100 transition-opacity duration-500" />
        <span className="absolute -inset-2 border border-[#E4A853]/10 rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[#E4A853] opacity-10 blur-xl rounded-[100%] group-hover/dial:opacity-30 transition-opacity duration-500 pointer-events-none" />

        <div
          className="
            relative h-24 w-24 rounded-full
            bg-[#050608]/90 
            flex flex-col items-center justify-center
            shadow-[0_0_20px_rgba(228,168,83,0.3),inset_0_1px_3px_rgba(255,255,255,0.08)]
            border border-[#E4A853]/50
            backdrop-blur-xl
            transition-all duration-500
            hover:shadow-[0_0_40px_rgba(228,168,83,0.6)]
            hover:border-[#E4A853]/90
            active:scale-95 cursor-pointer
            overflow-hidden
          "
        >
          {/* Outer dial ring scale marks */}
          <div className="absolute inset-1 border border-[#E4A853]/15 rounded-full group-hover/dial:border-[#E4A853]/35 transition-colors duration-300 pointer-events-none" />
          
          <span className="text-[10px] font-mono tracking-widest text-[#E4A853]/90 uppercase select-none leading-none mb-0.5 mt-1.5 font-bold z-10 pointer-events-none transition-colors group-hover/dial:text-[#E4A853]">
            {(() => {
              try {
                return new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
              } catch { return 'OBS'; }
            })()}
          </span>
          <span className="text-3xl font-serif font-bold text-[#E4A853] select-none leading-none tracking-tight group-hover/dial:text-[#ffd99e] transition-colors z-10 pointer-events-none drop-shadow-[0_0_10px_rgba(228,168,83,0.8)]">
            {selectedDate.split('-')[2] || '01'}
          </span>
          <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase select-none leading-none mt-1 group-hover/dial:text-[#E4A853]/70 transition-colors z-10 pointer-events-none">
            {selectedDate.split('-')[0] || '2026'}
          </span>
          
          {/* Fully interactive hidden date field */}
          <input
            type="date"
            min={minDate}
            max={todayStr}
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-20 rounded-full"
            title="Select Specific Coordinates"
          />
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="mb-10 w-full flex justify-center z-20 relative">
        <Navigation currentView={currentView} onNavigate={onNavigate} />
      </div>

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
