import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Compass, Sparkles, Star, ChevronRight, ChevronDown, Activity, Globe, Eye, Rocket, Maximize2 } from 'lucide-react';
import { getEasternDate } from '../utils/dateUtils';
import { ApodData } from '../types';
import ImageExpansionOverlay from './ImageExpansionOverlay';

interface LandingPageProps {
  onNavigate: (view: string) => void;
  favorites: ApodData[];
  onSelectDate?: (date: string) => void;
}

export default function LandingPage({ onNavigate, favorites, onSelectDate }: LandingPageProps) {
  const [todayData, setTodayData] = useState<ApodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  // Fetch today's featured image for the spotlight
  useEffect(() => {
    let active = true;
    const fetchTodaySpotlight = async () => {
      try {
        // Querying /api/apod without date parameter returns the latest active APOD publication
        const res = await fetch('/api/apod');
        if (!res.ok) throw new Error('API limit or issue');
        const data = await res.json();
        if (active) {
          setTodayData(data);
          setLoading(false);
        }
      } catch (err) {
        // Fallback using US Eastern date
        try {
          const easternStr = getEasternDate();
          const res = await fetch(`/api/apod?date=${easternStr}`);
          if (res.ok) {
            const data = await res.json();
            if (active) {
              setTodayData(data);
              setLoading(false);
            }
          }
        } catch (_) {
          if (active) setLoading(false);
        }
      }
    };

    fetchTodaySpotlight();
    return () => {
      active = false;
    };
  }, []);

  // Starfield interactive constellation background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const starsCount = 45;
    const stars: Array<{ x: number; y: number; vx: number; vy: number; radius: number }> = [];

    for (let i = 0; i < starsCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        radius: Math.random() * 1.5 + 0.5,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(228, 168, 83, 0.45)';
      ctx.strokeStyle = 'rgba(228, 168, 83, 0.08)';

      // Draw connections
      for (let i = 0; i < stars.length; i++) {
        const s1 = stars[i];
        s1.x += s1.vx;
        s1.y += s1.vy;

        if (s1.x < 0 || s1.x > width) s1.vx *= -1;
        if (s1.y < 0 || s1.y > height) s1.vy *= -1;

        ctx.beginPath();
        ctx.arc(s1.x, s1.y, s1.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < stars.length; j++) {
          const s2 = stars[j];
          const dist = Math.hypot(s1.x - s2.x, s1.y - s2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleGoToToday = () => {
    if (onSelectDate && todayData?.date) {
      onSelectDate(todayData.date);
    } else {
      onNavigate('today');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-16 py-4 animate-fade-in relative">
      {/* Absolute interactive canvas backdrop */}
      <div className="absolute inset-0 h-[500px] pointer-events-none -z-10 rounded-2xl overflow-hidden opacity-60">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Main Hero Visual Greeting Card (Integrated with Today's APOD) */}
      <div className="relative rounded-2xl border border-[#E4A853]/20 bg-[#0C0E12]/90 shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden min-h-[500px] flex flex-col justify-end">
        {/* Background image preview */}
        {!loading && todayData && todayData.media_type === 'image' && !imageError ? (
          <img 
            src={todayData.url} 
            alt={todayData.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[20s] ease-out hover:scale-105 -z-10"
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0C0E12] to-[#050608] -z-10" />
        )}
        
        {/* Ambient gradients to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-[#050608]/70 to-transparent -z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050608]/90 via-[#050608]/50 to-transparent -z-10" />

        {/* Observatory Reticle Corners */}
        <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-[#E4A853]/40 pointer-events-none z-10" />
        <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-[#E4A853]/40 pointer-events-none z-10" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-[#E4A853]/40 pointer-events-none z-10" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-[#E4A853]/40 pointer-events-none z-10" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end p-8 md:p-12">
          {/* Hero Left Copy */}
          <div className="lg:col-span-8 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#050608]/90 border border-[#E4A853]/35 text-[10px] font-mono font-semibold uppercase tracking-widest text-[#E4A853]">
              <Activity size={12} className="animate-pulse text-[#E4A853]" />
              <span>NASA Astronomy Picture of the Day</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-tight drop-shadow-md">
              {loading ? 'Establishing Link...' : todayData?.title || 'Cosmic Station Ground Ingress'}
            </h1>

            <p className="text-slate-300 text-base md:text-lg font-light tracking-wide leading-relaxed font-sans line-clamp-3 max-w-2xl drop-shadow-sm">
              {loading ? 'Interfacing with deep-space telemetry arrays to retrieve today\'s stellar coordinates...' : todayData?.explanation || 'Welcome to the Observatory Vault. Interface with live NASA telemetry arrays, discover cosmic anomalies, and catalog wonders of the universe.'}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <button
                type="button"
                onClick={handleGoToToday}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-[#E4A853] hover:bg-[#f3be73] text-[#050608] shadow-[0_0_25px_rgba(228,168,83,0.35)] rounded-sm text-sm font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer active:scale-95 group"
              >
                <Rocket size={15} className="group-hover:translate-x-1 transition-transform" />
                Explore Today's Image
              </button>

              <button
                type="button"
                onClick={() => onNavigate('discover')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#050608]/50 backdrop-blur-md border border-[#E4A853]/50 text-[#E4A853] hover:bg-[#E4A853]/10 rounded-sm text-sm font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer active:scale-95"
              >
                <Compass size={15} />
                Gallery
              </button>

              <button
                type="button"
                onClick={() => onNavigate('favorites')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#050608]/50 backdrop-blur-md border border-white/20 text-slate-300 hover:text-[#E4A853] hover:border-[#E4A853]/50 rounded-sm text-sm font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer active:scale-95"
              >
                <Star size={15} />
                Saved
              </button>
            </div>
          </div>

          {/* Hero Right: Real Status Card Widget */}
          <div className="lg:col-span-4 w-full flex justify-center lg:justify-end">
            <div className="w-full rounded-xl border border-white/10 bg-[#050608]/95 backdrop-blur-xl p-5 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#3DFF8C]/5 blur-2xl rounded-full pointer-events-none" />
              
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <Activity size={12} className="text-[#3DFF8C]" />
                  Telemetry
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#3DFF8C]/10 border border-[#3DFF8C]/30 text-[9px] font-mono uppercase tracking-widest text-[#3DFF8C] font-bold shadow-[0_0_10px_rgba(61,255,140,0.2)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3DFF8C] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3DFF8C]" />
                  </span>
                  Online
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Eye size={12} />
                    <span className="text-[9px] font-mono uppercase tracking-widest">Active Sensor</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-200">JWST (NIRCam)</span>
                </div>
                
                <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Sparkles size={12} />
                    <span className="text-[9px] font-mono uppercase tracking-widest">Core Temp</span>
                  </div>
                  <span className="text-xs font-semibold text-[#E4A853]">6.2 Kelvin</span>
                </div>
                
                <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Globe size={12} />
                    <span className="text-[9px] font-mono uppercase tracking-widest">Link State</span>
                  </div>
                  <span className="text-xs font-semibold text-[#3DFF8C]">Established</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Cue */}
      <div className="flex justify-center -my-8 sm:-my-10 relative z-20">
        <button
          id="landing-scroll-cue-btn"
          type="button"
          onClick={() => spotlightRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="group flex flex-col items-center gap-1.5 px-4 py-2 rounded-full bg-[#0C0E12]/90 border border-[#E4A853]/30 hover:border-[#E4A853]/70 backdrop-blur-md text-[#E4A853] hover:text-[#ffd99e] transition-all duration-300 cursor-pointer shadow-[0_4px_25px_rgba(0,0,0,0.7),0_0_15px_rgba(228,168,83,0.15)] active:scale-95"
          aria-label="Scroll down to discover daily spotlight and cosmic archive"
        >
          <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-slate-300 group-hover:text-[#E4A853] transition-colors">
            Scroll to Discover
          </span>
          <ChevronDown size={14} className="animate-bounce text-[#E4A853]" />
        </button>
      </div>

      {/* Saved Wonders Preview Grid */}
      <div ref={spotlightRef} className="space-y-6 text-left pt-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#E4A853] uppercase tracking-widest font-bold">Your Curated Archive</span>
            <h3 className="text-2xl font-serif text-slate-100 font-medium">Saved Wonders</h3>
          </div>
          <button 
            type="button"
            onClick={() => onNavigate('favorites')}
            className="flex items-center gap-1 text-xs font-mono text-[#E4A853] hover:text-[#ffd99e] transition-colors cursor-pointer group"
          >
            View Entire Vault
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {favorites.length === 0 ? (
          <div className="h-[200px] w-full rounded-lg border border-white/5 bg-[#0C0E12] flex items-center justify-center text-slate-500">
            <div className="text-center space-y-2">
              <Star size={24} className="mx-auto opacity-20" />
              <span className="text-xs font-mono block">Your vault is currently empty.</span>
              <span className="text-[10px] font-sans block opacity-70">Catalog images from the gallery to build your archive.</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {favorites.slice(0, 4).map(item => (
              <div 
                key={item.date}
                onClick={() => onSelectDate && onSelectDate(item.date)}
                className="group relative w-full h-[200px] rounded-xl overflow-hidden border border-white/5 shadow-lg cursor-pointer flex flex-col justify-end p-4 hover:border-[#E4A853]/40 transition-colors"
              >
                {item.media_type === 'image' ? (
                  <img 
                    src={item.url} 
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[4s] ease-out -z-10"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1a1d24] to-[#050608] -z-10 flex items-center justify-center">
                    <span className="text-[10px] font-mono text-slate-500">Video Media</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent -z-10" />
                
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-[#E4A853] uppercase tracking-widest block">
                    {item.date}
                  </span>
                  <h4 className="text-sm font-serif text-white leading-tight line-clamp-2 group-hover:text-[#E4A853] transition-colors">
                    {item.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Elegant Triple Gateway Portals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Portal 1 */}
        <button 
          type="button"
          onClick={handleGoToToday}
          className="group/p1 relative rounded-xl border border-white/5 bg-[#0C0E12]/80 hover:bg-[#E4A853]/5 hover:border-[#E4A853]/40 p-6 text-left cursor-pointer transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 shadow-lg hover:shadow-[0_12px_30px_rgba(228,168,83,0.15)] flex flex-col items-start w-full focus:outline-none focus:ring-2 focus:ring-[#E4A853]/50"
        >
          <div className="flex items-center justify-between w-full mb-5">
            <div className="h-10 w-10 rounded-lg bg-[#E4A853]/10 border border-[#E4A853]/20 flex items-center justify-center text-[#E4A853] group-hover/p1:bg-[#E4A853]/20 group-hover/p1:scale-110 transition-all duration-300">
              <Compass size={18} />
            </div>
            <div className="h-8 w-8 rounded-full flex items-center justify-center border border-white/5 bg-white/5 text-slate-500 group-hover/p1:bg-[#E4A853]/20 group-hover/p1:text-[#E4A853] group-hover/p1:border-[#E4A853]/40 transition-all duration-300">
              <ChevronRight size={16} className="group-hover/p1:translate-x-0.5 transition-transform" />
            </div>
          </div>
          <h4 className="text-lg font-serif font-semibold text-slate-200 group-hover/p1:text-[#E4A853] transition-colors mb-2">Explore Today</h4>
          <p className="text-xs text-slate-400 font-light leading-relaxed font-sans">
            Interface directly with today's live astronomical telemetry. Back-date coordinates through our interactive spherical control dial.
          </p>
        </button>

        {/* Portal 2 */}
        <button 
          type="button"
          onClick={() => onNavigate('discover')}
          className="group/p2 relative rounded-xl border border-white/5 bg-[#0C0E12]/80 hover:bg-[#E4A853]/5 hover:border-[#E4A853]/40 p-6 text-left cursor-pointer transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 shadow-lg hover:shadow-[0_12px_30px_rgba(228,168,83,0.15)] flex flex-col items-start w-full focus:outline-none focus:ring-2 focus:ring-[#E4A853]/50"
        >
          <div className="flex items-center justify-between w-full mb-5">
            <div className="h-10 w-10 rounded-lg bg-[#E4A853]/10 border border-[#E4A853]/20 flex items-center justify-center text-[#E4A853] group-hover/p2:bg-[#E4A853]/20 group-hover/p2:scale-110 transition-all duration-300">
              <Eye size={18} />
            </div>
            <div className="h-8 w-8 rounded-full flex items-center justify-center border border-white/5 bg-white/5 text-slate-500 group-hover/p2:bg-[#E4A853]/20 group-hover/p2:text-[#E4A853] group-hover/p2:border-[#E4A853]/40 transition-all duration-300">
              <ChevronRight size={16} className="group-hover/p2:translate-x-0.5 transition-transform" />
            </div>
          </div>
          <h4 className="text-lg font-serif font-semibold text-slate-200 group-hover/p2:text-[#E4A853] transition-colors mb-2">Voyage Gallery</h4>
          <p className="text-xs text-slate-400 font-light leading-relaxed font-sans">
            Examine deep-space catalogs with dynamic grid layout preferences. Query, search, and randomize multi-decade NASA coordinates.
          </p>
        </button>

        {/* Portal 3 */}
        <button 
          type="button"
          onClick={() => onNavigate('favorites')}
          className="group/p3 relative rounded-xl border border-white/5 bg-[#0C0E12]/80 hover:bg-[#E4A853]/5 hover:border-[#E4A853]/40 p-6 text-left cursor-pointer transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 shadow-lg hover:shadow-[0_12px_30px_rgba(228,168,83,0.15)] flex flex-col items-start w-full focus:outline-none focus:ring-2 focus:ring-[#E4A853]/50"
        >
          <div className="flex items-center justify-between w-full mb-5">
            <div className="h-10 w-10 rounded-lg bg-[#E4A853]/10 border border-[#E4A853]/20 flex items-center justify-center text-[#E4A853] group-hover/p3:bg-[#E4A853]/20 group-hover/p3:scale-110 transition-all duration-300">
              <Star size={18} />
            </div>
            <div className="h-8 w-8 rounded-full flex items-center justify-center border border-white/5 bg-white/5 text-slate-500 group-hover/p3:bg-[#E4A853]/20 group-hover/p3:text-[#E4A853] group-hover/p3:border-[#E4A853]/40 transition-all duration-300">
              <ChevronRight size={16} className="group-hover/p3:translate-x-0.5 transition-transform" />
            </div>
          </div>
          <h4 className="text-lg font-serif font-semibold text-slate-200 group-hover/p3:text-[#E4A853] transition-colors mb-2">Saved Wonders</h4>
          <p className="text-xs text-slate-400 font-light leading-relaxed font-sans">
            Retrieve your personal saved cosmic telemetry logs. Securely catalog and access your curated archive anytime.
          </p>
        </button>
      </div>

      {/* Fullscreen Expansion Overlay */}
      <ImageExpansionOverlay
        item={todayData}
        isOpen={showOverlay}
        onClose={() => setShowOverlay(false)}
        onSelectDate={(date) => {
          handleGoToToday();
          setShowOverlay(false);
        }}
      />
    </div>
  );
}
