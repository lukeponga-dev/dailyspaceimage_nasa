import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle, Share2, Download, Compass, Star, ChevronLeft, ChevronRight, Maximize2, Check, Sparkles, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConstellationLoader from './ConstellationLoader';
import { 
  getEasternDate, 
  addDays, 
  formatDate, 
  getRandomDate, 
  parseMaxDateFromMessage, 
  isDateUnavailableError, 
  NASA_EPOCH 
} from '../utils/dateUtils';

interface ApodData {
  title: string;
  url: string;
  explanation: string;
  date: string;
  media_type: string;
  copyright?: string;
  hdurl?: string;
}

interface NasaApodProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onToggleFavorite: (item: ApodData) => void;
  isFavorite: (date: string) => boolean;
}

const NASA_API_KEY = process.env.NASA_API_KEY || "DQyanRGtyfc3NAXvp1c69yTUBiEUt32RISDWcajH";

export default function NasaApod({ selectedDate, onDateChange, onToggleFavorite, isFavorite }: NasaApodProps) {
  const [data, setData] = useState<ApodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const cache = useRef<Map<string, ApodData>>(new Map());

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const fetchWithRetry = async (url: string, retries = 3, timeout = 10000): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        
        if (response.ok) return response;
        
        if (response.status >= 400 && response.status < 500) {
          let errorMsg = `HTTP error! status: ${response.status}`;
          try {
            const errData = await response.json();
            if (errData && errData.msg) {
              errorMsg = errData.msg;
            } else if (errData && errData.error && errData.error.message) {
              errorMsg = errData.error.message;
            }
          } catch (_) {}
          throw new Error(errorMsg);
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      } catch (err) {
        if (err instanceof Error && !err.message.includes('HTTP error! status: 5') && !err.message.includes('Failed to fetch') && !err.message.includes('aborted')) {
          throw err;
        }
        if (i === retries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('Failed after retries');
  };

  const fetchApod = useCallback(async (date: string) => {
    if (cache.current.has(date)) {
      setData(cache.current.get(date)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setImageError(false);

    try {
      const easternToday = getEasternDate();
      let targetDate = date;

      // Self-correct if client timezone picked a date in the future relative to NASA Eastern Time
      if (targetDate > easternToday) {
        console.warn(`Requested date ${date} is ahead of NASA US Eastern (${easternToday}). Adjusting to today.`);
        onDateChange(easternToday);
        return;
      }

      // If targetDate matches today's eastern date, NASA APOD without date parameter ALWAYS returns the active published item
      const url = targetDate === easternToday
        ? `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`
        : `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&date=${targetDate}`;

      const res = await fetchWithRetry(url);
      const responseData = await res.json();
      
      if (responseData.code && responseData.code !== 200) {
        throw new Error(responseData.msg || `Error fetching astronomy picture of the day [Code ${responseData.code}]`);
      }

      // If NASA's returned item has a different date (e.g. today's image is not yet released, so NASA served yesterday's):
      if (responseData.date && responseData.date !== targetDate && targetDate === easternToday) {
        console.info(`NASA current picture is dated ${responseData.date}. Synchronizing selected date.`);
        cache.current.set(responseData.date, responseData);
        setData(responseData);
        onDateChange(responseData.date);
        return;
      }

      cache.current.set(targetDate, responseData);
      setData(responseData);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to connect to NASA servers';
      const isDateLimit = isDateUnavailableError(errMsg);
      
      const maxDate = parseMaxDateFromMessage(errMsg);
      if (maxDate) {
        console.warn('NASA date limit reached. Self-correcting date dynamically to max allowed:', maxDate);
        if (maxDate !== date) {
          onDateChange(maxDate);
          return;
        } else {
          const yesterday = addDays(maxDate, -1);
          onDateChange(yesterday);
          return;
        }
      }

      if (isDateLimit) {
        console.warn(`Archive data unavailable for date ${date}. Falling back to previous day.`);
        const yesterday = addDays(date, -1);
        if (yesterday >= NASA_EPOCH) {
          showToast(`Archive for ${date} not yet published. Showing ${yesterday}.`);
          onDateChange(yesterday);
          return;
        }
      }
      
      console.error('Fetch error:', err);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [onDateChange]);

  useEffect(() => {
    fetchApod(selectedDate);
  }, [fetchApod, selectedDate]);

  const handleShare = async (item: ApodData) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: item.explanation.substring(0, 100) + '...',
          url: item.url,
        });
        showToast("Telemetry shared successfully!");
      } else {
        await navigator.clipboard.writeText(item.url);
        showToast("Stellar Link copied to clipboard!");
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const todayStr = getEasternDate();
  const minDate = NASA_EPOCH;

  const handlePrevDate = () => {
    if (selectedDate > minDate) {
      onDateChange(addDays(selectedDate, -1));
    }
  };

  const handleNextDate = () => {
    if (selectedDate < todayStr) {
      onDateChange(addDays(selectedDate, 1));
    }
  };

  const handleRandomDate = () => {
    onDateChange(getRandomDate());
  };

  const handleTodayDate = () => {
    onDateChange(todayStr);
  };

  const handleToggleFavWithToast = (item: ApodData) => {
    const wasFav = isFavorite(item.date);
    onToggleFavorite(item);
    showToast(wasFav ? "De-cataloged from Vault" : "Cataloged to Saved Wonders ⭐");
  };

  return (
    <div className="w-full mx-auto animate-fade-in relative flex flex-col items-center">
      
      {/* Toast Notification HUD */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 bg-[#0C0E12]/90 border border-[#E4A853]/40 text-[#E4A853] px-5 py-3 rounded-full backdrop-blur-xl shadow-[0_10px_30px_rgba(228,168,83,0.25)] flex items-center gap-2.5 text-xs font-mono tracking-wider font-semibold"
          >
            <Sparkles size={14} className="animate-spin [animation-duration:6s]" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Boundary display if API limits exceeded */}
      {error && (
        <div className="bg-red-950/15 border border-red-500/20 rounded-xl p-5 text-red-300 flex flex-col sm:flex-row items-start gap-4 max-w-xl w-full mx-auto shadow-lg mb-8">
          <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
          <div className="space-y-3 flex-1">
            <div>
              <h4 className="text-sm font-semibold text-red-200">Cosmic Link Failure</h4>
              <p className="text-xs font-sans font-light leading-relaxed text-red-300/80">{error}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => onDateChange(todayStr)}
                className="px-3 py-1.5 bg-[#E4A853]/10 hover:bg-[#E4A853]/20 border border-[#E4A853]/30 text-[#E4A853] text-xs font-mono rounded cursor-pointer transition-colors"
              >
                Latest Archive
              </button>
              <button
                onClick={() => onDateChange(addDays(selectedDate, -1))}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono rounded cursor-pointer transition-colors"
              >
                Previous Day
              </button>
              <button
                onClick={() => fetchApod(selectedDate)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono rounded cursor-pointer transition-colors flex items-center gap-1"
              >
                <RefreshCw size={11} />
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Loading Micro-Twinkles */}
      {loading && (
        <div className="w-full bg-[#0C0E12]/50 border border-white/5 rounded-2xl p-16 flex flex-col items-center justify-center min-h-[420px] shadow-xl">
          <ConstellationLoader label="Acquiring stellar telemetry..." />
        </div>
      )}

      {/* Display APOD Detail Showcase */}
      <AnimatePresence mode="wait">
        {data && !loading && !error && (
          <motion.div 
            key={data.date}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex flex-col items-center relative z-10"
          >
            {/* Main Content Layout */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-10 items-stretch">
              
              {/* Left: APOD Image (Takes up 8 columns) */}
              <div className="lg:col-span-8 relative rounded-sm overflow-hidden border border-[#E4A853]/25 bg-[#0C0E12] shadow-2xl group/viewer flex flex-col justify-end min-h-[350px] md:min-h-[500px]">
                
                {/* JWST Optical Reticle Corner Markers */}
                <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-[#E4A853]/60 pointer-events-none z-20 group-hover/viewer:border-[#E4A853] transition-colors" />
                <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-[#E4A853]/60 pointer-events-none z-20 group-hover/viewer:border-[#E4A853] transition-colors" />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-[#E4A853]/60 pointer-events-none z-20 group-hover/viewer:border-[#E4A853] transition-colors" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-[#E4A853]/60 pointer-events-none z-20 group-hover/viewer:border-[#E4A853] transition-colors" />

                {/* Day Navigation Arrow Controls */}
                <button
                  onClick={handlePrevDate}
                  disabled={selectedDate <= minDate}
                  title="Step Back 1 Day"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-[#050608]/80 hover:bg-[#E4A853] text-[#E4A853] hover:text-[#050608] border border-[#E4A853]/30 backdrop-blur-md opacity-0 group-hover/viewer:opacity-100 transition-all duration-300 shadow-xl disabled:opacity-0 cursor-pointer active:scale-90"
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  onClick={handleNextDate}
                  disabled={selectedDate >= todayStr}
                  title="Step Forward 1 Day"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-[#050608]/80 hover:bg-[#E4A853] text-[#E4A853] hover:text-[#050608] border border-[#E4A853]/30 backdrop-blur-md opacity-0 group-hover/viewer:opacity-100 transition-all duration-300 shadow-xl disabled:opacity-0 cursor-pointer active:scale-90"
                >
                  <ChevronRight size={20} />
                </button>

                {data.media_type === 'image' ? (
                  imageError ? (
                    <div className="absolute inset-0 bg-[#050608] flex flex-col items-center justify-center text-slate-500 p-6 text-center z-0">
                      <Compass size={40} className="text-slate-700 animate-pulse mb-3" />
                      <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Telemetry Lost</span>
                      <p className="text-xs font-sans font-light text-slate-500 mt-1.5 max-w-xs">NASA high-resolution image servers did not respond timely.</p>
                    </div>
                  ) : (
                    <div 
                      className="absolute inset-0 w-full h-full cursor-zoom-in"
                      onClick={() => setLightboxOpen(true)}
                      title="Click to Expand High-Res Lightbox View"
                    >
                      <img 
                        src={data.url} 
                        alt={data.title} 
                        className="w-full h-full object-cover group-hover/viewer:scale-[1.03] transition-transform duration-[8s] ease-out z-0"
                        referrerPolicy="no-referrer"
                        onError={() => setImageError(true)}
                      />
                    </div>
                  )
                ) : data.media_type === 'video' && !data.url.includes('youtube') ? (
                  <video src={data.url} controls preload="auto" className="absolute inset-0 w-full h-full object-cover z-0 bg-[#050608]" />
                ) : (
                  <iframe 
                    src={data.url.includes('youtube.com/watch?v=') ? data.url.replace('watch?v=', 'embed/') : data.url} 
                    title={data.title} 
                    className="absolute inset-0 w-full h-full z-0 bg-[#050608]" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}

                {/* Bottom Overlay gradient for Title */}
                <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-[#050608] via-[#050608]/80 to-transparent z-10 pointer-events-none" />
                
                {/* Title overlay */}
                <div className="relative z-20 p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-end w-full gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-[#E4A853] uppercase tracking-widest font-semibold">
                      APOD Coordinate • {formatDate(data.date)}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-serif text-white tracking-wide shadow-sm drop-shadow-lg leading-tight">
                      {data.title}
                    </h3>
                  </div>
                  
                  {/* Floating Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {data.media_type === 'image' && (
                      <button
                        onClick={() => setLightboxOpen(true)}
                        className="p-2.5 backdrop-blur-md border border-white/10 bg-black/40 hover:bg-black/60 text-white hover:text-[#E4A853] rounded-full transition-all duration-300 cursor-pointer shadow-lg"
                        title="Expand High-Res Lightbox"
                      >
                        <Maximize2 size={16} />
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleFavWithToast(data)}
                      className={`p-2.5 backdrop-blur-md border rounded-full transition-all duration-300 cursor-pointer shadow-lg ${
                        isFavorite(data.date) 
                          ? 'bg-[#E4A853]/20 border-[#E4A853]/50 text-[#E4A853]' 
                          : 'bg-black/40 border-white/10 text-white hover:bg-black/60 hover:text-[#E4A853]'
                      }`}
                      title={isFavorite(data.date) ? "De-catalog Archive" : "Catalog to Favorites"}
                    >
                      <Star size={16} className={isFavorite(data.date) ? "fill-[#E4A853] text-[#E4A853]" : ""} />
                    </button>

                    <button
                      onClick={() => handleShare(data)}
                      className="p-2.5 backdrop-blur-md border border-white/10 bg-black/40 hover:bg-black/60 text-white hover:text-[#E4A853] rounded-full transition-all duration-300 cursor-pointer shadow-lg"
                      title="Share Cosmic Link"
                    >
                      <Share2 size={16} />
                    </button>

                    {data.media_type === 'image' && (
                      <a
                        href={data.hdurl || data.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 backdrop-blur-md border border-white/10 bg-black/40 hover:bg-black/60 text-white hover:text-[#E4A853] rounded-full transition-all duration-300 cursor-pointer shadow-lg"
                        title="Download HD Spectrum"
                      >
                        <Download size={16} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Cosmic Insight (Takes up 4 columns) */}
              <div className="lg:col-span-4 border border-[#E4A853]/20 bg-[#0C0E12] rounded-sm p-6 md:p-8 shadow-xl flex flex-col relative overflow-hidden max-h-[420px] lg:max-h-none">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#E4A853]/5 blur-3xl rounded-full pointer-events-none" />
                
                <h4 className="text-xl md:text-2xl font-serif font-semibold text-[#E4A853] mb-4 md:mb-6 drop-shadow-sm shrink-0 flex items-center justify-between">
                  <span>Cosmic Insight</span>
                  <Sparkles size={16} className="text-[#E4A853]/60" />
                </h4>
                
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  <p className="text-[13px] md:text-[14px] text-slate-300 font-sans font-light leading-relaxed whitespace-pre-line text-justify">
                    {data.explanation}
                  </p>
                </div>
                
                {data.copyright && (
                  <div className="mt-6 pt-4 border-t border-white/5 text-right shrink-0">
                    <span className="text-[11px] font-sans italic text-slate-500 uppercase tracking-widest">
                      © {data.copyright}
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* Action Buttons: I'm Feeling Lucky / Reset Today */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 w-full max-w-lg mx-auto lg:max-w-none">
              <button
                onClick={handleRandomDate}
                className="w-full sm:w-[200px] flex items-center justify-center gap-2 px-6 py-3.5 bg-[#E4A853] hover:bg-[#f3be73] text-[#050608] shadow-[0_0_20px_rgba(228,168,83,0.35)] rounded-sm text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer active:scale-95"
                title="I'm Feeling Lucky (Random APOD Date)"
              >
                <Sparkles size={15} />
                I'm Feeling Lucky
              </button>
              
              <button
                onClick={handleTodayDate}
                disabled={selectedDate === todayStr}
                className="w-full sm:w-[200px] flex items-center justify-center gap-2 px-6 py-3.5 bg-transparent border border-[#E4A853] text-[#E4A853] hover:bg-[#E4A853]/10 disabled:opacity-30 disabled:pointer-events-none rounded-sm text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer active:scale-95"
                title="Return to Live Telemetry"
              >
                Reset Today
              </button>
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox Fullscreen Modal */}
      <AnimatePresence>
        {lightboxOpen && data && data.media_type === 'image' && (
          <div 
            className="fixed inset-0 bg-[#050608]/95 backdrop-blur-2xl z-50 flex flex-col items-center justify-center p-4 md:p-8"
            onClick={() => setLightboxOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-6xl w-full max-h-[90vh] flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute -top-12 right-0 p-2.5 text-slate-400 hover:text-[#E4A853] bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="relative rounded-lg overflow-hidden border border-[#E4A853]/30 shadow-[0_0_50px_rgba(228,168,83,0.2)] max-h-[80vh]">
                <img 
                  src={data.hdurl || data.url} 
                  alt={data.title}
                  className="max-h-[80vh] w-auto max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="mt-4 text-center space-y-1">
                <h3 className="text-xl font-serif text-white">{data.title}</h3>
                <p className="text-xs font-mono text-[#E4A853] uppercase tracking-widest">{data.date}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

