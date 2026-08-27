import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Grid, Eye, Shuffle, Star, ExternalLink, Calendar, Heart, Video, Image, ArrowUpDown, X, Download, Sparkles } from 'lucide-react';
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

interface DiscoverProps {
  favorites: ApodData[];
  onToggleFavorite: (item: ApodData) => void;
  isFavorite: (date: string) => boolean;
  onSelectImage: (date: string) => void;
}

const NASA_API_KEY = process.env.NASA_API_KEY || "DQyanRGtyfc3NAXvp1c69yTUBiEUt32RISDWcajH";

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

const parseMaxDateFromMessage = (msg: string): string | null => {
  const isoMatch = msg.match(/and\s+(\d{4}-\d{2}-\d{2})/i) || msg.match(/between\s+\d{4}-\d{2}-\d{2}\s+and\s+(\d{4}-\d{2}-\d{2})/i);
  if (isoMatch) {
    return isoMatch[1];
  }

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

export default function Discover({ favorites, onToggleFavorite, isFavorite, onSelectImage }: DiscoverProps) {
  const [gallery, setGallery] = useState<ApodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [feedMode, setFeedMode] = useState<'recent' | 'random'>('recent');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  
  const [selectedItem, setSelectedItem] = useState<ApodData | null>(null);

  const fetchGallery = useCallback(async () => {
    setLoading(true);

    try {
      let url = '';

      if (feedMode === 'recent') {
        const now = new Date();
        const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const startDateObj = new Date(now);
        startDateObj.setDate(startDateObj.getDate() - 30);
        const startDate = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-${String(startDateObj.getDate()).padStart(2, '0')}`;
        url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&start_date=${startDate}&end_date=${endDate}`;
      } else {
        url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&count=24`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        let errMsg = `API Response Error (HTTP Status ${res.status})`;
        if (res.status === 400) {
          try {
            const errJson = await res.json();
            if (errJson && errJson.msg) {
              errMsg = errJson.msg;
            }
          } catch (_) {}
        }
        throw new Error(errMsg);
      }
      const data = await res.json();
      
      let items: ApodData[] = Array.isArray(data) ? data : [data];
      setGallery(items);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to connect to NASA servers';
      const isDateLimitError = feedMode === 'recent' && (
        errMsg.toLowerCase().includes('date must be') || 
        errMsg.toLowerCase().includes('future') || 
        errMsg.toLowerCase().includes('400') || 
        errMsg.toLowerCase().includes('bad request')
      );
      
      if (isDateLimitError) {
        let maxDateStr = parseMaxDateFromMessage(errMsg);
        
        const now = new Date();
        const getAdjustedDateStr = (date: Date) => {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        };

        const addDaysToObj = (d: Date, days: number) => {
          const res = new Date(d);
          res.setDate(res.getDate() + days);
          return res;
        };

        if (maxDateStr) {
          console.warn('Discover gallery date limit reached. Self-correcting range to end on:', maxDateStr);
          const maxDateObj = new Date(maxDateStr + 'T00:00:00');
          const startDateObj = new Date(maxDateObj);
          startDateObj.setDate(startDateObj.getDate() - 30);
          const startDate = getAdjustedDateStr(startDateObj);
          
          try {
            const retryRes = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&start_date=${startDate}&end_date=${maxDateStr}`);
            if (retryRes.ok) {
              const retryData = await retryRes.json();
              setGallery(Array.isArray(retryData) ? retryData : [retryData]);
              return;
            }
          } catch (retryErr) {
            console.warn('Adjusted gallery fetch retry failed:', retryErr);
          }
        } else {
          const yesterdayObj = addDaysToObj(now, -1);
          const yesterdayStr = getAdjustedDateStr(yesterdayObj);
          const startObj = addDaysToObj(yesterdayObj, -30);
          const startStr = getAdjustedDateStr(startObj);

          try {
            const retryRes = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&start_date=${startStr}&end_date=${yesterdayStr}`);
            if (retryRes.ok) {
              const retryData = await retryRes.json();
              setGallery(Array.isArray(retryData) ? retryData : [retryData]);
              return;
            }
          } catch (retryErr) {
            console.warn('1-day gallery fetch retry failed:', retryErr);
          }
        }
      }
      
      console.error('Gallery fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [feedMode]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const handleItemClick = (item: ApodData) => {
    setSelectedItem(item);
  };

  const closeModal = () => {
    setSelectedItem(null);
  };

  const filteredGallery = gallery
    .filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.explanation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMedia = mediaTypeFilter === 'all' || item.media_type === mediaTypeFilter;
      return matchesSearch && matchesMedia;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
    });

  return (
    <div className="space-y-10 animate-fade-in pb-16 relative">
      {/* Visual background atmospheric flare */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#C18A4A]/3 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-slate-100 leading-none">
            Explore <span className="italic font-light text-[#E4A853]">Deep Space</span>
          </h2>
          <p className="text-slate-400 mt-3 text-sm md:text-base font-light font-sans tracking-wide">
            Browse NASA's extensive cosmic library, search celestial phenomena, and discover historical archives.
          </p>
        </div>

        {/* Premium Feed Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-[#0C0E12] border border-white/5 p-1 rounded-full self-start md:self-auto shadow-lg relative z-10">
          <button
            onClick={() => setFeedMode('recent')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer active:scale-95 select-none ${
              feedMode === 'recent' 
                ? 'bg-[#E4A853] text-[#050608] shadow-[0_4px_15px_rgba(228,168,83,0.3)]' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar size={11} />
            Recent Array
          </button>
          
          <button
            onClick={() => setFeedMode('random')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer active:scale-95 select-none ${
              feedMode === 'random' 
                ? 'bg-[#E4A853] text-[#050608] shadow-[0_4px_15px_rgba(228,168,83,0.3)]' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shuffle size={11} />
            Random Coordinates
          </button>
        </div>
      </div>

      {/* Control Panel: Elegant Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-[#0C0E12] p-4 border border-white/5 rounded-2xl relative z-10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        
        {/* Search Input with Gold Focus Accent */}
        <div className="relative md:col-span-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input
            type="text"
            placeholder="Search cosmic titles & explanations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#050608] text-slate-100 pl-10 pr-4 py-2.5 rounded-xl border border-white/5 focus:border-[#E4A853]/50 focus:ring-1 focus:ring-[#E4A853]/15 focus:outline-none transition-all text-xs tracking-wide"
          />
        </div>

        {/* Media Type Filter Tab */}
        <div className="grid grid-cols-3 md:col-span-4 bg-[#050608] p-1 border border-white/5 rounded-xl">
          <button
            onClick={() => setMediaTypeFilter('all')}
            className={`py-1.5 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              mediaTypeFilter === 'all' 
                ? 'bg-[#0C0E12] text-[#E4A853] border border-white/5 shadow-inner' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            All Fields
          </button>
          
          <button
            onClick={() => setMediaTypeFilter('image')}
            className={`py-1.5 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
              mediaTypeFilter === 'image' 
                ? 'bg-[#0C0E12] text-[#E4A853] border border-white/5 shadow-inner' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Image size={11} />
            Imaging
          </button>
          
          <button
            onClick={() => setMediaTypeFilter('video')}
            className={`py-1.5 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
              mediaTypeFilter === 'video' 
                ? 'bg-[#0C0E12] text-[#E4A853] border border-white/5 shadow-inner' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Video size={11} />
            Kinetic
          </button>
        </div>

        {/* Sort By Filter Option */}
        <div className="relative md:col-span-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
            className="w-full bg-[#050608] text-slate-300 py-2.5 pl-4 pr-10 rounded-xl border border-white/5 focus:border-[#E4A853]/50 focus:outline-none text-xs font-semibold cursor-pointer appearance-none tracking-wide"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          <ArrowUpDown size={12} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Grid List displaying galactic items */}
      {loading ? (
        <div className="bg-[#0C0E12] border border-white/5 rounded-2xl p-16 flex flex-col items-center justify-center min-h-[420px] shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          <ConstellationLoader label="Mapping cosmic coordinates..." />
        </div>
      ) : filteredGallery.length === 0 ? (
        <div className="text-center p-16 bg-[#0C0E12] border border-white/5 rounded-2xl shadow-[inset_0_1px_3px_rgba(255,255,255,0.01)]">
          <p className="text-slate-400 text-xs font-sans font-light tracking-wide">No cosmic archives match your search query parameters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredGallery.map((item) => {
            const favorited = isFavorite(item.date);
            return (
              <div 
                key={item.date} 
                className="group bg-[#0C0E12] border border-white/5 hover:border-[#E4A853]/30 rounded-2xl overflow-hidden hover:shadow-[0_12px_30px_rgba(0,0,0,0.65),0_0_20px_rgba(228,168,83,0.03)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full cursor-pointer relative"
                onClick={() => handleItemClick(item)}
              >
                {/* Media box frame */}
                <div className="relative aspect-video overflow-hidden bg-[#050608]">
                  {item.media_type === 'image' ? (
                    <img 
                      src={item.url} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#050608] text-slate-500 space-y-2">
                      <Video size={18} className="text-slate-700 group-hover:text-[#E4A853] transition-colors" />
                      <span className="text-[8px] font-mono uppercase tracking-widest text-slate-500">Video Spectra</span>
                    </div>
                  )}

                  {/* Shading overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050608]/75 via-transparent to-transparent opacity-80"></div>
                  
                  {/* Favorite Toggle Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item);
                    }}
                    className={`absolute top-3 right-3 p-1.5 bg-[#050608]/80 backdrop-blur-md rounded-full border transition-all duration-300 cursor-pointer ${
                      favorited 
                        ? 'border-[#E4A853]/45 text-[#E4A853] bg-[#E4A853]/10' 
                        : 'border-white/5 text-slate-500 hover:text-[#E4A853] hover:border-[#E4A853]/30'
                    }`}
                  >
                    <Star size={11} className={favorited ? "text-[#E4A853] fill-[#E4A853]" : ""} />
                  </button>

                  <span className="absolute bottom-3 left-3 bg-[#050608]/90 backdrop-blur-sm border border-white/5 px-2 py-0.5 rounded text-[9px] font-mono text-slate-400">
                    {formatDate(item.date)}
                  </span>
                </div>

                {/* Meta textual information */}
                <div className="p-4 flex flex-col flex-grow space-y-2.5">
                  <h3 className="font-semibold text-slate-200 text-sm leading-snug group-hover:text-[#E4A853] transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 flex-grow font-sans font-light">
                    {item.explanation}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
                    <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wider">
                      {item.media_type} Domain
                    </span>
                    <button className="text-[9px] text-[#E4A853] group-hover:text-[#ffd99e] font-semibold inline-flex items-center gap-1 cursor-pointer select-none">
                      <Eye size={10} />
                      Examine Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Overlay / Modal Popup Dialog */}
      <AnimatePresence>
        {selectedItem && (
          <div 
            className="fixed inset-0 bg-[#050608]/95 backdrop-blur-md flex items-center justify-center p-4 md:p-6 z-50 overflow-y-auto"
            onClick={closeModal}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#0C0E12] border border-white/5 p-6 md:p-8 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative shadow-[0_25px_60px_rgba(0,0,0,0.85)] space-y-6" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Details */}
              <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight text-slate-100">{selectedItem.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-2.5 flex items-center gap-1.5">
                    <span className="font-mono bg-[#050608] px-2.5 py-0.5 rounded border border-white/5 text-[#E4A853] font-bold">{formatDate(selectedItem.date)}</span>
                    {selectedItem.copyright && (
                      <>
                        <span>•</span>
                        <span className="italic font-sans text-slate-400">Observer Signoff: {selectedItem.copyright}</span>
                      </>
                    )}
                  </p>
                </div>
                <button 
                  onClick={closeModal} 
                  className="p-2 bg-[#050608] hover:bg-[#0C0E12] text-slate-400 hover:text-[#E4A853] rounded-full border border-white/5 hover:border-[#E4A853]/25 transition-all duration-300 cursor-pointer active:scale-95"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Media Showcase Frame with JWST flare background */}
              <div className="relative">
                <div className="absolute -inset-10 pointer-events-none overflow-hidden z-0 select-none">
                  <div 
                    className="w-full h-full opacity-12 blur-3xl animate-pulse"
                    style={{ 
                      backgroundImage: 'radial-gradient(circle, rgba(228, 168, 83, 0.25) 0%, rgba(228, 168, 83, 0.04) 50%, transparent 75%)',
                      animationDuration: '8s'
                    }}
                  />
                </div>

                <div className="relative z-10 rounded-xl overflow-hidden bg-[#050608] border border-white/5 aspect-video max-h-96 flex items-center justify-center shadow-inner">
                  {selectedItem.media_type === 'image' ? (
                    <img 
                      src={selectedItem.url} 
                      alt={selectedItem.title} 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <iframe 
                      src={selectedItem.url.includes('youtube.com/watch?v=') ? selectedItem.url.replace('watch?v=', 'embed/') : selectedItem.url} 
                      title={selectedItem.title} 
                      className="w-full h-full" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              </div>

              {/* Rich Details Explanations */}
              <div className="space-y-3.5">
                <h4 className="text-[9px] uppercase font-mono font-bold tracking-widest text-[#E4A853] flex items-center gap-1 select-none">
                  <Sparkles size={11} /> Deep Narrative Spectrum
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed bg-[#050608]/50 p-6 rounded-xl border border-white/5 font-sans font-light">
                  {selectedItem.explanation}
                </p>
              </div>

              {/* Modal Control Action deck */}
              <div className="flex flex-wrap items-center gap-3 pt-5 border-t border-white/5">
                <button
                  onClick={() => {
                    onSelectImage(selectedItem.date);
                    closeModal();
                  }}
                  className="inline-flex items-center gap-2 bg-[#E4A853] hover:bg-[#ffd99e] text-[#050608] text-[10px] font-bold uppercase tracking-widest px-5 py-3 rounded-xl shadow-lg transition-all duration-300 cursor-pointer active:scale-95"
                >
                  <ExternalLink size={12} />
                  Initiate Observation Link
                </button>
                
                <button
                  onClick={() => onToggleFavorite(selectedItem)}
                  className={`inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-5 py-3 rounded-xl border transition-all duration-300 cursor-pointer active:scale-95 ${
                    isFavorite(selectedItem.date) 
                      ? 'bg-[#E4A853]/10 border-[#E4A853]/40 text-[#E4A853]' 
                      : 'bg-[#050608] border border-white/5 text-slate-300 hover:border-[#E4A853]/30 hover:text-[#E4A853]'
                  }`}
                >
                  <Heart size={12} className={isFavorite(selectedItem.date) ? "fill-[#E4A853] text-[#E4A853]" : ""} />
                  {isFavorite(selectedItem.date) ? 'Cataloged' : 'Catalog Archive'}
                </button>

                {selectedItem.media_type === 'image' && (
                  <a
                    href={selectedItem.hdurl || selectedItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#050608] border border-white/5 text-slate-300 hover:border-[#E4A853]/30 hover:text-[#E4A853] text-[10px] font-bold uppercase tracking-widest px-5 py-3 rounded-xl transition-all duration-300 sm:ml-auto cursor-pointer active:scale-95 shadow-md"
                  >
                    <Download size={12} />
                    HD Resolution
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
