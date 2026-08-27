import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle, Share2, Download, ChevronLeft, ChevronRight, Shuffle, Calendar, Star, Sparkles } from 'lucide-react';
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

const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

// Date math helpers
const addDays = (dateStr: string, days: number) => {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
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
        
        // If it's a client-side error (4xx) we don't retry, but rather parse the message body
        if (response.status >= 400 && response.status < 500) {
          let errorMsg = `HTTP error! status: ${response.status}`;
          try {
            const errData = await response.json();
            if (errData && errData.msg) {
              errorMsg = errData.msg;
            } else if (errData && errData.error && errData.error.message) {
              errorMsg = errData.error.message;
            }
          } catch (_) {
            // response was not JSON or failed to parse
          }
          throw new Error(errorMsg);
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      } catch (err) {
        // Do not retry 4xx errors, fail immediately
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
    // Check cache first
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
      
      // Attempt to parse maximum available date from NASA error message
      const maxDate = parseMaxDateFromMessage(errMsg);
      if (maxDate) {
        console.warn('NASA date limit reached. Self-correcting date dynamically to max allowed:', maxDate);
        if (maxDate !== date) {
          onDateChange(maxDate);
          return;
        } else {
          // If the parsed max date is equal to the requested date but it failed,
          // it means NASA hasn't published it yet despite listing it as the limit.
          // Fallback to the day before.
          const yesterday = addDays(maxDate, -1);
          onDateChange(yesterday);
          return;
        }
      }

      // Fallback: If no max date parsed but the error is related to date limit/future, and we requested today's local date, try yesterday
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
        // Fallback copy to clipboard
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
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in pb-16">
      {/* Title / Slogan */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 bg-stellar-500/10 text-stellar-400 px-3.5 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase border border-stellar-500/15">
          <Sparkles size={11} className="animate-pulse" />
          ASTRONOMY PICTURE OF THE DAY
        </div>
        <h2 className="text-4xl md:text-6xl font-serif font-light tracking-tight text-slate-100 max-w-2xl mx-auto leading-none">
          Discover the <span className="italic font-normal text-stellar-400">Cosmic Vault</span>
        </h2>
        <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto font-sans font-light">
          Traverse NASA's historical archives of interstellar observations, updated daily.
        </p>
      </div>

      {/* Date Navigation Hub */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-space-900 p-4 border border-space-800 rounded-xl">
        {/* Date Selector and Changers */}
        <div className="flex items-center justify-center gap-4 w-full sm:w-auto">
          <button
            onClick={handlePrevDate}
            disabled={selectedDate <= minDate}
            className="p-3 bg-space-950 border border-space-800 hover:border-space-600 hover:text-stellar-400 rounded-full text-slate-400 disabled:opacity-30 disabled:pointer-events-none transition duration-200 flex-shrink-0 cursor-pointer"
            title="Yesterday"
          >
            <ChevronLeft size={18} />
          </button>
          
          {/* Telescope Date Dial Orb */}
          <div className="relative flex-shrink-0">
            <button
              className="
                relative h-16 w-16 rounded-full
                bg-[#050608] 
                flex flex-col items-center justify-center
                shadow-[0_0_20px_rgba(228,168,83,0.25)]
                border border-[#E4A853]/40
                backdrop-blur-md
                transition-all duration-300
                hover:shadow-[0_0_30px_rgba(228,168,83,0.45)]
                hover:border-[#E4A853]/60
                active:scale-95
                group/orb
              "
            >
              <span className="text-[8px] font-mono tracking-widest text-[#E4A853]/85 uppercase select-none leading-none mb-0.5">
                {(() => {
                  try {
                    const d = new Date(selectedDate + 'T00:00:00');
                    return d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                  } catch {
                    return 'DATE';
                  }
                })()}
              </span>
              <span className="text-lg font-serif font-bold text-[#E4A853] select-none leading-none group-hover/orb:text-[#ffd99e] transition-colors">
                {selectedDate.split('-')[2] || '01'}
              </span>
              
              {/* Subtle inner dial ticks overlay */}
              <span className="absolute inset-1.5 rounded-full border border-[#E4A853]/10 group-hover/orb:border-[#E4A853]/20 transition-colors duration-300" />
              
              {/* Interactive Date Select Overlaid */}
              <input
                type="date"
                min={minDate}
                max={todayStr}
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-20 rounded-full"
                title="Choose custom date"
              />
            </button>
          </div>

          <button
            onClick={handleNextDate}
            disabled={selectedDate >= todayStr}
            className="p-3 bg-space-950 border border-space-800 hover:border-space-600 hover:text-stellar-400 rounded-full text-slate-400 disabled:opacity-30 disabled:pointer-events-none transition duration-200 flex-shrink-0 cursor-pointer"
            title="Tomorrow"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Discovery shortcuts */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleRandomDate}
            className="flex-grow sm:flex-grow-0 inline-flex items-center justify-center gap-2 px-4 py-2 bg-space-950 hover:bg-space-800 border border-space-800 hover:border-space-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
            title="Random archive date"
          >
            <Shuffle size={13} />
            Random Date
          </button>
          <button
            onClick={handleTodayDate}
            disabled={selectedDate === todayStr}
            className="flex-grow sm:flex-grow-0 inline-flex items-center justify-center gap-2 px-4 py-2 bg-stellar-500 hover:bg-stellar-600 text-space-950 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer"
            title="Jump to today"
          >
            <Calendar size={13} />
            Today
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-space-900 border border-space-800 rounded-xl p-12 flex flex-col items-center justify-center min-h-[400px] shadow-inner">
          <ConstellationLoader label="Aligning telescope mirrors..." />
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-slate-900/30 border border-slate-800/80 rounded-2xl space-y-4">
          <AlertCircle size={40} className="text-red-500" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-200">Cosmic Link Disruption</h3>
            <p className="text-slate-400 text-sm max-w-md">{error}</p>
          </div>
          <button
            onClick={() => fetchApod(selectedDate)}
            className="mt-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition"
          >
            Retry Transmit
          </button>
        </div>
      )}
      
      {/* Detail Showcase */}
      {data && !loading && !error && (
        <div className="space-y-8 animate-fade-in relative">
          {/* JWST Hex-Gold Optics catching light - background flare */}
          <div className="absolute -inset-12 pointer-events-none overflow-hidden z-0 select-none">
            <div 
              className="w-full h-full opacity-14 blur-3xl animate-pulse"
              style={{ 
                backgroundImage: 'radial-gradient(circle, rgba(228, 168, 83, 0.28) 0%, rgba(228, 168, 83, 0.05) 50%, transparent 75%)',
                animationDuration: '8s'
              }}
            />
          </div>

          {/* Main Display Frame */}
          <div className="relative z-10 rounded-xl overflow-hidden border border-space-800 bg-space-900 shadow-2xl">
            {data.media_type === 'image' ? (
              imageError ? (
                <div className="w-full aspect-video md:h-[480px] bg-space-950 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                  <AlertCircle className="w-12 h-12 mb-4 text-slate-600" />
                  <p className="font-semibold text-lg text-slate-300">Unable to load deep space picture</p>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">The telemetry image source could not be resolved. This is occasionally due to temporary DNS disruption at NASA servers.</p>
                </div>
              ) : (
                <div className="relative group overflow-hidden max-h-[580px] flex items-center justify-center">
                  <img 
                    src={data.url} 
                    alt={data.title} 
                    className="w-full object-cover" 
                    referrerPolicy="no-referrer" 
                    onError={() => setImageError(true)}
                  />
                </div>
              )
            ) : data.media_type === 'video' && !data.url.includes('youtube') ? (
              <video src={data.url} controls preload="auto" className="w-full aspect-video max-h-[480px]" />
            ) : (
              <iframe 
                src={data.url.includes('youtube.com/watch?v=') ? data.url.replace('watch?v=', 'embed/') : data.url} 
                title={data.title} 
                className="w-full aspect-video max-h-[480px]" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}

            {/* Gradient Mask Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-transparent to-transparent opacity-40 pointer-events-none"></div>

            {/* Float Action overlays */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {/* Toggle Favorite button */}
              <button
                onClick={() => onToggleFavorite(data)}
                className={`p-2.5 backdrop-blur-md border rounded-full transition-all duration-300 cursor-pointer ${isFavorite(data.date) ? 'bg-stellar-500/15 border-stellar-500/40 text-stellar-400 hover:bg-stellar-500/25' : 'bg-space-950/75 border-space-800 text-slate-300 hover:text-white hover:bg-space-800'}`}
                title={isFavorite(data.date) ? "Remove from Favorites" : "Add to Favorites"}
              >
                <Star size={16} className={isFavorite(data.date) ? "fill-stellar-400 text-stellar-400" : ""} />
              </button>

              <button
                onClick={() => handleShare(data)}
                className="p-2.5 bg-space-950/75 backdrop-blur-md border border-space-800 text-slate-300 hover:text-white hover:bg-space-800 rounded-full transition cursor-pointer"
                title="Share picture"
              >
                <Share2 size={16} />
              </button>
              
              {data.media_type === 'image' && (
                <a
                  href={data.hdurl || data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-space-950/75 backdrop-blur-md border border-space-800 text-slate-300 hover:text-white hover:bg-space-800 rounded-full transition cursor-pointer"
                  title="Download HD picture"
                >
                  <Download size={16} />
                </a>
              )}
            </div>
          </div>
          
          {/* Detailed Narrative Panel */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-space-800 pb-5">
              <div>
                <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-tight text-slate-100">{data.title}</h2>
                <p className="text-slate-400 text-xs mt-2 flex items-center gap-2">
                  <span className="font-mono bg-space-900 px-2 py-0.5 rounded border border-space-800 text-stellar-400">{formatDate(data.date)}</span>
                  {data.copyright && (
                    <>
                      <span>•</span>
                      <span className="italic font-sans text-slate-400">Captured by {data.copyright}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Explanation card */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-stellar-400 flex items-center gap-1.5">
                Scientific Explanation
              </h3>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed font-sans bg-space-900/60 p-6 md:p-8 rounded-xl border border-space-800 shadow-inner">
                {data.explanation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
