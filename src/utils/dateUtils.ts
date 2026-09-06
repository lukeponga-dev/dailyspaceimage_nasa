// Centralized date utilities for NASA APOD API
// NASA APOD publishes according to US Eastern Time (America/New_York)

export const NASA_EPOCH = "1995-06-16";

/**
 * Returns today's date formatted as YYYY-MM-DD in NASA's operational timezone (America/New_York).
 * This prevents requesting future dates when the client browser or container is in a timezone ahead of NASA HQ.
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
 * Adds or subtracts days from a YYYY-MM-DD string.
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
 * Formats a YYYY-MM-DD string as DD/MM/YYYY
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

/**
 * Generates a random valid APOD date between NASA_EPOCH and latest available date.
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
 * Parses maximum valid date from NASA API error messages, or infers the previous day if "No data available for date".
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
 * Identifies if an error is due to an unavailable, invalid, or future date.
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
