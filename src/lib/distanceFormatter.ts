/**
 * Astronomical Distance Formatter & Unit Converter
 * 
 * - What it does:
 *   Converts celestial distances in Light-Years (ly) into Astronomical Units (AU) and Kilometers (km).
 * 
 * - Why it exists:
 *   Provides multi-scale scientific telemetry for both solar-system scale (AU, km) and deep-space scale (ly).
 * 
 * - How it fits into the workflow:
 *   Called during APOD telemetry processing to attach structured multi-unit distance measurements.
 */

export interface FormattedDistance {
  ly: number | null;
  au: number | null;
  km: number | null;
}

export function formatDistance(distanceLy: number | null): FormattedDistance {
  if (distanceLy === null) {
    return {
      ly: null,
      au: null,
      km: null
    };
  }

  // Astrodynamic Physical Constants
  const KM_PER_LY = 9.4607e12;     // 1 light-year ≈ 9.4607 trillion kilometers
  const KM_PER_AU = 149597870.7;    // 1 AU ≈ 149,597,870.7 km (mean Earth-Sun distance)

  const km = distanceLy * KM_PER_LY;
  const au = km / KM_PER_AU;

  return {
    ly: Number(distanceLy.toFixed(6)),
    au: Number(au.toFixed(2)),
    km: Math.round(km)
  };
}
