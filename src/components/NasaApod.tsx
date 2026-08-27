import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle, Share2, Download, Compass, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConstellationLoader from './ConstellationLoader';

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

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getRandomDate = () => {
  const start = new Date('1995-06-16T00:00:00').getTime();
  const end = new Date(getLocalDate() + 'T00:00:00').getTime();
  const randomTime = start + Math.random() * (end - start);
  const date = new Date(randomTime);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseMaxDateFromMessage = (msg: string): string | null => {
  // Try matching ISO format first: "and YYYY-MM-DD" or similar
  const isoMatch = msg.match(/and\s+(\d{4}-\d{2}-\d{2})/i) || msg.match(/between\s+\d{4}-\d{2}-\d{2}\s+and\s+(\d{4}-\d{2}-\d{2})/i);
  if (isoMatch) {
    return isoMatch[1];
  }

  // Try matching English format: "and Aug 27, 2026" or "and August 27, 2026"
  const match = msg.match(/and\s+([A-Za-z]+)\s+(\d+),\s+(\d+)/);
  if (match) {
    const [_, monthStr, dayStr, yearStr] = match;
    const months: { [key: string]: string } = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    const month = months[monthStr.substring(0, 3).toLowerCase()];
    if (month) {
      const day = dayStr.padStart(2, '0');
      const year = yearStr;
      return `${year}-${month}-${day}`;
    }
  }
  return null;
};

export default function NasaApod({ selectedDate, onDateChange, onToggleFavorite, isFavorite }: NasaApodProps) {
  const [data, setData] = useState<ApodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const cache = useRef<Map<string, ApodData>>(new Map());

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
      const res = await fetchWithRetry(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&date=${date}`);
      const responseData = await res.json();
      
      if (responseData.code && responseData.code !== 200) {
        throw new Error(responseData.msg || `Error fetching astronomy picture of the day [Code ${responseData.code}]`);
      }

      cache.current.set(date, responseData);
      setData(responseData);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to connect to NASA servers';
      const isDateLimitError = errMsg.toLowerCase().includes('date must be') || 
                               errMsg.toLowerCase().includes('future') || 
                               errMsg.toLowerCase().includes('400') || 
                               errMsg.toLowerCase().includes('bad request');
      
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

      if (date === getLocalDate() && isDateLimitError) {
        console.warn('Current date not yet live on NASA. Falling back to yesterday.');
        const yesterday = addDays(date, -1);
        onDateChange(yesterday);
        return;
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
      } else {
        await navigator.clipboard.writeText(item.url);
        alert('Cosmic link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const todayStr = getLocalDate();
  const minDate = "1995-06-16";

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

  return (
    <div className="w-full mx-auto animate-fade-in relative flex flex-col items-center">
      
      {/* Error Boundary display if API limits exceeded */}
      {error && (
        <div className="bg-red-950/15 border border-red-500/20 rounded-xl p-5 text-red-300 flex items-start gap-3.5 max-w-xl w-full mx-auto shadow-lg mb-8">
          <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-red-200">Cosmic Link Failure</h4>
            <p className="text-xs font-sans font-light leading-relaxed text-red-300/80">{error}</p>
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
              <div className="lg:col-span-8 relative rounded-sm overflow-hidden border border-[#E4A853]/20 bg-[#0C0E12] shadow-2xl group/viewer flex flex-col justify-end min-h-[350px] md:min-h-[500px]">
                {data.media_type === 'image' ? (
                  imageError ? (
                    <div className="absolute inset-0 bg-[#050608] flex flex-col items-center justify-center text-slate-500 p-6 text-center z-0">
                      <Compass size={40} className="text-slate-700 animate-pulse mb-3" />
                      <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Telemetry Lost</span>
                      <p className="text-xs font-sans font-light text-slate-500 mt-1.5 max-w-xs">NASA high-resolution image servers did not respond timely.</p>
                    </div>
                  ) : (
                    <img 
                      src={data.url} 
                      alt={data.title} 
                      className="absolute inset-0 w-full h-full object-cover group-hover/viewer:scale-[1.02] transition-transform duration-[8s] ease-out z-0"
                      referrerPolicy="no-referrer"
                      onError={() => setImageError(true)}
                    />
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
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#050608] via-[#050608]/70 to-transparent z-10 pointer-events-none" />
                
                {/* Title overlay */}
                <div className="relative z-20 p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-end w-full gap-4">
                  <h3 className="text-2xl md:text-3xl font-serif text-white tracking-wide shadow-sm drop-shadow-lg leading-tight">
                    {data.title}
                  </h3>
                  
                  {/* Floating Action Buttons */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => onToggleFavorite(data)}
                      className={`p-2.5 backdrop-blur-md border rounded-full transition-all duration-300 cursor-pointer shadow-lg ${
                        isFavorite(data.date) 
                          ? 'bg-[#E4A853]/20 border-[#E4A853]/50 text-[#E4A853]' 
                          : 'bg-black/40 border-white/10 text-white hover:bg-black/60 hover:text-[#E4A853]'
                      }`}
                      title={isFavorite(data.date) ? "De-catalog Archive" : "Catalog to Favorites"}
                    >
                      <Star size={18} className={isFavorite(data.date) ? "fill-[#E4A853] text-[#E4A853]" : ""} />
                    </button>
                    {data.media_type === 'image' && (
                      <a
                        href={data.hdurl || data.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 backdrop-blur-md border border-white/10 bg-black/40 hover:bg-black/60 text-white hover:text-[#E4A853] rounded-full transition-all duration-300 cursor-pointer shadow-lg"
                        title="Download HD Spectrum"
                      >
                        <Download size={18} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Cosmic Insight (Takes up 4 columns) */}
              <div className="lg:col-span-4 border border-[#E4A853]/20 bg-[#0C0E12] rounded-sm p-6 md:p-8 shadow-xl flex flex-col relative overflow-hidden max-h-[400px] lg:max-h-none">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#E4A853]/5 blur-3xl rounded-full pointer-events-none" />
                
                <h4 className="text-xl md:text-2xl font-serif font-semibold text-[#E4A853] mb-4 md:mb-6 drop-shadow-sm shrink-0">
                  Cosmic Insight
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
                className="w-full sm:w-[180px] flex items-center justify-center gap-2 px-6 py-3 bg-[#E4A853] hover:bg-[#f3be73] text-[#050608] shadow-[0_0_15px_rgba(228,168,83,0.3)] rounded-sm text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer active:scale-95"
                title="I'm Feeling Lucky (Random APOD Date)"
              >
                I'm Feeling Lucky
              </button>
              
              <button
                onClick={handleTodayDate}
                disabled={selectedDate === todayStr}
                className="w-full sm:w-[180px] flex items-center justify-center gap-2 px-6 py-3 bg-transparent border border-[#E4A853] text-[#E4A853] hover:bg-[#E4A853]/10 disabled:opacity-30 disabled:pointer-events-none rounded-sm text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer active:scale-95"
                title="Return to Live Telemetry"
              >
                Reset Today
              </button>
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
