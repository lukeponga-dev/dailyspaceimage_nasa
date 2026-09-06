/**
 * Cached NASA APOD Astrometric Telemetry Handler & Route
 * 
 * - What it does:
 *   1. Checks in-memory cache for fresh telemetry (24-hour TTL).
 *   2. If expired or absent, fetches live astronomy telemetry from the NASA APOD API.
 *   3. Enriches raw telemetry with `classifyApodWithConfidence` and `resolveDistanceLy`.
 *   4. Stores the structured packet in memory and returns standard JSON payload.
 * 
 * - Why it exists:
 *   NASA APOD releases exactly once per calendar day. A 24-hour server/edge cache dramatically
 *   reduces external latency and guards against NASA 429 rate limit errors.
 * 
 * - Output format:
 *   {
 *     "date": "2026-09-06",
 *     "title": "Pluto in Enhanced Color",
 *     "description": "...",
 *     "imageUrl": "https://apod.nasa.gov/apod/image/...jpg",
 *     "hdImageUrl": "https://apod.nasa.gov/apod/image/..._hd.jpg",
 *     "category": "dwarfPlanet",
 *     "confidence": 0.2,
 *     "matchedKeywords": ["pluto"],
 *     "distanceLightYears": 0.00055
 *   }
 */

import {
  classifyApodWithConfidence,
  resolveDistanceLy
} from '../lib/apodClassifier';
import { formatDistance, FormattedDistance } from '../lib/distanceFormatter';

export interface ApodTelemetryPacket {
  date: string;
  title: string;
  description: string;
  imageUrl: string;
  hdImageUrl: string | null;
  category: string;
  confidence: number;
  matchedKeywords: string[];
  distanceLightYears: number | null;
  distance: FormattedDistance;
}

// ---------------------------------------------------------
//  IN-MEMORY 24-HOUR CACHE
// ---------------------------------------------------------
let cachedApod: ApodTelemetryPacket | null = null;
let cachedAt: number | null = null;

// Cache duration: 24 hours (in ms)
export const CACHE_DURATION = 24 * 60 * 60 * 1000;

/**
 * Retrieves the cached telemetry packet or fetches, classifies, and caches a new one.
 */
export async function getCachedApodTelemetry(targetDate?: string, forceRefresh = false): Promise<ApodTelemetryPacket> {
  const now = Date.now();

  // 1. Serve from cache if fresh and no specific historical date / refresh requested
  if (!targetDate && !forceRefresh && cachedApod && cachedAt && now - cachedAt < CACHE_DURATION) {
    return cachedApod;
  }

  // 2. Fetch APOD from NASA API
  const apiKey = process.env.NASA_API_KEY || "DQyanRGtyfc3NAXvp1c69yTUBiEUt32RISDWcajH";
  const url = targetDate 
    ? `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${targetDate}`
    : `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch APOD from NASA API (HTTP ${res.status})`);
  }

  const apod = await res.json();

  // 3. Classify + confidence
  const { category, confidence, matchedKeywords } = classifyApodWithConfidence(
    apod.title || '',
    apod.explanation || ''
  );

  // 4. Distance resolver (only if confidence is high enough)
  const distanceLightYears =
    confidence >= 0.2
      ? resolveDistanceLy(apod.title || '', category)
      : null;

  const distance = formatDistance(distanceLightYears);

  // 5. Build telemetry packet
  const telemetry: ApodTelemetryPacket = {
    date: apod.date,
    title: apod.title || 'Untitled Observation',
    description: apod.explanation || '',
    imageUrl: apod.url || '',
    hdImageUrl: apod.hdurl ?? null,
    category,
    confidence,
    matchedKeywords,
    distanceLightYears,
    distance
  };

  // 6. Store in cache (for today's latest entry)
  if (!targetDate) {
    cachedApod = telemetry;
    cachedAt = now;
  }

  return telemetry;
}

/**
 * Express / Web standard JSON route handler
 */
export async function handleApodApiRequest(req?: Request) {
  try {
    const telemetry = await getCachedApodTelemetry();
    return new Response(JSON.stringify(telemetry), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
