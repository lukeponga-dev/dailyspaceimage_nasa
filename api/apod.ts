import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Serverless API Gateway Handler for NASA APOD Telemetry
 * 
 * - What it does:
 *   Acts as an edge-proxied API endpoint that sanitizes incoming query parameters,
 *   injects the secure NASA API key from server environment variables, enforces request
 *   timeouts, and proxies requests to NASA's upstream APOD API.
 * 
 * - Why it exists:
 *   1. Security: Prevents the private NASA_API_KEY from leaking to client-side bundles.
 *   2. Resilience: Shields front-end clients from upstream timeouts and CORS discrepancies.
 *   3. Performance: Injects Vercel Edge caching headers (`s-maxage`, `stale-while-revalidate`)
 *      to serve millions of subsequent requests from Edge CDNs without exhausting rate limits.
 * 
 * - How it fits into the workflow:
 *   Invoked directly via the Vercel routing layer (defined in vercel.json rewrites) whenever
 *   the client or an external service queries `/api/apod`. During Vercel Deployment Checks,
 *   synthetic status pings verify this route responds correctly before promoting the build to production.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enforce HTTP method restriction (idempotent read operations only)
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract and sanitize supported APOD query parameters
  const { date, start_date, end_date, count, thumbs } = req.query;
  const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';

  const params = new URLSearchParams();
  params.set('api_key', apiKey);
  if (typeof date === 'string' && date) params.set('date', date);
  if (typeof start_date === 'string' && start_date) params.set('start_date', start_date);
  if (typeof end_date === 'string' && end_date) params.set('end_date', end_date);
  if (typeof count === 'string' && count) params.set('count', count);
  if (typeof thumbs === 'string' && thumbs) params.set('thumbs', thumbs);

  // Set explicit 8-second circuit breaker to fail before Vercel Serverless 10s Hobby timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const nasaUrl = `https://api.nasa.gov/planetary/apod?${params.toString()}`;
    const response = await fetch(nasaUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    // Cache successful responses at the Vercel Edge Network
    if (response.ok) {
      // APOD data only updates once daily at midnight ET.
      // Cache at Vercel Edge for 1 hour, serve stale for up to 24 hours while background revalidating.
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    }

    return res.status(response.status).json(data);
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Differentiate upstream timeouts from general connection failures
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Gateway Timeout: NASA API took too long to respond' });
    }
    return res.status(502).json({
      error: 'Bad Gateway: Unable to connect to NASA APOD service',
      details: error.message || 'Unknown error',
    });
  }
}

