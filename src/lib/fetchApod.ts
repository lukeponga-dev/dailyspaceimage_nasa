import { ApodData } from '../types';
import { 
  getEasternDate, 
  addDays, 
  isDateUnavailableError, 
  parseMaxDateFromMessage, 
  NASA_EPOCH 
} from '../utils/dateUtils';
import { buildApodTelemetry } from './apodClassifier';

const NASA_API_KEY = process.env.NASA_API_KEY || "DQyanRGtyfc3NAXvp1c69yTUBiEUt32RISDWcajH";
const BASE_URL = "https://api.nasa.gov/planetary/apod";

// In-memory runtime cache
const memoryCache = new Map<string, ApodData>();

// Local storage cache keys
const LOCAL_STORAGE_KEY_PREFIX = 'nasa_apod_cache_';

/**
 * Retrieves cached APOD telemetry from the tiered cache hierarchy (L1 Memory Map -> L2 Browser Storage).
 * 
 * - What it does:
 *   Checks in-memory `Map` first for instant sub-millisecond retrieval. If missing, attempts to read
 *   and deserialize the payload from `localStorage`, hydrating the memory cache on hit.
 * 
 * - Why it exists:
 *   NASA APOD API has stringent rate limits (30 req/hr for DEMO_KEY, 1000/hr for standard keys).
 *   Caching prevents repeated network trips for immutable historical astronomy data.
 * 
 * - How it fits into the workflow:
 *   Invoked synchronously at the entry of `fetchApod` before any outbound HTTP dispatch occurs,
 *   enabling immediate offline rendering and preventing duplicate API calls across component re-renders.
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
    // Ignore localStorage read errors (e.g. private browsing storage access restrictions)
  }
  return null;
}

/**
 * Persists an APOD record into both memory and persistent browser storage.
 * 
 * - What it does:
 *   Stores the normalized `ApodData` entity in the runtime `memoryCache` and serializes it
 *   into browser `localStorage` with a standardized namespace prefix.
 * 
 * - Why it exists:
 *   Guarantees fast reloads across user browser sessions and provides an offline fallback
 *   buffer if the user later encounters network dropouts or upstream 429 rate limits.
 * 
 * - How it fits into the workflow:
 *   Invoked immediately after a successful response from `fetchWithRetry` in `fetchApod`,
 *   ensuring newly discovered celestial records are instantly cached for subsequent views.
 */
