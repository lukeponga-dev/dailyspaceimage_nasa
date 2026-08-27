import { useState, useEffect, useCallback } from 'react';
import { Search, Grid, Eye, Shuffle, Star, ExternalLink, Calendar, Heart, Video, Image, ArrowUpDown, X, Download } from 'lucide-react';

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

export default function Discover({ favorites, onToggleFavorite, isFavorite, onSelectImage }: DiscoverProps) {
  const [gallery, setGallery] = useState<ApodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [feedMode, setFeedMode] = useState<'recent' | 'random'>('recent');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  
  // Modal State
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
        // Fetch 24 random items for grid layout
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
      
      // APOD returns an array for start_date/end_date and count
      let items: ApodData[] = Array.isArray(data) ? data : [data];
      
      // Filter null or duplicate dates if any
      items = items.filter((item, index, self) => 
        item && item.date && self.findIndex(t => t.date === item.date) === index
      );

      // Default sorting: Newest first
      if (feedMode === 'recent') {
        setGallery(items.reverse());
      } else {
        setGallery(items);
      }
    } catch (err: any) {
      const errMsg = err.message || 'Failed to connect to NASA servers';
      const isDateLimitError = feedMode === 'recent' && (
        errMsg.toLowerCase().includes('date must be') || 
        errMsg.toLowerCase().includes('future') || 
        errMsg.toLowerCase().includes('400') || 
        errMsg.toLowerCase().includes('bad request')
      );
      
      // If we are querying recent items and encounter a future date error, try parsing max allowed date and fall back!
      if (isDateLimitError) {
        let maxDateStr = parseMaxDateFromMessage(errMsg);
        
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        // If no max date was parsed, use yesterday as end date
        if (!maxDateStr) {
          const dateObj = new Date();
          dateObj.setDate(dateObj.getDate() - 1);
          maxDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        } else if (maxDateStr === todayStr) {
          // If the parsed max date is equal to today's date (which failed), use yesterday instead
          const dateObj = new Date(maxDateStr + 'T00:00:00');
          dateObj.setDate(dateObj.getDate() - 1);
          maxDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        }

        if (maxDateStr) {
          console.warn('Discover gallery date limit reached. Self-correcting range to end on:', maxDateStr);
          const maxDateObj = new Date(maxDateStr + 'T00:00:00');
          const startDateObj = new Date(maxDateObj);
          startDateObj.setDate(startDateObj.getDate() - 30);
          const startDate = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-${String(startDateObj.getDate()).padStart(2, '0')}`;
          const adjustedUrl = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&start_date=${startDate}&end_date=${maxDateStr}`;
          
          try {
            const retryRes = await fetch(adjustedUrl);
            if (retryRes.ok) {
              const retryData = await retryRes.json();
              let items: ApodData[] = Array.isArray(retryData) ? retryData : [retryData];
              items = items.filter((item, index, self) => 
                item && item.date && self.findIndex(t => t.date === item.date) === index
              );
              setGallery(items.reverse());
              setLoading(false);
              return;
            }
          } catch (retryErr) {
            console.warn('Adjusted gallery fetch retry failed:', retryErr);
          }
        } else {
          // Simple fallback: subtract 1 day from end date and try again
          const dateObj = new Date();
          dateObj.setDate(dateObj.getDate() - 1);
          const endDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
          const startDateObj = new Date(dateObj);
          startDateObj.setDate(startDateObj.getDate() - 30);
          const startDate = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-${String(startDateObj.getDate()).padStart(2, '0')}`;
          const adjustedUrl = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&start_date=${startDate}&end_date=${endDate}`;
          
          try {
            const retryRes = await fetch(adjustedUrl);
            if (retryRes.ok) {
              const retryData = await retryRes.json();
              let items: ApodData[] = Array.isArray(retryData) ? retryData : [retryData];
              items = items.filter((item, index, self) => 
                item && item.date && self.findIndex(t => t.date === item.date) === index
              );
              setGallery(items.reverse());
              setLoading(false);
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

  // Handle image clicks in grid
  const handleItemClick = (item: ApodData) => {
    setSelectedItem(item);
  };

  // Close modal
  const closeModal = () => {
    setSelectedItem(null);
  };

  // Filter & sort list
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
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl md:text-5xl font-serif font-light tracking-tight text-slate-100 leading-none">
            Explore <span className="italic font-normal text-stellar-400">Deep Space</span>
          </h2>
          <p className="text-slate-400 mt-2 text-sm md:text-base font-light">
            Browse NASA's extensive cosmic library, search celestial phenomena, and discover historical archives.
          </p>
        </div>

        {/* Feed Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-space-900 border border-space-800 p-1 rounded-lg self-start md:self-auto shadow-inner">
          <button
            onClick={() => setFeedMode('recent')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${feedMode === 'recent' ? 'bg-stellar-500 text-space-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Calendar size={13} />
            Recent 30 Days
          </button>
          <button
            onClick={() => setFeedMode('random')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${feedMode === 'random' ? 'bg-stellar-500 text-space-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Shuffle size={13} />
            Random Archive
          </button>
        </div>
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-space-900 p-4 border border-space-800 rounded-xl">
        {/* Search Input */}
        <div className="relative md:col-span-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search cosmic titles & explanations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-space-950 text-slate-100 pl-10 pr-4 py-2.5 rounded-lg border border-space-800 focus:border-stellar-500/50 focus:outline-none transition-all text-sm"
          />
        </div>

        {/* Media Type Filter */}
        <div className="grid grid-cols-3 md:col-span-4 bg-space-950 p-1 border border-space-800 rounded-lg">
          <button
            onClick={() => setMediaTypeFilter('all')}
            className={`py-1.5 px-1 rounded-md text-xs font-semibold transition cursor-pointer ${mediaTypeFilter === 'all' ? 'bg-space-900 text-stellar-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            All Media
          </button>
          <button
            onClick={() => setMediaTypeFilter('image')}
            className={`py-1.5 px-1 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${mediaTypeFilter === 'image' ? 'bg-space-900 text-stellar-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Image size={12} />
            Images
          </button>
          <button
            onClick={() => setMediaTypeFilter('video')}
            className={`py-1.5 px-1 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${mediaTypeFilter === 'video' ? 'bg-space-900 text-stellar-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Video size={12} />
            Videos
          </button>
        </div>

        {/* Sort By Filter */}
        <div className="relative md:col-span-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
            className="w-full bg-space-950 text-slate-200 py-2.5 pl-4 pr-10 rounded-lg border border-space-800 focus:border-stellar-500/50 focus:outline-none text-xs font-semibold cursor-pointer appearance-none"
          >
            <option value="newest">Newest Date</option>
            <option value="oldest">Oldest Date</option>
          </select>
          <ArrowUpDown size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-space-900 border border-space-800 rounded-xl p-4 space-y-4 animate-pulse">
              <div className="w-full aspect-video bg-space-800 rounded-lg"></div>
              <div className="h-4 bg-space-800 rounded w-2/3"></div>
              <div className="h-3 bg-space-800 rounded w-1/3"></div>
              <div className="h-12 bg-space-800 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : filteredGallery.length === 0 ? (
        <div className="text-center p-16 bg-space-900 border border-space-800 rounded-xl">
          <p className="text-slate-400 text-sm">No cosmic archives match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredGallery.map((item) => {
            const favorited = isFavorite(item.date);
            return (
              <div 
                key={item.date} 
                className="group bg-space-900/60 border border-space-800 hover:border-space-600 rounded-xl overflow-hidden hover:shadow-[0_12px_24px_rgba(0,0,0,0.55)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full cursor-pointer"
                onClick={() => handleItemClick(item)}
              >
                {/* Media frame */}
                <div className="relative aspect-video overflow-hidden bg-space-950">
                  {item.media_type === 'image' ? (
                    <img 
                      src={item.url} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-space-950 text-slate-400 space-y-2">
                      <Video size={24} className="text-slate-600" />
                      <span className="text-[10px] font-mono uppercase tracking-wider">Video archive</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-transparent to-transparent opacity-80"></div>
                  
                  {/* Star rating / Favorite icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item);
                    }}
                    className={`absolute top-3 right-3 p-1.5 bg-space-950/70 backdrop-blur-md rounded-full border transition cursor-pointer ${favorited ? 'border-stellar-500/40 text-stellar-400' : 'border-space-800 text-slate-400 hover:text-stellar-400'}`}
                  >
                    <Star size={13} className={favorited ? "text-stellar-400 fill-stellar-400" : ""} />
                  </button>

                  <span className="absolute bottom-3 left-3 bg-space-950/80 backdrop-blur-sm border border-space-800 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400">
                    {formatDate(item.date)}
                  </span>
                </div>

                {/* Meta details */}
                <div className="p-4 flex flex-col flex-grow space-y-3">
                  <h3 className="font-semibold text-slate-200 text-sm leading-snug group-hover:text-stellar-400 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  
                  {/* Display preview of description / explanation */}
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 flex-grow font-sans font-light">
                    {item.explanation}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-space-800/60 mt-auto">
                    <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                      {item.media_type}
                    </span>
                    <button className="text-[10px] text-stellar-400 group-hover:underline font-medium inline-flex items-center gap-1 cursor-pointer">
                      <Eye size={11} />
                      Read details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Overlay / Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-space-950/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 z-50 animate-fade-in"
          onClick={closeModal}
        >
          <div 
            className="bg-space-900 border border-space-800 p-5 md:p-8 rounded-xl max-w-4xl w-full max-h-[85vh] overflow-y-auto relative shadow-2xl space-y-6" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Dismiss */}
            <div className="flex items-start justify-between gap-4 border-b border-space-800 pb-4">
              <div>
                <h3 className="text-2xl md:text-3xl font-serif font-medium tracking-tight text-slate-100">{selectedItem.title}</h3>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                  <span className="font-mono bg-space-950 px-2 py-0.5 rounded border border-space-800 text-stellar-400">{formatDate(selectedItem.date)}</span>
                  {selectedItem.copyright && (
                    <>
                      <span>•</span>
                      <span className="italic font-sans text-slate-400">Captured by {selectedItem.copyright}</span>
                    </>
                  )}
                </p>
              </div>
              <button 
                onClick={closeModal} 
                className="p-1.5 bg-space-950 hover:bg-space-800 text-slate-400 hover:text-white rounded-full border border-space-800 hover:border-space-600 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Media content */}
            <div className="rounded-lg overflow-hidden bg-space-950 border border-space-800 aspect-video max-h-96 flex items-center justify-center relative">
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

            {/* Rich details: Explanation text */}
            <div className="space-y-4">
              <h4 className="text-[10px] uppercase font-mono font-bold tracking-widest text-stellar-400">Cosmic Narrative</h4>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed bg-space-950/60 p-6 rounded-lg border border-space-800/85 font-sans font-light">
                {selectedItem.explanation}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-space-800">
              <button
                onClick={() => {
                  onSelectImage(selectedItem.date);
                  closeModal();
                }}
                className="inline-flex items-center gap-2 bg-stellar-500 hover:bg-stellar-600 text-space-950 text-xs font-bold px-4 py-2.5 rounded-lg shadow-lg transition cursor-pointer"
              >
                <ExternalLink size={14} />
                Load in Today Single-View
              </button>
              
              <button
                onClick={() => onToggleFavorite(selectedItem)}
                className={`inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg border transition cursor-pointer ${isFavorite(selectedItem.date) ? 'bg-stellar-500/15 border-stellar-500/40 text-stellar-400 hover:bg-stellar-500/25' : 'bg-space-950 border border-space-800 text-slate-300 hover:border-space-600'}`}
              >
                <Heart size={14} className={isFavorite(selectedItem.date) ? "fill-stellar-400 text-stellar-400" : ""} />
                {isFavorite(selectedItem.date) ? 'Favorited' : 'Add to Favorites'}
              </button>

              {selectedItem.media_type === 'image' && (
                <a
                  href={selectedItem.hdurl || selectedItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-space-950 border border-space-800 text-slate-300 hover:border-space-600 text-xs font-bold px-4 py-2.5 rounded-lg transition sm:ml-auto cursor-pointer"
                >
                  <Download size={14} />
                  Full Resolution HD
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
