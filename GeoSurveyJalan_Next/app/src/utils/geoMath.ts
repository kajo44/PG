/**
 * Geospatial mathematics and projection utilities for PKRMS
 */

// Earth radius in meters
export const EARTH_RADIUS_M = 6371000;

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculate Haversine distance between two coordinates in meters
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/**
 * Format meters to standard Indonesian PKRMS Stationing (STA) format
 * e.g., 0 -> "STA 00+000", 1250 -> "STA 01+250", 14380 -> "STA 14+380"
 */
export function formatSTA(meters: number): string {
  const safeMeters = Math.max(0, Math.round(meters));
  const km = Math.floor(safeMeters / 1000);
  const m = safeMeters % 1000;
  return `STA ${km.toString().padStart(2, '0')}+${m.toString().padStart(3, '0')}`;
}

/**
 * Parse STA string to meters (e.g., "STA 01+250" -> 1250)
 */
export function parseSTA(staString: string): number {
  const match = staString.match(/STA\s*(\d+)\+(\d+)/i);
  if (!match) return 0;
  return parseInt(match[1], 10) * 1000 + parseInt(match[2], 10);
}

/**
 * Calculate bearing between two points in degrees (0-360)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaLambda = toRadians(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  return (toDegrees(theta) + 360) % 360;
}

/**
 * Project a point onto a line segment defined by A and B
 * Returns the nearest snapped [lat, lng], ratio t, and orthogonal distance in meters
 */
export function projectPointOntoSegment(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): { snappedLat: number; snappedLng: number; distanceM: number; t: number } {
  // Use equirectangular flat approximation for small local segments
  const x0 = toRadians(pLng) * Math.cos(toRadians((aLat + bLat) / 2));
  const y0 = toRadians(pLat);
  const x1 = toRadians(aLng) * Math.cos(toRadians((aLat + bLat) / 2));
  const y1 = toRadians(aLat);
  const x2 = toRadians(bLng) * Math.cos(toRadians((aLat + bLat) / 2));
  const y2 = toRadians(bLat);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  let t = 0;
  if (lenSq > 0) {
    t = ((x0 - x1) * dx + (y0 - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
  }

  const snappedLat = aLat + t * (bLat - aLat);
  const snappedLng = aLng + t * (bLng - aLng);
  const distanceM = haversineDistanceMeters(pLat, pLng, snappedLat, snappedLng);

  return { snappedLat, snappedLng, distanceM, t };
}
