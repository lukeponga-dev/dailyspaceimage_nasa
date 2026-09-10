/**
 * ApodImage Component
 * 
 * - What the component does:
 *   Renders NASA APOD imagery with responsive layout, progressive stream loading,
 *   and direct one-click triggering into the full-screen `ImageExpansionOverlay` for
 *   deep astrophotography inspection (zoom, pan, spectral filters, mini-map, HD toggle).
 * 
 * - Why it exists:
 *   Provides a self-contained image viewer that can seamlessly trigger deep detail inspection.
 * 
 * - How it fits into the NASA APOD workflow:
 *   Used whenever APOD images are rendered with expandable capabilities.
 */

import React, { useState } from 'react';
import { ApodData } from '../types';
import ImageExpansionOverlay from './ImageExpansionOverlay';
import ImagePreloader from './ImagePreloader';
import ApodVideoPlayer from './ApodVideoPlayer';

interface ApodImageProps {
  data: ApodData;
  onOpenHdModal?: () => void;
  className?: string;
  allowSelfOverlay?: boolean;
}

export default function ApodImage({
  data,
  onOpenHdModal,
  className = '',
  allowSelfOverlay = true
}: ApodImageProps) {
  const [internalOverlayOpen, setInternalOverlayOpen] = useState(false);
  const isVideo = data.media_type === 'video';

  const handleOpenExpansion = () => {
    if (onOpenHdModal) {
      onOpenHdModal();
    } else if (allowSelfOverlay) {
      setInternalOverlayOpen(true);
    }
  };

  return (
    <>
      <div
        id={`apod-image-stage-${data.date}`}
        className={`relative w-full rounded-2xl overflow-hidden bg-[#070611] border border-[#2C2655] shadow-2xl group ${className}`}
      >
        {isVideo ? (
          <div className="relative aspect-video w-full">
            <ApodVideoPlayer
              url={data.url}
              title={data.title}
              className="w-full h-full rounded-2xl border-0"
            />
          </div>
        ) : (
          <ImagePreloader
            src={data.url}
            hdUrl={data.hdurl}
            date={data.date}
            title={data.title}
            alt={data.title}
            onOpenModal={handleOpenExpansion}
            showQualityToggle={Boolean(data.hdurl)}
            loadingLabel="Buffering celestial imagery..."
            minHeight="min-h-[340px] sm:min-h-[460px] md:min-h-[540px]"
          />
        )}
      </div>

      {/* Self-contained Expansion Overlay */}
      {allowSelfOverlay && !onOpenHdModal && (
        <ImageExpansionOverlay
          item={data}
          isOpen={internalOverlayOpen}
          onClose={() => setInternalOverlayOpen(false)}
        />
      )}
    </>
  );
}
