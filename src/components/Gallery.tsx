/**
 * Gallery Component
 * 
 * - What the component does:
 *   Renders a high-performance, responsive archival grid displaying NASA Astronomy Picture of the Day entries.
 *   Provides dual querying modes (chronological recent 30-day stream vs. non-deterministic 24-item random shuffle),
 *   instant client-side keyword search, media type filtering (Images vs. Videos), date sorting (Newest vs. Oldest),
 *   and individual card inspection triggering the fullscreen HD modal or loading into the primary array view.
 * 
 * - Why the design change improves UX:
 *   1. Eliminates Cumulative Layout Shift (CLS) using standardized `aspect-video` or `h-48` media frames.
 *   2. Implements native lazy loading (`loading="lazy"`) and asynchronous decoding (`decoding="async"`) to conserve bandwidth.
 *   3. Offers instant feedback with accessible skeleton loaders and smooth card hover transitions.
 *   4. Adheres to WAI-ARIA standards with semantic article tags, descriptive labels, and keyboard-interactive controls.
 * 
 * - How the styling works:
 *   Tailwind CSS grid layouts (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`) paired with
 *   dark obsidian surfaces (`bg-[#0C0E12]/90`), gold hover accents (`hover:border-[#E4A853]/40`),
 *   subtle drop shadows (`hover:shadow-[0_12px_30px_rgba(0,0,0,0.65)]`), and truncated body copy (`line-clamp-2`).
 * 
 * - How it fits into the NASA APOD workflow:
 *   Fetches multi-item payloads via `fetchApodRange` or `fetchRandomApods` from `/src/lib/fetchApod.ts`,
 *   bridging the gap between the single daily hero view and the vast historical 1995-to-present NASA archives.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Shuffle, Calendar, Star, Maximize2, Video, ArrowUpDown, AlertCircle, RefreshCw, Compass } from 'lucide-react';
import { ApodData } from '../types';
import { fetchApodRange, fetchRandomApods } from '../lib/fetchApod';
import { getEasternDate, addDays, formatDate } from '../utils/dateUtils';
import { formatCategoryName } from '../lib/apodClassifier';
import { GalleryGridSkeleton } from './Skeleton';
import ApodModal from './ApodModal';

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

  /**
   * Fetches the archival feed according to the selected mode (recent 30 days vs random shuffle).
   * - What it does: Calls the appropriate API endpoint wrapped in error boundary logic.
   * - Why it exists: Dynamically hydrates the grid without triggering page reloads.
   * - How it fits into the workflow: Re-invoked when the user toggles between recent dates and random archives.
   */
  const loadGallery = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (feedMode === 'recent') {
        const today = getEasternDate();
        const start = addDays(today, -30);
        const data = await fetchApodRange(start, today);
        setItems(data);
      } else {
        const data = await fetchRandomApods(24);
        setItems(data);
      }
    } catch (err: any) {
      console.error('Gallery loading failed:', err);
      setError(err.message || 'Failed to establish deep space telemetry link.');
    } finally {
      setLoading(false);
    }
  }, [feedMode]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  // Client-side filtering and sorting for instant response times
  const filteredItems = items
    .filter((item) => {
      const query = searchTerm.toLowerCase();
      const matchesText = item.title.toLowerCase().includes(query) || item.explanation.toLowerCase().includes(query);
      const matchesMedia = mediaFilter === 'all' || item.media_type === mediaFilter;
      return matchesText && matchesMedia;
    })
    .sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

  return (
    <div id="gallery-container-root" className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in pb-16 text-left">
      {/* Header Banner & Controls Console */}
      <section 
        id="gallery-control-deck"
        aria-label="Gallery Controls"
        className="relative rounded-2xl border border-[#E4A853]/25 bg-[#0C0E12]/90 backdrop-blur-xl p-6 sm:p-8 shadow-xl overflow-hidden"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-[#E4A853] uppercase tracking-widest font-bold">
              NASA Deep-Space Telemetry
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Galactic Gallery Feed
            </h2>
            <p className="text-xs sm:text-sm font-sans font-light text-slate-300 max-w-xl leading-relaxed">
              Explore recent astronomical archives or shuffle through decades of telescope recordings. Select any observation to inspect high-definition telemetry.
            </p>
          </div>

          {/* Mode Toggles: Recent 30 Days vs Random 24 */}
          <div className="flex items-center gap-2 bg-[#050608] p-1.5 rounded-xl border border-white/10 self-start md:self-auto">
            <button
              id="gallery-feed-mode-recent-btn"
              type="button"
              onClick={() => setFeedMode('recent')}
              aria-pressed={feedMode === 'recent'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                feedMode === 'recent'
                  ? 'bg-[#E4A853] text-[#050608] font-bold shadow-[0_0_15px_rgba(228,168,83,0.3)]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Calendar size={13} aria-hidden="true" />
              <span>Recent 30 Days</span>
            </button>
            <button
              id="gallery-feed-mode-random-btn"
              type="button"
              onClick={() => setFeedMode('random')}
              aria-pressed={feedMode === 'random'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                feedMode === 'random'
                  ? 'bg-[#E4A853] text-[#050608] font-bold shadow-[0_0_15px_rgba(228,168,83,0.3)]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Shuffle size={13} aria-hidden="true" />
              <span>Shuffle 24</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
          {/* Accessible search input */}
          <div className="relative flex-1 min-w-[240px]">
            <label htmlFor="gallery-search-input" className="sr-only">
              Search cosmic titles and descriptions
            </label>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="gallery-search-input"
              type="search"
              placeholder="Search nebula, rover, galaxy, solar eclipse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#050608] border border-white/10 focus:border-[#E4A853] focus:ring-1 focus:ring-[#E4A853]/20 text-xs font-sans text-slate-200 rounded-lg outline-none transition-colors"
            />
          </div>

          {/* Media Filter Pills */}
          <div className="flex items-center gap-2">
            <div 
              role="group"
              aria-label="Filter by media type"
              className="flex items-center bg-[#050608] p-1 rounded-lg border border-white/10 text-xs font-mono text-slate-400"
            >
              <button
                type="button"
                onClick={() => setMediaFilter('all')}
                aria-pressed={mediaFilter === 'all'}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  mediaFilter === 'all' ? 'bg-white/10 text-[#E4A853]' : 'hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setMediaFilter('image')}
                aria-pressed={mediaFilter === 'image'}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  mediaFilter === 'image' ? 'bg-white/10 text-[#E4A853]' : 'hover:text-white'
                }`}
              >
                Images
              </button>
              <button
                type="button"
                onClick={() => setMediaFilter('video')}
                aria-pressed={mediaFilter === 'video'}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  mediaFilter === 'video' ? 'bg-white/10 text-[#E4A853]' : 'hover:text-white'
                }`}
              >
                Videos
              </button>
            </div>

            {/* Sort Toggle */}
            <button
              id="gallery-sort-order-btn"
              type="button"
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              className="flex items-center gap-1 px-3 py-2 bg-[#050608] border border-white/10 text-slate-300 hover:text-[#E4A853] rounded-lg text-xs font-mono transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#E4A853]"
              title={`Sorted by ${sortOrder}. Click to toggle.`}
              aria-label={`Sort by date: currently ${sortOrder}`}
            >
              <ArrowUpDown size={13} aria-hidden="true" />
              <span className="hidden sm:inline">{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Perceived Performance: Skeleton Grid during fetch */}
      {loading && <GalleryGridSkeleton count={8} />}

      {/* Error state with retry dispatch */}
      {!loading && error && (
        <div 
          role="alert" 
          className="p-8 rounded-2xl border border-red-500/30 bg-red-950/20 text-center space-y-4 max-w-xl mx-auto shadow-xl"
        >
          <AlertCircle className="mx-auto text-red-400" size={32} aria-hidden="true" />
          <h3 className="text-lg font-serif text-red-200">Cosmic Link Failure</h3>
          <p className="text-xs font-sans text-red-300/80">{error}</p>
          <button
            type="button"
            onClick={loadGallery}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#E4A853] text-[#050608] rounded-lg text-xs font-mono font-bold cursor-pointer hover:bg-[#f3be73] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E4A853]"
          >
            <RefreshCw size={13} aria-hidden="true" />
            <span>Retry Transmission</span>
          </button>
        </div>
      )}

      {/* Empty Search Results Feedback */}
      {!loading && !error && filteredItems.length === 0 && (
        <div className="p-12 text-center rounded-2xl border border-white/5 bg-[#0C0E12] space-y-3">
          <Search className="mx-auto text-slate-500" size={32} aria-hidden="true" />
          <h4 className="text-base font-serif text-slate-300">No Astronomical Telemetry Found</h4>
          <p className="text-xs font-mono text-slate-500">
            No archives match your current search and filter parameters.
          </p>
        </div>
      )}

      {/* Responsive Gallery Grid */}
      {!loading && !error && filteredItems.length > 0 && (
        <section 
          id="gallery-grid"
          aria-label="Astronomical observation cards"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredItems.map((item) => {
            const isFav = isFavorite(item.date);
            const isVideo = item.media_type === 'video';

            return (
              <article
                key={item.date}
                className="group relative rounded-xl border border-white/10 bg-[#0C0E12]/90 hover:border-[#E4A853]/40 transition-all duration-300 overflow-hidden flex flex-col shadow-lg hover:-translate-y-1"
              >
                {/* Media thumbnail container with lazy loading */}
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveModalItem(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveModalItem(item);
                    }
                  }}
                  aria-label={`Open high-definition viewer for ${item.title}`}
                  className="relative h-48 w-full bg-black/60 overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E4A853]"
                >
                  {isVideo ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-4 text-center">
                      <Video size={28} className="text-[#E4A853] mb-1 animate-pulse" aria-hidden="true" />
                      <span className="text-[10px] font-mono text-slate-300">Video Telemetry</span>
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}

                  {/* Observation Date Stamp & Category Badge */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 items-start pointer-events-none">
                    <time 
                      dateTime={item.date}
                      className="px-2 py-0.5 rounded bg-black/75 border border-white/10 text-[#E4A853] text-[10px] font-mono font-semibold"
                    >
                      {formatDate(item.date)}
                    </time>
                    {item.category && (
                      <span className="px-1.5 py-0.5 rounded bg-black/80 border border-[#E4A853]/30 text-[#FFD700] text-[9px] font-mono uppercase tracking-wider">
                        {formatCategoryName(item.category)}
                      </span>
                    )}
                  </div>

                  {/* Favorite Toggle Action */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item);
                    }}
                    aria-label={isFav ? `Remove ${item.title} from favorites` : `Add ${item.title} to favorites`}
                    className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-md transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#E4A853] ${
                      isFav
                        ? 'bg-[#E4A853] text-[#050608]'
                        : 'bg-black/60 text-slate-300 hover:text-white border border-white/10'
                    }`}
                  >
                    <Star size={13} className={isFav ? 'fill-[#050608]' : ''} aria-hidden="true" />
                  </button>

                  {/* Hover Inspect Overlay Indicator */}
                  <div 
                    aria-hidden="true" 
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none"
                  >
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0C0E12]/90 border border-[#E4A853]/40 text-[#E4A853] text-[11px] font-mono">
                      <Maximize2 size={12} />
                      <span>Inspect HD</span>
                    </div>
                  </div>
                </div>

                {/* Card Textual Information */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h3 
                      onClick={() => setActiveModalItem(item)}
                      className="text-sm font-serif font-medium text-slate-100 group-hover:text-[#E4A853] transition-colors line-clamp-1 cursor-pointer"
                      title={item.title}
                    >
                      {item.title}
                    </h3>
                    <p className="text-xs font-sans font-light text-slate-400 line-clamp-2 leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>

                  {/* Action Links */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => onSelectImage(item.date)}
                      className="text-[#E4A853] hover:text-[#ffd99e] transition-colors flex items-center gap-1 cursor-pointer focus:outline-none focus:underline"
                      title="Load this observation in Main Array Viewer"
                    >
                      <Compass size={12} aria-hidden="true" />
                      <span>View in Array</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModalItem(item)}
                      className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer focus:outline-none focus:underline"
                    >
                      Inspect HD
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Accessible HD Fullscreen Viewer Modal */}
      <ApodModal
        item={activeModalItem}
        isOpen={Boolean(activeModalItem)}
        onClose={() => setActiveModalItem(null)}
      />
    </div>
  );
}

