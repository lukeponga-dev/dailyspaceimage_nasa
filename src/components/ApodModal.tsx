import React from 'react';
import { ApodData } from '../types';
import ImageExpansionOverlay from './ImageExpansionOverlay';

interface ApodModalProps {
  item: ApodData | null;
  isOpen?: boolean;
  onClose: () => void;
  onSelectDate?: (date: string) => void;
  onJumpToDate?: (date: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (item: ApodData) => void;
}

export default function ApodModal({
  item,
  isOpen = true,
  onClose,
  onSelectDate,
  onJumpToDate,
}: ApodModalProps) {
  const handleDate = onSelectDate || onJumpToDate;
  return (
    <ImageExpansionOverlay
      item={item}
      isOpen={Boolean(item) && isOpen}
      onClose={onClose}
      onSelectDate={handleDate}
    />
  );
}
