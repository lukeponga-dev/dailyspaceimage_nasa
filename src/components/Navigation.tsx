import { Calendar, Compass, Star } from 'lucide-react';

interface Props {
  onNavigate: (view: string) => void;
  currentView: string;
}

export default function Navigation({ onNavigate, currentView }: Props) {
  const navItems = [
    { name: 'Today', icon: Calendar, view: 'today' },
    { name: 'Discover', icon: Compass, view: 'discover' },
    { name: 'Favorites', icon: Star, view: 'favorites' },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto bg-space-900/95 backdrop-blur-xl border border-space-800 py-2.5 px-6 rounded-2xl flex justify-between items-center gap-8 shadow-[0_12px_40px_rgba(0,0,0,0.65)]">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button 
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className="flex flex-col items-center gap-1 transition-all duration-300 relative px-3 py-1 cursor-pointer"
            >
              <item.icon size={19} className={`transition-transform duration-300 ${isActive ? 'text-stellar-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`} />
              <span className={`text-[9px] uppercase tracking-wider font-semibold transition-colors duration-300 ${isActive ? 'text-stellar-400' : 'text-slate-500'}`}>
                {item.name}
              </span>
              {isActive && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-stellar-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
