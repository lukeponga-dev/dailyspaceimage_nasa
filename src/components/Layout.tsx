import React from 'react';
import Navigation from './Navigation';

export default function Layout({ children, currentView, onNavigate }: { children: React.ReactNode; currentView: string; onNavigate: (view: string) => void }) {
  return (
    <div className="min-h-screen bg-space-950 text-slate-100 pb-28">
      <header className="fixed top-0 left-0 right-0 py-4 px-6 md:px-8 flex items-center justify-between z-50 bg-space-950/80 backdrop-blur-md border-b border-space-800">
        <h1 className="text-lg md:text-xl font-serif font-semibold tracking-wide text-slate-100">
          Daily Space Image
        </h1>
        <span className="text-[10px] font-mono uppercase tracking-widest text-stellar-400 border border-stellar-500/20 bg-stellar-500/5 px-2.5 py-1 rounded-full">
          NASA APOD ARCHIVE
        </span>
      </header>
      <main className="pt-24 px-4 md:px-8 max-w-5xl mx-auto">
        {children}
      </main>
      <Navigation currentView={currentView} onNavigate={onNavigate} />
    </div>
  );
}
