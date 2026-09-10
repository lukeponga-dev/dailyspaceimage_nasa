import React, { useState, useEffect } from 'react';
import { ExternalLink, Play, AlertCircle, Video } from 'lucide-react';

interface ApodVideoPlayerProps {
  url: string;
  title: string;
  className?: string;
  autoPlay?: boolean;
}

/**
 * Checks whether a given URL points directly to a video media file
 * rather than a third-party embedded web player.
 */
export function isDirectVideoUrl(url?: string): boolean {
  if (!url) return false;
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
  return (
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.endsWith('.ogg') ||
    cleanUrl.endsWith('.mov') ||
    cleanUrl.endsWith('.m4v')
  );
}

/**
 * Normalizes video URLs (YouTube, Vimeo) into secure, privacy-respecting embed URLs.
 * Sets strict-origin and origin parameters to prevent cross-origin Location access errors.
 */
export function formatVideoEmbedUrl(url?: string): string {
  if (!url) return '';
  
  // YouTube format handling
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = '';
    if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1]?.split('&')[0] || '';
    } else if (url.includes('embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    }
    
    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&autoplay=0&enablejsapi=0`;
    }
  }

  // Vimeo format handling
  if (url.includes('vimeo.com') && !url.includes('player.vimeo.com')) {
    const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0];
    if (vimeoId) {
      return `https://player.vimeo.com/video/${vimeoId}?dnt=1`;
    }
  }

  return url;
}

export default function ApodVideoPlayer({
  url,
  title,
  className = 'w-full h-full rounded-xl',
  autoPlay = false,
}: ApodVideoPlayerProps) {
  const [loadError, setLoadError] = useState(false);
  const isDirect = isDirectVideoUrl(url);
  const embedUrl = formatVideoEmbedUrl(url);

  // Suppress harmless cross-origin frame access warnings from third-party iframes
  useEffect(() => {
    const handleSecurityErrors = (event: ErrorEvent) => {
      if (
        event.message?.includes('cross-origin frame') ||
        event.message?.includes('Failed to read a named property') ||
        event.message?.includes("'origin' from 'Location'")
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleSecurityErrors);
    return () => window.removeEventListener('error', handleSecurityErrors);
  }, []);

  if (!url) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-surface-raised text-text-dim p-6 text-center rounded-xl">
        <AlertCircle className="text-accent mb-2" size={24} />
        <p className="text-xs font-mono uppercase tracking-widest text-text-mid">
          No Video Stream Available
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-surface-raised text-text-mid p-6 text-center rounded-xl border border-border space-y-3">
        <div className="w-12 h-12 rounded-full bg-accent-dim flex items-center justify-center text-accent">
          <Play size={24} />
        </div>
        <p className="text-sm font-serif italic text-text">
          NASA Video Transmission
        </p>
        <p className="text-xs text-text-mid max-w-md">
          This celestial observation stream can be launched in an external high-definition viewport.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="date-btn active py-2 px-4 inline-flex items-center gap-2 text-xs"
        >
          <ExternalLink size={13} />
          <span>Launch Video Stream</span>
        </a>
      </div>
    );
  }

  // Direct MP4 / WebM video files: Native HTML5 video tag completely bypasses X-Frame-Options
  if (isDirect) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-black/95 overflow-hidden rounded-xl">
        <video
          src={url}
          title={title}
          controls
          playsInline
          autoPlay={autoPlay}
          preload="metadata"
          className={`${className} max-h-full object-contain`}
          onError={() => setLoadError(true)}
        >
          Your browser does not support HTML5 video playback.
        </video>
      </div>
    );
  }

  // Embedded third-party players (YouTube, Vimeo):
  // Using strict-origin-when-cross-origin to guarantee legitimate referrer origin header
  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-black">
      <iframe
        src={embedUrl}
        title={title}
        className={`${className} border-0 w-full h-full`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        onError={() => setLoadError(true)}
      />
    </div>
  );
}
