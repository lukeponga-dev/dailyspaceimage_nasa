// Centralized date utilities for NASA APOD API
// NASA APOD publishes according to US Eastern Time (America/New_York)

export const NASA_EPOCH = "1995-06-16";

/**
 * Retrieves the current calendar date formatted as YYYY-MM-DD in NASA's operational timezone (US Eastern Time).
 * 
 * - What it does:
 *   Evaluates the system clock in the `America/New_York` timezone using ISO 8601 formatting (`en-CA`),
 *   with an automated UTC date fallback if the runtime environment lacks full Intl timezone tables.
 * 
 * - Why it exists:
 *   NASA APOD releases daily images strictly keyed to US Eastern midnight. Client browsers or cloud containers
 *   located in ahead-of-time zones (such as Europe, Asia, or Australia) would otherwise request "tomorrow's"
 *   date in NASA's calendar, causing immediate 400 Bad Request / 404 Not Found errors.
 * 
 * - How it fits into the workflow:
 *   Acts as the single source of truth for "current astronomical day" across date calculations,
 *   setting the upper bounds for the calendar picker, API query defaults, and initial data load.
 */
export const getEasternDate = (): string => {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  } catch {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

/**
 * Calculates a relative calendar date by applying a day delta to an ISO date string.
 * 
 * - What it does:
 *   Parses `YYYY-MM-DD` strings into UTC timestamps, mutates the calendar day count by `days`,
 *   and outputs a zero-padded `YYYY-MM-DD` representation.
 * 
 * - Why it exists:
 *   Allows safe stepping through astronomical records (e.g. "Previous Day", "Next Day")
 *   without suffering daylight saving time (DST) distortions or local timezone date boundary hops.
 * 
 * - How it fits into the workflow:
 *   Used by navigation arrows in `ApodHero.tsx` and fallback retry loops in `fetchApod.ts`
 *   to step backward to the previous operational day if today's image is delayed.
 */
export const addDays = (dateStr: string, days: number): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Transforms an ISO `YYYY-MM-DD` date string into an accessible display string (`DD/MM/YYYY`).
 * 
 * - What it does:
 *   Splits and rearranges date components into a clean human-readable date presentation.
 * 
 * - Why it exists:
 *   Separates raw machine-readable storage formats (ISO-8601) from user-facing UI representations.
 * 
 * - How it fits into the workflow:
 *   Employed across cards, metadata banners, and modal dialogs to display formatted astronomical dates.
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

/**
 * Generates a pseudo-random valid historical APOD date between the NASA epoch and current time.
 * 
 * - What it does:
 *   Computes a random Unix epoch between 1995-06-16 (APOD launch) and the current Eastern date,
 *   converting the result into an ISO `YYYY-MM-DD` string.
 * 
 * - Why it exists:
 *   Enables the "Random Space Image" feature to jump instantaneously to any point in the 30-year APOD archive.
 * 
 * - How it fits into the workflow:
 *   Triggered by the "Surprise Me / Random" button in the navigation header and hero action controls.
 */
export const getRandomDate = (maxDateStr: string = getEasternDate()): string => {
  const start = new Date(NASA_EPOCH + 'T00:00:00Z').getTime();
  const end = new Date(maxDateStr + 'T00:00:00Z').getTime();
  const randomTime = start + Math.random() * (end - start);
  const date = new Date(randomTime);
  
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Extracts the latest operational date from NASA APOD error messages.
 * 
 * - What it does:
 *   Executes regex matching against upstream error text (e.g., "Date must be between Jun 16, 1995 and Sep 05, 2026")
 *   to determine the actual maximum date published by NASA servers.
 * 
 * - Why it exists:
 *   NASA occasionally experiences publication delays where today's photo is not live until later in the morning.
 *   Parsing this error message allows the client to self-heal by automatically rolling back to the latest confirmed date.
 * 
 * - How it fits into the workflow:
 *   Invoked by the catch block in `fetchApod.ts` when handling 400 Bad Request responses.
 */
export const parseMaxDateFromMessage = (msg: string): string | null => {
  if (!msg) return null;

  // Pattern: "No data available for date: 2026-09-06"
  const noDataMatch = msg.match(/no data available for date:\s*(\d{4}-\d{2}-\d{2})/i);
  if (noDataMatch) {
    return addDays(noDataMatch[1], -1);
  }

  // Pattern: "between YYYY-MM-DD and YYYY-MM-DD" or "and YYYY-MM-DD"
  const isoMatch = msg.match(/and\s+(\d{4}-\d{2}-\d{2})/i) || msg.match(/between\s+\d{4}-\d{2}-\d{2}\s+and\s+(\d{4}-\d{2}-\d{2})/i);
  if (isoMatch) {
    return isoMatch[1];
  }

  // Pattern: "and Sep 05, 2026" or "and September 5, 2026"
  const match = msg.match(/and\s+([A-Za-z]+)\s+(\d+),\s+(\d+)/);
  if (match) {
    const [_, monthStr, dayStr, yearStr] = match;
    const months: { [key: string]: string } = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    const month = months[monthStr.substring(0, 3).toLowerCase()];
    if (month) {
      const day = dayStr.padStart(2, '0');
      const year = yearStr;
      return `${year}-${month}-${day}`;
    }
  }

  return null;
};

/**
 * Classifies whether a failure is attributable to an unavailable, unreleased, or invalid astronomical date.
 * 
 * - What it does:
 *   Performs case-insensitive substring classification across HTTP error status messages
 *   for hallmarks of date range violations.
 * 
 * - Why it exists:
 *   Distinguishes transient network errors (which should trigger standard backoff retries)
 *   from deterministic schema/calendar rejections (which require date auto-correction or user notification).
 * 
 * - How it fits into the workflow:
 *   Guards the fallback branch in `fetchApod.ts`, triggering automatic date rollback rather than surfacing
 *   unhandled exceptions to the UI.
 */
export const isDateUnavailableError = (errMsg: string): boolean => {
  if (!errMsg) return false;
  const lower = errMsg.toLowerCase();
  return (
    lower.includes('no data available') ||
    lower.includes('date must be') ||
    lower.includes('future') ||
    lower.includes('bad request') ||
    lower.includes('404') ||
    lower.includes('400') ||
    lower.includes('not found')
  );
};
