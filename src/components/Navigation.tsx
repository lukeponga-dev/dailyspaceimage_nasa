import React from 'react';
import { motion } from 'motion/react';

interface Props {
  onNavigate: (view: string) => void;
  currentView: string;
}

interface ModeItem {
  id: string; // 'landing' | 'today' | 'discover' | 'favorites'
  label: string; // 'Home' | 'Explore' | 'Voyage' | 'Saved'
}

export default function Navigation({ onNavigate, currentView }: Props) {
  const modes: ModeItem[] = [
    { id: 'landing', label: 'Home' },
    { id: 'today', label: 'Explore' },
    { id: 'discover', label: 'Voyage' },
    { id: 'favorites', label: 'Saved' },
  ];

  return (
    <nav className="pointer-events-auto bg-[#050608]/90 backdrop-blur-2xl border border-white/10 p-1.5 md:py-3 md:px-6 rounded-full flex justify-between items-center shadow-[0_15px_45px_rgba(0,0,0,0.85),0_0_30px_rgba(228,168,83,0.08)] relative overflow-hidden max-w-sm sm:max-w-md md:max-w-lg w-full mx-auto">
      
      {/* Desktop Tabs View (hidden md:flex) */}
        <div className="hidden md:flex items-center justify-center w-full gap-4 text-sm font-sans select-none">
          {modes.map((mode, index) => {
            const isActive = currentView === mode.id;
            return (
              <React.Fragment key={mode.id}>
                {index > 0 && <span className="text-white/20 select-none px-1">|</span>}
                <button
                  onClick={() => onNavigate(mode.id)}
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
              </React.Fragment>
            );
          })}
        </div>

      {/* Mobile Segmented Control View (flex md:hidden) */}
      <div className="grid grid-cols-4 w-full gap-1 p-0.5 select-none md:hidden">
        {modes.map((mode) => {
          const isActive = currentView === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onNavigate(mode.id)}
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
  );
}

