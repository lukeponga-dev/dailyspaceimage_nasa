import React, { useState } from 'react';
import { Trash2, Star, Maximize2, Sparkles, Compass } from 'lucide-react';
import { ApodData } from '../types';
import ApodModal from './ApodModal';
import { formatCategoryName } from '../lib/apodClassifier';

interface FavoritesProps {
  favorites: ApodData[];
  onRemoveFavorite: (date: string) => void;
  onSelectImage: (date: string) => void;
  onToggleFavorite?: (item: ApodData) => void;
}

export default function Favorites({
  favorites,
  onRemoveFavorite,
  onSelectImage,
  onToggleFavorite,
}: FavoritesProps) {
  const [activeModalItem, setActiveModalItem] = useState<ApodData | null>(null);

  return (
    <section id="favorites-vault-root" aria-label="Saved Cosmic Observations" className="w-full space-y-6 text-left pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif italic text-text">
            Saved Telemetry Vault
          </h2>
          <p className="text-xs text-text-mid font-mono uppercase tracking-wider mt-1">
            CURATED CATALOG OF SAVED DEEP SPACE PHENOMENA
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-lg border border-border self-start sm:self-auto">
          <Star size={13} className="text-accent fill-accent" aria-hidden="true" />
          <span className="text-xs font-mono font-bold text-accent uppercase tracking-widest">
            {favorites.length} RECORDED
          </span>
        </div>
      </div>

      {/* Empty State */}
      {favorites.length === 0 ? (
        <div className="scan-card text-center p-12 space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-surface-hover border border-border-accent flex items-center justify-center text-accent mx-auto">
            <Star size={20} className="text-accent" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-serif italic text-text">Vault is Empty</h3>
          <p className="text-xs text-text-mid leading-relaxed">
            Discover the secrets of the cosmos. Tap the star icon on any transmission to archive it into your personal observation vault.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((item) => {
            const isVideo = item.media_type === 'video';
            const catName = item.category ? formatCategoryName(item.category) : 'Observation';

            return (
              <article
                key={item.date}
                className="featured group"
              >
                {/* Media Preview */}
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
                      <span className="text-[9px] font-mono tracking-wider text-accent uppercase bg-black/70 px-2 py-0.5 rounded">
                        Video
                      </span>
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

                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                    <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-accent border border-border">
                      {item.date}
                    </span>

                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-black/70 backdrop-blur-md border border-border flex items-center justify-center text-text-dim hover:text-red-400 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFavorite(item.date);
                      }}
                      title="Remove from vault"
                      aria-label={`Remove ${item.title} from vault`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-teal bg-teal-dim px-1.5 py-0.5 rounded">
                      {catName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveModalItem(item)}
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

      {/* Inspect Modal */}
      {activeModalItem && (
        <ApodModal
          item={activeModalItem}
          onClose={() => setActiveModalItem(null)}
          isFavorite={true}
          onToggleFavorite={() => {
            onRemoveFavorite(activeModalItem.date);
            setActiveModalItem(null);
          }}
          onJumpToDate={(d) => {
            setActiveModalItem(null);
            onSelectImage(d);
          }}
        />
      )}
    </section>
  );
}
