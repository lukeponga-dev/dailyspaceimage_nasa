import React from 'react';
import { motion } from 'motion/react';

interface Props {
  onNavigate: (view: string) => void;
  currentView: string;
}

interface ModeItem {
  id: string; // 'today' | 'discover' | 'favorites'
  label: string; // 'Explore' | 'Voyage' | 'Saved'
}

export default function Navigation({ onNavigate, currentView }: Props) {
  const modes: ModeItem[] = [
    { id: 'today', label: 'Explore' },
    { id: 'discover', label: 'Voyage' },
    { id: 'favorites', label: 'Saved' },
  ];

  return (
    <nav className="pointer-events-auto bg-[#050608]/90 backdrop-blur-2xl border border-white/5 py-3 px-4 md:px-6 rounded-full flex justify-between items-center shadow-[0_15px_45px_rgba(0,0,0,0.85),0_0_30px_rgba(228,168,83,0.06)] relative overflow-hidden max-w-lg w-full mx-auto">
      
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

        {/* Mobile Chips View (flex md:hidden) */}
        <div className="flex md:hidden items-center justify-center w-full overflow-x-auto gap-3 scrollbar-none py-1">
          {modes.map((mode) => {
            const isActive = currentView === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => onNavigate(mode.id)}
                className={`
                  whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer outline-none focus:outline-none flex-shrink-0
                  ${isActive 
                    ? 'text-[#E4A853] bg-[#E4A853]/10 border border-[#E4A853]/40 shadow-[0_0_12px_rgba(228,168,83,0.15)]' 
                    : 'text-white/60 bg-white/5 border border-white/5 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                {mode.label}
              </button>
            );
          })}
        </div>

      </nav>
  );
}

