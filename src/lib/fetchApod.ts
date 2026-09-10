import { ApodData } from '../types';
import { 
  getEasternDate, 
  addDays, 
  isDateUnavailableError, 
  parseMaxDateFromMessage, 
  NASA_EPOCH 
} from '../utils/dateUtils';
import { buildApodTelemetry } from './apodClassifier';
import { getCuratedFallbackApods } from './fallbackApodData';

const NASA_API_KEY = process.env.NASA_API_KEY || "DQyanRGtyfc3NAXvp1c69yTUBiEUt32RISDWcajH";
const BASE_URL = "https://api.nasa.gov/planetary/apod";

// In-memory runtime cache
const memoryCache = new Map<string, ApodData>();

// Local storage cache keys
const LOCAL_STORAGE_KEY_PREFIX = 'nasa_apod_cache_';

/**
 * Retrieves cached APOD telemetry from the tiered cache hierarchy (L1 Memory Map -> L2 Browser Storage).
 */
export function getCachedApod(date: string): ApodData | null {
  if (memoryCache.has(date)) {
    return memoryCache.get(date)!;
  }
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${date}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryCache.set(date, parsed);
      return parsed;
    }
  } catch {
    // Ignore localStorage read errors
  }
  return null;
}

/**
 * Persists an APOD record into both memory and persistent browser storage.
 */