export function setCachedApod(date: string, data: ApodData): void {
  memoryCache.set(date, data);
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${date}`, JSON.stringify(data));
  } catch {
    // Gracefully ignore quota exceed errors on limited storage devices
  }
}

/**
 * Dispatches an HTTP request with exponential backoff retries and explicit timeout abort signals.
 * 
 * - What it does:
 *   Executes `fetch` wrapped in an `AbortController` timeout window. On transient network drops
 *   or 5xx server errors, automatically retries up to `retries` times with linear/exponential backoff.
 * 
 * - Why it exists:
 *   NASA government APIs and intermediate networks intermittently drop packets or encounter latency spikes.
 *   Standard `fetch` hangs indefinitely without a signal, which would freeze UI loading states.
 * 
 * - How it fits into the workflow:
 *   Acts as the unified network transport primitive for all upstream APOD fetching routines
 *   (`fetchApod`, `fetchApodRange`, `fetchRandomApods`), ensuring resilient telemetry gathering.
 */
async function fetchWithRetry(url: string, retries = 3, timeout = 10000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) return res;

      // Handle specific HTTP statuses
      if (res.status === 429) {
        throw new Error('Rate limit exceeded (HTTP 429). Utilizing cached astronomical telemetry.');
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
      // Don't retry client errors or rate limits
      if (err.message?.includes('429') || err.message?.includes('Rate limit')) {
        throw err;
      }
      if (i === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Telemetry connection timed out.');
}

/**
 * Fetches a single APOD record for a specific date or today's latest entry, with fallback self-healing.
 * 
 * - What it does:
 *   Validates requested dates against NASA's historical bounds (1995-06-16 to Eastern US 'today'),
 *   checks the tiered cache, issues the network request, and auto-corrects to fallback dates if NASA's
 *   daily release has not yet been published for the target timezone.
 * 
 * - Why it exists:
 *   Provides the primary data pipeline for the hero view and date-picker interactions, shielding the
 *   UI from timezone mismatches and partial publication outages.
 * 
 * - How it fits into the workflow:
 *   Called during initial application mount (`App.tsx`) to populate today's feature image, and re-triggered
 *   when the user selects any calendar date or clicks date navigation controls.
 */
export async function fetchApod(targetDate?: string): Promise<{ data: ApodData; actualDate: string; isFallback?: boolean }> {
  const easternToday = getEasternDate();
  let requestedDate = targetDate || easternToday;

  // Validate date is within bounds
  if (requestedDate < NASA_EPOCH) {
    throw new Error(`Invalid date. APOD archive begins on ${NASA_EPOCH}.`);
  }

  // Prevent requesting future dates
  if (requestedDate > easternToday) {
    requestedDate = easternToday;
  }

  // Check cache first
  const cached = getCachedApod(requestedDate);
  if (cached) {
    return { data: cached, actualDate: requestedDate };
  }

  const url = targetDate && targetDate !== easternToday
    ? `${BASE_URL}?api_key=${NASA_API_KEY}&date=${requestedDate}`
    : `${BASE_URL}?api_key=${NASA_API_KEY}`;

  try {
    const res = await fetchWithRetry(url);
    const rawData = await res.json();

    if (rawData.code && rawData.code !== 200) {
      throw new Error(rawData.msg || `NASA API error: Code ${rawData.code}`);
    }

    const title = rawData.title || 'Untitled Cosmic Observation';
    const explanation = rawData.explanation || 'No astronomical telemetry explanation provided by NASA.';
    const telemetry = buildApodTelemetry({ title, explanation });

    const apodItem: ApodData = {
      title,
      url: rawData.url || '',
      explanation,
      date: rawData.date || requestedDate,
      media_type: rawData.media_type || 'image',
      copyright: rawData.copyright,
      hdurl: rawData.hdurl || rawData.url,
      category: telemetry.category,
      confidence: telemetry.confidence,
      matchedKeywords: telemetry.matchedKeywords,
      distanceLightYears: telemetry.distanceLightYears,
      distance: telemetry.distance,
    };

    setCachedApod(apodItem.date, apodItem);
    return { data: apodItem, actualDate: apodItem.date };
  } catch (err: any) {
    const errMsg = err.message || '';

    // If rate-limited, try returning cached data or previous day's cache
    if (errMsg.includes('429') || errMsg.includes('Rate limit')) {
      const fallbackCached = getCachedApod(requestedDate) || getCachedApod(addDays(requestedDate, -1));
      if (fallbackCached) {
        return { data: fallbackCached, actualDate: fallbackCached.date, isFallback: true };
      }
    }

    // Auto-correct if date limit reached
    if (isDateUnavailableError(errMsg)) {
      const parsedMax = parseMaxDateFromMessage(errMsg);
      const fallbackDate = parsedMax || addDays(requestedDate, -1);

      if (fallbackDate >= NASA_EPOCH && fallbackDate !== requestedDate) {
        // Attempt fetch with fallback date
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
      }
    }

    throw err;
  }
}

/**
 * Queries a chronological span of APOD observations between two RFC-3339 dates.
 */
export async function fetchApodRange(startDate: string, endDate: string): Promise<ApodData[]> {
  const url = `${BASE_URL}?api_key=${NASA_API_KEY}&start_date=${startDate}&end_date=${endDate}`;
  const res = await fetchWithRetry(url);
  const data = await res.json();
  const list: any[] = Array.isArray(data) ? data : [data];
  
  return list.map((item) => {
    const title = item.title || 'Astronomical Observation';
    const explanation = item.explanation || '';
    const telemetry = buildApodTelemetry({ title, explanation });

    return {
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
  });
}

/**
 * Retrieves a non-deterministic sample of random historical APOD records.
 */
export async function fetchRandomApods(count = 24): Promise<ApodData[]> {
  const url = `${BASE_URL}?api_key=${NASA_API_KEY}&count=${count}`;
  const res = await fetchWithRetry(url);
  const data = await res.json();
  const list: any[] = Array.isArray(data) ? data : [data];

  return list.map((item) => {
    const title = item.title || 'Astronomical Observation';
    const explanation = item.explanation || '';
    const telemetry = buildApodTelemetry({ title, explanation });

    return {
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
  });
}
