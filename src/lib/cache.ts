/**
 * Shared APOD Cache Utilities
 * 
 * - What it does:
 *   Provides cross-tier caching (in-memory Map + browser localStorage fallback)
 *   with an explicit 24-hour TTL.
 */

export const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryStore = new Map<string, CacheEntry<any>>();

export function getFromCache<T>(key: string): T | null {
  const now = Date.now();

  // 1. Check in-memory store
  const memoryEntry = memoryStore.get(key);
  if (memoryEntry && now - memoryEntry.timestamp < CACHE_DURATION_MS) {
    return memoryEntry.data;
  }

  // 2. Check localStorage (if in browser)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(`apod_cache_${key}`);
      if (raw) {
        const parsed: CacheEntry<T> = JSON.parse(raw);
        if (now - parsed.timestamp < CACHE_DURATION_MS) {
          memoryStore.set(key, parsed);
          return parsed.data;
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
  }

  return null;
}

export function saveToCache<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now()
  };

  memoryStore.set(key, entry);

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(`apod_cache_${key}`, JSON.stringify(entry));
    } catch {
      // Ignore quota exceeded errors
    }
  }
}

export function clearCache(): void {
  memoryStore.clear();
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith('apod_cache_')) {
          localStorage.removeItem(k);
        }
      }
    } catch {
      // Ignore
    }
  }
}
