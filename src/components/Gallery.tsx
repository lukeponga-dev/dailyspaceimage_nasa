import React, { useState, useEffect, useCallback } from 'react';
import { Search, Shuffle, Calendar, Star, Maximize2, Video, ArrowUpDown, AlertCircle, RefreshCw } from 'lucide-react';
import { ApodData } from '../types';
import { fetchApodRange, fetchRandomApods } from '../lib/fetchApod';
import { getCuratedFallbackApods } from '../lib/fallbackApodData';
import { getEasternDate, addDays } from '../utils/dateUtils';
import { formatCategoryName } from '../lib/apodClassifier';
import ApodModal from './ApodModal';
import { GalleryGridSkeleton } from './Skeleton';

interface GalleryProps {
  favorites: ApodData[];
  onToggleFavorite: (item: ApodData) => void;
  isFavorite: (date: string) => boolean;
  onSelectImage: (date: string) => void;
}

export default function Gallery({
  favorites,
  onToggleFavorite,
  isFavorite,
  onSelectImage,
}: GalleryProps) {
  const [items, setItems] = useState<ApodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedMode, setFeedMode] = useState<'recent' | 'random'>('recent');
  const [searchTerm, setSearchTerm] = useState('');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  // Fullscreen inspect modal state
  const [activeModalItem, setActiveModalItem] = useState<ApodData | null>(null);

  const loadGallery = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (feedMode === 'recent') {
        const today = getEasternDate();
        const start = addDays(today, -20);
        const data = await fetchApodRange(start, today);
        setItems(data.length > 0 ? data : getCuratedFallbackApods());
      } else {
        const data = await fetchRandomApods(20);
        setItems(data.length > 0 ? data : getCuratedFallbackApods());
      }
    } catch (err: any) {
      console.warn('Live gallery sync fallback engaged:', err);
      const fallbacks = getCuratedFallbackApods();
      setItems(fallbacks);
    } finally {
      setLoading(false);
    }
  }, [feedMode]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const filteredItems = items
    .filter((item) => {
      const query = searchTerm.toLowerCase();
      const matchesText =
        item.title.toLowerCase().includes(query) ||
        item.explanation.toLowerCase().includes(query) ||
        (item.category && item.category.toLowerCase().includes(query));
      const matchesMedia = mediaFilter === 'all' || item.media_type === mediaFilter;
      return matchesText && matchesMedia;
    })
    .sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

  return (
    <div id="gallery-container-root" className="w-full space-y-6 text-left pb-16">
      {/* Control Console */}
      <section 
        id="gallery-control-deck"
        aria-label="Gallery Controls"
        className="scan-card"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono text-accent uppercase tracking-[0.2em]">
              Deep Space Catalog
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif italic text-text mt-0.5">
              Exploration Stream
            </h2>
            <p className="text-xs text-text-mid max-w-xl leading-relaxed mt-1">
              Browse astronomical recordings from NASA's deep space observatories. Select any card to jump to its live telemetry.
            </p>
          </div>

          {/* Mode Toggles: Recent 30 Days vs Random 24 */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              id="gallery-feed-mode-recent-btn"
              type="button"
              onClick={() => setFeedMode('recent')}
              aria-pressed={feedMode === 'recent'}
              className={`date-btn ${feedMode === 'recent' ? 'active' : ''}`}
            >
              <Calendar size={12} aria-hidden="true" />
              <span>Recent 30</span>
            </button>
            <button
              id="gallery-feed-mode-random-btn"
              type="button"
              onClick={() => setFeedMode('random')}
              aria-pressed={feedMode === 'random'}
              className={`date-btn ${feedMode === 'random' ? 'active' : ''}`}
            >
              <Shuffle size={12} aria-hidden="true" />
              <span>Shuffle</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={14} aria-hidden="true" />
            <input
              id="gallery-search-input"
              type="text"
              placeholder="Search by object, nebula, galaxy, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-raised border border-border text-xs text-text font-mono placeholder:text-text-dim focus:outline-none focus:border-border-accent transition-colors"
            />
          </div>

          {/* Media Type Filter */}
          <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-lg border border-border">
            {(['all', 'image', 'video'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMediaFilter(mode)}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded transition-colors ${
                  mediaFilter === mode
                    ? 'bg-accent text-black font-bold'
                    : 'text-text-mid hover:text-text'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Sort Toggle */}
          <button
            id="gallery-sort-toggle-btn"
            type="button"
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="date-btn"
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            <span>{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
          </button>
        </div>
      </section>

      {/* Loading Skeleton */}
      {loading && (
        <GalleryGridSkeleton count={9} />
      )}

      {/* Error Fallback */}
      {error && !loading && (
        <div className="p-8 scan-card text-center space-y-4 max-w-lg mx-auto">
          <AlertCircle size={28} className="text-accent mx-auto" aria-hidden="true" />
          <h3 className="text-base font-semibold text-text">Archival Link Interrupted</h3>
          <p className="text-xs text-text-mid">{error}</p>
          <button type="button" onClick={loadGallery} className="date-btn mx-auto">
            <RefreshCw size={12} aria-hidden="true" />
            <span>Re-establish Uplink</span>
          </button>
        </div>
      )}

      {/* Grid of APOD Cards */}
      {!loading && !error && filteredItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isFav = isFavorite(item.date);
            const isVideo = item.media_type === 'video';
            const catName = item.category ? formatCategoryName(item.category) : 'Deep Space';

            return (
              <article
                key={item.date}
                className="featured group hover:-translate-y-1 transition-all"
              >
                {/* Media Preview Box */}
                <div
                  className="w-full aspect-video relative overflow-hidden bg-surface-raised cursor-pointer"
                  onClick={() => onSelectImage(item.date)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelectImage(item.date);
                    }
                  }}
                  aria-label={`View ${item.title}`}
                >
                  {isVideo ? (
                    <div className="w-full h-full flex items-center justify-center bg-black/60">
                      <div className="p-3 rounded-full bg-accent/20 text-accent border border-border-accent">
                        <Video size={18} aria-hidden="true" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}

                  {/* Top Bar on Card */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                    <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-accent border border-border">
                      {item.date}
                    </span>

                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-black/70 backdrop-blur-md border border-border flex items-center justify-center text-text-mid hover:text-accent transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item);
                      }}
                      aria-label={isFav ? "Remove favorite" : "Save favorite"}
                    >
                      <Star size={13} className={isFav ? "text-accent fill-accent" : "currentColor"} />
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-teal bg-teal-dim px-1.5 py-0.5 rounded">
                      {catName}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveModalItem(item);
                      }}
                      className="text-text-dim hover:text-accent transition-colors"
                      title="Inspect full screen"
                      aria-label="Inspect full screen"
                    >
                      <Maximize2 size={13} aria-hidden="true" />
                    </button>
                  </div>

                  <h3
                    className="text-sm font-semibold text-text line-clamp-1 cursor-pointer hover:text-accent transition-colors"
                    onClick={() => onSelectImage(item.date)}
                  >
                    {item.title}
                  </h3>

                  <p className="text-[11px] text-text-mid line-clamp-2 leading-relaxed">
                    {item.explanation}
                  </p>

                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onSelectImage(item.date)}
                      className="text-[10px] font-mono uppercase tracking-wider text-accent hover:underline bg-transparent border-0 p-0 cursor-pointer"
                    >
                      Load Telemetry →
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModalItem(item)}
                      className="text-[10px] font-mono uppercase tracking-wider text-text-dim hover:text-text bg-transparent border-0 p-0 cursor-pointer"
                    >
                      Inspect HD
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Fullscreen Inspection Modal */}
      {activeModalItem && (
        <ApodModal
          item={activeModalItem}
          onClose={() => setActiveModalItem(null)}
          isFavorite={isFavorite(activeModalItem.date)}
          onToggleFavorite={onToggleFavorite}
          onJumpToDate={(d) => {
            setActiveModalItem(null);
            onSelectImage(d);
          }}
        />
      )}
    </div>
  );
}
