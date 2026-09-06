export interface FormattedDistance {
  ly: number | null;
  au: number | null;
  km: number | null;
}

export interface ApodTelemetry {
  category: string;
  confidence: number;
  matchedKeywords: string[];
  distanceLightYears: number | null;
  distance: FormattedDistance;
}

export interface ApodData {
  title: string;
  url: string;
  explanation: string;
  date: string;
  media_type: 'image' | 'video' | string;
  copyright?: string;
  hdurl?: string;
  category?: string;
  confidence?: number;
  matchedKeywords?: string[];
  distanceLightYears?: number | null;
  distance?: FormattedDistance;
}

export type ViewMode = 'landing' | 'today' | 'discover' | 'favorites';

export interface GalleryFilterOptions {
  searchTerm: string;
  mediaType: 'all' | 'image' | 'video';
  sortBy: 'newest' | 'oldest';
  feedMode: 'recent' | 'random';
}