export function setCachedApod(date: string, data: ApodData): void {
  memoryCache.set(date, data);
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${date}`, JSON.stringify(data));
  } catch {
    // Gracefully ignore quota exceed errors
  }
}

/**
 * Dispatches an HTTP request with exponential backoff retries and explicit timeout abort signals.
 */
async function fetchWithRetry(url: string, retries = 2, timeout = 16000): Promise<Response> {
  let lastError: any = null;

  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      try {
        controller.abort(new DOMException(`NASA telemetry link timed out after ${timeout}ms`, 'TimeoutError'));
      } catch {
        controller.abort();
      }
    }, timeout);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) return res;

      if (res.status === 429) {
        throw new Error('Rate limit reached (HTTP 429). Engaging cached astronomical telemetry.');
      }

      let errorMsg = `HTTP ${res.status}`;
      try {
        const errorJson = await res.json();
        if (errorJson?.msg) {
          errorMsg = errorJson.msg;
        } else if (errorJson?.error?.message) {
          errorMsg = errorJson.error.message;
        }
      } catch {
        // Fallback to status text
      }
      throw new Error(errorMsg);
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;

      // Clean up abort/timeout error message
      if (err.name === 'AbortError' || err.name === 'TimeoutError' || err.message?.includes('aborted')) {
        lastError = new Error(`NASA telemetry link timed out after ${timeout}ms.`);
      }

      // Don't retry rate limits
      if (err.message?.includes('429') || err.message?.includes('Rate limit')) {
        throw lastError;
      }

      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 800 * (i + 1)));
      }
    }
  }

  throw lastError || new Error('Telemetry connection timed out.');
}

export interface FetchApodResult {
  data: ApodData;
  actualDate: string;
  isFallback: boolean;
}

/**
 * Fetches a single APOD record for a specific date or today's latest entry, with fallback self-healing.
 */
export async function fetchApod(date?: string): Promise<FetchApodResult> {
  const today = getEasternDate();
  const requestedDate = date || today;

  // 1. Guard against historical boundaries
  if (requestedDate < NASA_EPOCH) {
    throw new Error(`Requested observation date ${requestedDate} precedes NASA APOD epoch (${NASA_EPOCH}).`);
  }

  // 2. Check tiered cache
  const cached = getCachedApod(requestedDate);
  if (cached) {
    return { data: cached, actualDate: cached.date, isFallback: false };
  }

  // 3. Dispatch network request with fallback recovery
  try {
    const url = requestedDate
      ? `${BASE_URL}?api_key=${NASA_API_KEY}&date=${requestedDate}`
      : `${BASE_URL}?api_key=${NASA_API_KEY}`;

    const res = await fetchWithRetry(url);
    const raw = await res.json();

    const title = raw.title || 'Untitled Cosmic Observation';
    const explanation = raw.explanation || '';
    const telemetry = buildApodTelemetry({ title, explanation });

    const item: ApodData = {
      title,
      url: raw.url || '',
      explanation,
      date: raw.date || requestedDate,
      media_type: raw.media_type || 'image',
      copyright: raw.copyright,
      hdurl: raw.hdurl || raw.url,
      category: telemetry.category,
      confidence: telemetry.confidence,
      matchedKeywords: telemetry.matchedKeywords,
      distanceLightYears: telemetry.distanceLightYears,
      distance: telemetry.distance,
    };

    setCachedApod(item.date, item);
    return { data: item, actualDate: item.date, isFallback: false };
  } catch (err: any) {
    const errMsg = err.message || '';

    // If rate-limited or offline, check cache for requested or previous days
    const fallbackCached =
      getCachedApod(requestedDate) ||
      getCachedApod(addDays(requestedDate, -1)) ||
      getCachedApod(today);
    if (fallbackCached) {
      return { data: fallbackCached, actualDate: fallbackCached.date, isFallback: true };
    }

    // Auto-correct if date limit reached (future or timezone mismatch)
    if (isDateUnavailableError(errMsg)) {
      const parsedMax = parseMaxDateFromMessage(errMsg);
      const fallbackDate = parsedMax || addDays(requestedDate, -1);

      if (fallbackDate >= NASA_EPOCH && fallbackDate !== requestedDate) {
        try {
          const fallbackRes = await fetch(`${BASE_URL}?api_key=${NASA_API_KEY}&date=${fallbackDate}`);
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            const fTitle = fallbackData.title || 'Untitled Cosmic Observation';
            const fExpl = fallbackData.explanation || '';
            const fTelemetry = buildApodTelemetry({ title: fTitle, explanation: fExpl });

            const item: ApodData = {
              title: fTitle,
              url: fallbackData.url || '',
              explanation: fExpl,
              date: fallbackData.date || fallbackDate,
              media_type: fallbackData.media_type || 'image',
              copyright: fallbackData.copyright,
              hdurl: fallbackData.hdurl || fallbackData.url,
              category: fTelemetry.category,
              confidence: fTelemetry.confidence,
              matchedKeywords: fTelemetry.matchedKeywords,
              distanceLightYears: fTelemetry.distanceLightYears,
              distance: fTelemetry.distance,
            };
            setCachedApod(item.date, item);
            return { data: item, actualDate: item.date, isFallback: true };
          }
        } catch {
          // Fall through to curated fallback
        }
      }
    }

    // Return curated authentic APOD record if network failed completely
    const curated = getCuratedFallbackApods();
    const match = curated.find((c) => c.date === requestedDate) || curated[0];
    if (match) {
      setCachedApod(match.date, match);
      return { data: match, actualDate: match.date, isFallback: true };
    }

    throw err;
  }
}

/**
 * Queries a chronological span of APOD observations between two RFC-3339 dates.
 */
export async function fetchApodRange(startDate: string, endDate: string): Promise<ApodData[]> {
  try {
    const url = `${BASE_URL}?api_key=${NASA_API_KEY}&start_date=${startDate}&end_date=${endDate}`;
    const res = await fetchWithRetry(url, 2, 20000);
    const data = await res.json();
    const list: any[] = Array.isArray(data) ? data : [data];
    
    const items = list.map((item) => {
      const title = item.title || 'Astronomical Observation';
      const explanation = item.explanation || '';
      const telemetry = buildApodTelemetry({ title, explanation });

      const apodItem: ApodData = {
        title,
        url: item.url || '',
        explanation,
        date: item.date || '',
        media_type: item.media_type || 'image',
        copyright: item.copyright,
        hdurl: item.hdurl || item.url,
        category: telemetry.category,
        confidence: telemetry.confidence,
        matchedKeywords: telemetry.matchedKeywords,
        distanceLightYears: telemetry.distanceLightYears,
        distance: telemetry.distance,
      };

      if (apodItem.date) {
        setCachedApod(apodItem.date, apodItem);
      }
      return apodItem;
    });

    if (items.length > 0) {
      return items;
    }
  } catch (err) {
    console.warn('Live APOD range fetch timed out or hit rate limits; engaging archival catalog fallback.', err);
  }

  // Graceful fallback: return curated authentic astronomical archive
  const fallbacks = getCuratedFallbackApods();
  fallbacks.forEach((f) => setCachedApod(f.date, f));
  return fallbacks;
}

/**
 * Retrieves a non-deterministic sample of random historical APOD records.
 */
export async function fetchRandomApods(count = 24): Promise<ApodData[]> {
  try {
    const url = `${BASE_URL}?api_key=${NASA_API_KEY}&count=${Math.min(count, 20)}`;
    const res = await fetchWithRetry(url, 2, 18000);
    const data = await res.json();
    const list: any[] = Array.isArray(data) ? data : [data];

    const items = list.map((item) => {
      const title = item.title || 'Astronomical Observation';
      const explanation = item.explanation || '';
      const telemetry = buildApodTelemetry({ title, explanation });

      const apodItem: ApodData = {
        title,
        url: item.url || '',
        explanation,
        date: item.date || '',
        media_type: item.media_type || 'image',
        copyright: item.copyright,
        hdurl: item.hdurl || item.url,
        category: telemetry.category,
        confidence: telemetry.confidence,
        matchedKeywords: telemetry.matchedKeywords,
        distanceLightYears: telemetry.distanceLightYears,
        distance: telemetry.distance,
      };

      if (apodItem.date) {
        setCachedApod(apodItem.date, apodItem);
      }
      return apodItem;
    });

    if (items.length > 0) return items;
  } catch (err) {
    console.warn('Random APOD live fetch timed out or hit rate limits; engaging archival catalog fallback.', err);
  }

  // Fallback to shuffled curated records
  const fallbacks = getCuratedFallbackApods();
  fallbacks.forEach((f) => setCachedApod(f.date, f));
  return [...fallbacks].sort(() => 0.5 - Math.random());
}
