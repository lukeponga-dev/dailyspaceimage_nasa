import React, { useState } from 'react';
import { ApodData } from '../types';
import { Star, Maximize2, Share2, Sparkles, Video, ExternalLink, Check } from 'lucide-react';
import { formatCategoryName } from '../lib/apodClassifier';
import ApodVideoPlayer from './ApodVideoPlayer';

interface FeaturedCardProps {
  data: ApodData;
  isToday: boolean;
  isFavorite: boolean;
  onToggleFavorite: (item: ApodData) => void;
  onOpenModal: () => void;
  onShare?: (item: ApodData) => void;
}

export default function FeaturedCard({
  data,
  isToday,
  isFavorite,
  onToggleFavorite,
  onOpenModal,
  onShare,
}: FeaturedCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const isVideo = data.media_type === 'video';

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(data);
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({
          title: `NASA APOD: ${data.title}`,
          text: data.explanation.slice(0, 140) + '...',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled share
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(data);
  };

  // Derive celestial object name and subtitle
  const objectType = data.category ? formatCategoryName(data.category) : 'Deep Space Phenomenon';
  const subtitle = `${data.title.split(/[:—–-]/)[0]} • ${objectType}`;

  return (
    <article className="featured" id="featured-apod-card">
      {/* Media Viewport */}
      <div 
        className="featured-img-container cursor-pointer"
        onClick={onOpenModal}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onOpenModal();
          }
        }}
        aria-label={`Inspect high-resolution observation: ${data.title}`}
      >
        <div className="nebula-glow" aria-hidden="true" />

        {isVideo ? (
          <div className="w-full h-full relative z-10" onClick={(e) => e.stopPropagation()}>
            <ApodVideoPlayer url={data.url} title={data.title} />
          </div>
        ) : (
          <>
            <img
              src={data.url}
              alt={data.title}
              className={`w-full h-full object-cover relative z-10 transition-opacity duration-700 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center z-0">
                <span className="text-[10px] font-mono tracking-widest text-accent uppercase animate-pulse">
                  Acquiring Telemetry...
                </span>
              </div>
            )}
          </>
        )}

        {/* Badge in top left */}
        <span className="featured-badge" aria-label={isToday ? "Today's APOD observation" : `Observation ${data.date}`}>
          {isVideo ? <Video size={10} aria-hidden="true" /> : <Sparkles size={10} aria-hidden="true" />}
          {isToday ? "Today's Image" : `Observation • ${data.date}`}
        </span>

        {/* Action icons in top right */}
        <div className="featured-actions-overlay" onClick={(e) => e.stopPropagation()}>
          {/* Favorite Button */}
          <button
            type="button"
            className="featured-action-btn"
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? "Remove from vault" : "Save to vault"}
            title={isFavorite ? "Saved in vault" : "Save to vault"}
          >
            <Star
              size={15}
              className={isFavorite ? "text-accent fill-accent" : "currentColor"}
              aria-hidden="true"
            />
          </button>

          {/* Share Button */}
          <button
            type="button"
            className="featured-action-btn"
            onClick={handleShareClick}
            aria-label="Share observation"
            title="Share observation"
          >
            {copied ? <Check size={14} className="text-teal" /> : <Share2 size={14} aria-hidden="true" />}
          </button>

          {/* Fullscreen / Inspect Button */}
          <button
            type="button"
            className="featured-action-btn"
            onClick={onOpenModal}
            aria-label="Expand observation to full screen"
            title="Fullscreen inspection"
          >
            <Maximize2 size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="featured-body">
        <h2 className="featured-title">{data.title}</h2>
        <p className="featured-sub">{subtitle}</p>

        <div className="relative">
          <p className={`featured-desc ${isExpanded ? '' : 'line-clamp-3'}`}>
            {data.explanation}
          </p>
          {data.explanation.length > 220 && (
            <button
              type="button"
              className="mt-2 text-[11px] font-mono text-accent hover:underline uppercase tracking-wider cursor-pointer bg-transparent border-0 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse ▲' : 'Read Full Transmission ▼'}
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="featured-footer">
        <div className="flex items-center gap-2">
          <span className="featured-tag">{objectType}</span>
          {data.copyright && (
            <span className="text-[10px] font-mono text-text-dim truncate max-w-[140px] sm:max-w-[240px]" title={data.copyright}>
              © {data.copyright.trim()}
            </span>
          )}
        </div>

        <button
          type="button"
          className="featured-action"
          onClick={onOpenModal}
          aria-label="Open detailed telemetry and high resolution view"
        >
          <span>Explore</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </article>
  );
}
