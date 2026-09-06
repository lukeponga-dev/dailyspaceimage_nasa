import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Grid, Eye, Shuffle, Star, ExternalLink, Calendar, Heart, Video, Image, ArrowUpDown, X, Download, Sparkles, Compass, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConstellationLoader from './ConstellationLoader';
import { 
  getEasternDate, 
  addDays, 
  formatDate, 
  parseMaxDateFromMessage, 
  isDateUnavailableError 
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

interface DiscoverProps {
  favorites: ApodData[];
  onToggleFavorite: (item: ApodData) => void;
  isFavorite: (date: string) => boolean;
  onSelectImage: (date: string) => void;
}

const NASA_API_KEY = process.env.NASA_API_KEY || "DQyanRGtyfc3NAXvp1c69yTUBiEUt32RISDWcajH";

export default function Discover({ favorites, onToggleFavorite, isFavorite, onSelectImage }: DiscoverProps) {
  const [gallery, setGallery] = useState<ApodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [feedMode, setFeedMode] = useState<'recent' | 'random'>('recent');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [gridColumns, setGridColumns] = useState<'grid2x2' | 'grid4x4'>('grid2x2');
  
  const [selectedItem, setSelectedItem] = useState<ApodData | null>(null);

  const fetchGallery = useCallback(async () => {
    setLoading(true);

    try {
      let url = '';

      if (feedMode === 'recent') {
        const easternToday = getEasternDate();
        const endDate = easternToday;
        const startDate = addDays(easternToday, -30);
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
      const isDateLimitError = feedMode === 'recent' && isDateUnavailableError(errMsg);
      
      if (isDateLimitError) {
        const maxDateStr = parseMaxDateFromMessage(errMsg);
        const easternToday = getEasternDate();
        const fallbackEnd = maxDateStr || addDays(easternToday, -1);
        const fallbackStart = addDays(fallbackEnd, -30);

        console.warn(`Gallery date limit reached. Adjusting window to end at ${fallbackEnd}`);
        try {
          const retryRes = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&start_date=${fallbackStart}&end_date=${fallbackEnd}`);
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            setGallery(Array.isArray(retryData) ? retryData : [retryData]);
            return;
          }
        } catch (retryErr) {
          console.warn('Adjusted gallery fetch retry failed:', retryErr);
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
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#E4A853]/5 blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* Hero Header Section for Voyage Galactic Gallery */}
      <div className="relative rounded-2xl border border-[#E4A853]/25 bg-[#0C0E12]/90 backdrop-blur-xl p-8 md:p-10 shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Optical JWST Corner Reticle Accents */}
        <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-[#E4A853]/60 pointer-events-none" />
        <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-[#E4A853]/60 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-[#E4A853]/60 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-[#E4A853]/60 pointer-events-none" />

        {/* Subtle background cosmic grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#E4A853_1px,transparent_1px)] [background-size:32px_32px]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            {/* Status Telemetry Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#050608] border border-[#E4A853]/30 text-[10px] font-mono font-semibold uppercase tracking-widest text-[#E4A853]">
              <span className="w-2 h-2 rounded-full bg-[#E4A853] animate-pulse" />
              <span>NASA Deep-Space Telemetry • Voyage Array</span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-semibold tracking-tight text-slate-100 leading-tight">
              Voyage <span className="italic font-light text-[#E4A853]">Galactic Gallery</span>
            </h2>

            <p className="text-slate-300 text-base md:text-lg font-light font-sans tracking-wide leading-relaxed">
              Explore NASA's deep-space archives in grid view, search celestial phenomena, and discover historical imagery.
            </p>

            {/* Quick Stats Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-md border border-white/5">
                <Sparkles size={12} className="text-[#E4A853]" />
                <span>30+ Curated Coordinates</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-md border border-white/5">
                <Compass size={12} className="text-[#E4A853]" />
                <span>1995–Present Index</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-md border border-white/5">
                <Layers size={12} className="text-[#E4A853]" />
                <span>2x2 & 4-Col Grid Modes</span>
              </div>
            </div>
          </div>

          {/* Premium Feed Mode & Layout Toggle Dock inside Hero */}
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center gap-3 self-start lg:self-center relative z-10 shrink-0">
            {/* Grid Layout Switcher */}
            <div className="flex items-center gap-1 bg-[#050608] border border-white/10 p-1.5 rounded-full shadow-inner">
              <button
                onClick={() => setGridColumns('grid2x2')}
                title="2x2 Grid View"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  gridColumns === 'grid2x2'
                    ? 'bg-[#E4A853]/25 text-[#E4A853] border border-[#E4A853]/40 shadow-[0_0_12px_rgba(228,168,83,0.2)]'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Grid size={13} />
                <span>2x2 Grid</span>
              </button>
              <button
                onClick={() => setGridColumns('grid4x4')}
                title="Compact Grid View (4 Columns)"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  gridColumns === 'grid4x4'
                    ? 'bg-[#E4A853]/25 text-[#E4A853] border border-[#E4A853]/40 shadow-[0_0_12px_rgba(228,168,83,0.2)]'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Eye size={13} />
                <span>4 Col</span>
              </button>
            </div>

            {/* Array Feed Mode Switcher */}
            <div className="flex items-center gap-1.5 bg-[#050608] border border-white/10 p-1.5 rounded-full shadow-lg">
              <button
                onClick={() => setFeedMode('recent')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer active:scale-95 select-none ${
                  feedMode === 'recent' 
                    ? 'bg-[#E4A853] text-[#050608] shadow-[0_4px_15px_rgba(228,168,83,0.35)]' 
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
                    ? 'bg-[#E4A853] text-[#050608] shadow-[0_4px_15px_rgba(228,168,83,0.35)]' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shuffle size={11} />
                Random Coordinates
              </button>
            </div>
          </div>
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
        <div className={`grid gap-6 transition-all duration-500 ${
          gridColumns === 'grid2x2' 
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2' 
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        }`}>
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
