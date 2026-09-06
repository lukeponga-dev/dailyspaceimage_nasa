export interface ApodData {
  title: string;
  url: string;
  explanation: string;
  date: string;
  media_type: 'image' | 'video' | string;
  copyright?: string;
  hdurl?: string;
}

export type ViewMode = 'landing' | 'today' | 'discover' | 'favorites';

export interface GalleryFilterOptions {
  searchTerm: string;
  mediaType: 'all' | 'image' | 'video';
  sortBy: 'newest' | 'oldest';
  feedMode: 'recent' | 'random';
}
