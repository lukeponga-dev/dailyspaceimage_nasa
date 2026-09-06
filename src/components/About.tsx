import React from 'react';
import { Compass, Sparkles, Database, Github, Code, Shield } from 'lucide-react';

export default function About() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 py-8 animate-fade-in text-left relative">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#E4A853]/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="space-y-4 pb-8 border-b border-white/5">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight">
          About the <span className="italic font-light text-[#E4A853]">Mission</span>
        </h2>
        <p className="text-slate-300 font-light font-sans max-w-2xl leading-relaxed">
          The NASA Daily Space Image Viewer provides an immersive, high-resolution interface to explore the cosmos. Powered directly by NASA's Astronomy Picture of the Day (APOD) API, it brings deep-space telemetry, historical archives, and educational astronomy directly to your viewport.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0C0E12] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="h-10 w-10 rounded-lg bg-[#E4A853]/10 flex items-center justify-center text-[#E4A853]">
            <Database size={20} />
          </div>
          <h3 className="text-lg font-serif font-semibold text-slate-100">NASA APOD API</h3>
          <p className="text-sm font-light text-slate-400 leading-relaxed font-sans">
            All imagery and metadata are sourced directly from NASA. The APOD project has been running since 1995, featuring a different image or photograph of our universe each day, along with a brief explanation written by a professional astronomer.
          </p>
        </div>

        <div className="bg-[#0C0E12] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="h-10 w-10 rounded-lg bg-[#E4A853]/10 flex items-center justify-center text-[#E4A853]">
            <Code size={20} />
          </div>
          <h3 className="text-lg font-serif font-semibold text-slate-100">Developer Intel</h3>
          <p className="text-sm font-light text-slate-400 leading-relaxed font-sans">
            Built by Luke Ponga. Designed with a mobile-first philosophy, utilizing React 18, Tailwind CSS, and Framer Motion to create a fluid, cinematic experience across all devices.
          </p>
        </div>
      </div>

      <div className="bg-[#050608]/80 backdrop-blur-md border border-[#E4A853]/20 rounded-2xl p-8 mt-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#E4A853]/10 blur-3xl rounded-full" />
        <Sparkles size={24} className="text-[#E4A853] mx-auto" />
        <h4 className="text-xl font-serif text-white">Version 1.0.0 — Orbital Release</h4>
        <div className="flex flex-wrap justify-center gap-4 text-xs font-mono">
          <a href="#" className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-colors border border-white/10">
            <Github size={14} /> Open Source
          </a>
          <a href="#" className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-colors border border-white/10">
            <Shield size={14} /> Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}
