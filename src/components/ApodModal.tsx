/**
 * ApodModal Component
 * 
 * - What the component does:
 *   Wraps and renders the high-definition, immersive ImageExpansionOverlay for NASA Astronomy Picture of the Day.
 *   Provides deep detail inspection with multi-scale zoom (50% to 500%), click-and-drag pan, mouse wheel zoom,
 *   double-click magnification, astrometric spectral filters (HDR Contrast, Negative, Nebula Boost, Monochrome),
 *   mini-map radar navigation, collapsible telemetry intel drawer, and full keyboard hotkey support.
 * 
 * - Why it exists:
 *   Maintains backward compatibility across the component tree while delivering a full-screen image expansion experience.
 * 
 * - How it fits into the NASA APOD workflow:
 *   Triggered whenever users click an observation in `NasaApod.tsx`, `ApodHero.tsx`, `Gallery.tsx`, or `Favorites.tsx`.
 */

import React from 'react';
import { ApodData } from '../types';
import ImageExpansionOverlay from './ImageExpansionOverlay';

interface ApodModalProps {
  item: ApodData | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectDate?: (date: string) => void;
}

export default function ApodModal({ item, isOpen, onClose, onSelectDate }: ApodModalProps) {
  return (
    <ImageExpansionOverlay
      item={item}
      isOpen={isOpen}
      onClose={onClose}
      onSelectDate={onSelectDate}
    />
  );
}


