import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Compass, Sparkles, Star, ChevronRight, Activity, Globe, Eye, Rocket } from 'lucide-react';
import { getEasternDate } from '../utils/dateUtils';
import { ApodData } from '../types';

interface LandingPageProps {
  onNavigate: (view: string) => void;
  favoritesCount: number;
  onSelectDate?: (date: string) => void;
}


export default function LandingPage({ onNavigate, favoritesCount, onSelectDate }: LandingPageProps) {
  const [todayData, setTodayData] = useState<ApodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

      {/* Main Hero Visual Greeting Card */}
      <div className="relative rounded-2xl border border-[#E4A853]/20 bg-[#0C0E12]/90 backdrop-blur-xl p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* Observatory Reticle Corners */}
        <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-[#E4A853]/40 pointer-events-none" />
        <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-[#E4A853]/40 pointer-events-none" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-[#E4A853]/40 pointer-events-none" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-[#E4A853]/40 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Hero Left Copy */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#050608]/90 border border-[#E4A853]/35 text-[10px] font-mono font-semibold uppercase tracking-widest text-[#E4A853]">
              <Activity size={12} className="animate-pulse text-[#E4A853]" />
              <span>Cosmic Station Ground Ingress</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-tight">
              Embark on a <br />
              <span className="italic font-light text-[#E4A853]">Stellar Voyage</span>
            </h1>

            <p className="text-slate-300 text-base md:text-lg font-light tracking-wide leading-relaxed font-sans">
              Welcome to the Observatory Vault. Seamlessly interface with live NASA telemetry arrays, discover cosmic anomalies through historical deep-space photography, and catalog wonders of the universe.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleGoToToday}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-[#E4A853] hover:bg-[#f3be73] text-[#050608] shadow-[0_0_25px_rgba(228,168,83,0.35)] rounded-sm text-sm font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer active:scale-95 group"
              >
                <Rocket size={15} className="group-hover:translate-x-1 transition-transform" />
                Launch Explore Array
              </button>

              <button
                onClick={() => onNavigate('discover')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-transparent border border-[#E4A853]/50 text-[#E4A853] hover:bg-[#E4A853]/10 rounded-sm text-sm font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer active:scale-95"
              >
                Search Galaxy Gallery
              </button>
            </div>
          </div>

          {/* Hero Right: Live Telemetry Indicator Widget */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
            <div className="w-full max-w-sm rounded-xl border border-white/5 bg-[#050608]/90 p-6 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#E4A853]/5 blur-2xl rounded-full" />
              
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-[10px] font-mono text-[#E4A853] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <Globe size={11} className="animate-spin [animation-duration:12s]" />
                  Observatory Status
                </span>
                <span className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-[9px] font-mono uppercase tracking-widest text-green-400 font-bold">
                  Online
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Active Sensor</span>
                  <span className="text-xs font-semibold text-slate-200 block">JWST (NIRCam)</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Core Temp</span>
                  <span className="text-xs font-semibold text-[#E4A853] block">6.2 Kelvin</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Archive Depth</span>
                  <span className="text-xs font-semibold text-slate-200 block">11,380+ Logs</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Telemetry Link</span>
                  <span className="text-xs font-semibold text-slate-200 block">Established</span>
                </div>
              </div>

              {/* Saved Vault count highlight */}
              <div className="p-3 bg-[#E4A853]/5 border border-[#E4A853]/20 rounded-lg flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Star size={13} className="text-[#E4A853] fill-[#E4A853]/30" />
                  <span className="text-slate-300">Saved Wonders Vault</span>
                </div>
                <span className="text-sm font-serif font-bold text-[#E4A853]">{favoritesCount} Curated</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Featured Spotlight preview */}
      <div className="space-y-6 text-left">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#E4A853] uppercase tracking-widest font-bold">Today's Highlight Coordinates</span>
            <h3 className="text-2xl font-serif text-slate-100 font-medium">Stellar Spotlight</h3>
          </div>
          <button 
            onClick={handleGoToToday}
            className="flex items-center gap-1 text-xs font-mono text-[#E4A853] hover:text-[#ffd99e] transition-colors cursor-pointer group"
          >
            Enter Observatory
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {loading ? (
          <div className="h-[280px] w-full rounded-lg border border-white/5 bg-[#0C0E12] flex items-center justify-center">
            <span className="text-xs font-mono text-[#E4A853] animate-pulse">Establishing Deep Space Data Link...</span>
          </div>
        ) : todayData ? (
          <div 
            onClick={handleGoToToday}
            className="group/spotlight relative w-full h-[320px] rounded-xl overflow-hidden border border-[#E4A853]/20 shadow-2xl cursor-pointer flex flex-col justify-end p-6 md:p-8"
          >
            {/* Background image preview */}
            {todayData.media_type === 'image' && !imageError ? (
              <img 
                src={todayData.url} 
                alt={todayData.title}
                className="absolute inset-0 w-full h-full object-cover group-hover/spotlight:scale-105 transition-transform duration-[8s] ease-out -z-10"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#0C0E12] to-[#050608] -z-10" />
            )}
            
            {/* Ambient gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050608]/95 via-[#050608]/60 to-transparent -z-10" />
            
            <div className="max-w-2xl space-y-2">
              <span className="text-[9px] font-mono text-[#E4A853] uppercase tracking-widest font-bold">
                Astronomical Target • {todayData.date}
              </span>
              <h4 className="text-2xl md:text-3xl font-serif text-white tracking-wide leading-tight group-hover/spotlight:text-[#E4A853] transition-colors">
                {todayData.title}
              </h4>
              <p className="text-xs md:text-sm text-slate-300 font-light font-sans line-clamp-2 max-w-xl opacity-90">
                {todayData.explanation}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[120px] w-full rounded-lg border border-white/5 bg-[#0C0E12] flex items-center justify-center text-slate-500">
            <span className="text-xs font-mono">Spotlight telemetry offline. Enter live view below.</span>
          </div>
        )}
      </div>

      {/* Elegant Triple Gateway Portals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Portal 1 */}
        <div 
          onClick={handleGoToToday}
          className="group/p1 relative rounded-xl border border-white/5 bg-[#0C0E12]/80 hover:border-[#E4A853]/40 p-6 text-left cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-lg"
        >
          <div className="h-10 w-10 rounded-lg bg-[#E4A853]/10 border border-[#E4A853]/20 flex items-center justify-center text-[#E4A853] mb-5 group-hover/p1:bg-[#E4A853]/20 transition-colors">
            <Compass size={18} />
          </div>
          <h4 className="text-lg font-serif font-semibold text-slate-200 group-hover/p1:text-[#E4A853] transition-colors mb-2">Explore Today</h4>
          <p className="text-xs text-slate-400 font-light leading-relaxed font-sans">
            Interface directly with today's live astronomical telemetry. Back-date coordinates through our interactive spherical control dial.
          </p>
        </div>

        {/* Portal 2 */}
        <div 
          onClick={() => onNavigate('discover')}
          className="group/p2 relative rounded-xl border border-white/5 bg-[#0C0E12]/80 hover:border-[#E4A853]/40 p-6 text-left cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-lg"
        >
          <div className="h-10 w-10 rounded-lg bg-[#E4A853]/10 border border-[#E4A853]/20 flex items-center justify-center text-[#E4A853] mb-5 group-hover/p2:bg-[#E4A853]/20 transition-colors">
            <Eye size={18} />
          </div>
          <h4 className="text-lg font-serif font-semibold text-slate-200 group-hover/p2:text-[#E4A853] transition-colors mb-2">Voyage Gallery</h4>
          <p className="text-xs text-slate-400 font-light leading-relaxed font-sans">
            Examine deep-space catalogs with dynamic grid layout preferences. Query, search, and randomize multi-decade NASA coordinates.
          </p>
        </div>

        {/* Portal 3 */}
        <div 
          onClick={() => onNavigate('favorites')}
          className="group/p3 relative rounded-xl border border-white/5 bg-[#0C0E12]/80 hover:border-[#E4A853]/40 p-6 text-left cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-lg"
        >
          <div className="h-10 w-10 rounded-lg bg-[#E4A853]/10 border border-[#E4A853]/20 flex items-center justify-center text-[#E4A853] mb-5 group-hover/p3:bg-[#E4A853]/20 transition-colors">
            <Star size={18} />
          </div>
          <h4 className="text-lg font-serif font-semibold text-slate-200 group-hover/p3:text-[#E4A853] transition-colors mb-2">Saved Wonders</h4>
          <p className="text-xs text-slate-400 font-light leading-relaxed font-sans">
            Retrieve your personal saved cosmic telemetry logs. Securely catalog and access your curated archive anytime.
          </p>
        </div>
      </div>

    </div>
  );
}
