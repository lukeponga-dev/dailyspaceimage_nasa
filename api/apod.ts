import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date, start_date, end_date, count, thumbs } = req.query;
  const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';

  const params = new URLSearchParams();
  params.set('api_key', apiKey);
  if (typeof date === 'string' && date) params.set('date', date);
  if (typeof start_date === 'string' && start_date) params.set('start_date', start_date);
  if (typeof end_date === 'string' && end_date) params.set('end_date', end_date);
  if (typeof count === 'string' && count) params.set('count', count);
  if (typeof thumbs === 'string' && thumbs) params.set('thumbs', thumbs);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout to safely fit within Vercel Hobby 10s limit

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
      // APOD data only updates once a day. Cache for 1 hour at edge, serve stale for up to 24 hours.
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    }

    return res.status(response.status).json(data);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Gateway Timeout: NASA API took too long to respond' });
    }
    return res.status(502).json({
      error: 'Bad Gateway: Unable to connect to NASA APOD service',
      details: error.message || 'Unknown error',
    });
  }
}
