import {
  Body,
  Observer,
  Equator,
  SearchLocalSolarEclipse,
  EclipseKind,
  Horizon
} from 'astronomy-engine';

export interface EclipseTiming {
  startTime: Date;
  peakTime: Date;
  endTime: Date;
  totalityStartTime?: Date;
  totalityEndTime?: Date;
  obscuration: number;
  kind: EclipseKind;
}

/**
 * Calculates the eclipse timing (start, peak, end) for a specific location and date.
 * Searches for the next solar eclipse after the given date.
 *
 * @param date Start date for search
 * @param lat Latitude in degrees
 * @param lng Longitude in degrees
 * @param elevation Elevation in meters (optional, default 0)
 * @returns Object containing start, peak, and end dates, or null if no eclipse found.
 */
export function getEclipseTiming(date: Date, lat: number, lng: number, elevation: number = 0) {
  const observer = new Observer(lat, lng, elevation);
  const eclipse = SearchLocalSolarEclipse(date, observer);

  return {
    startTime: eclipse.partial_begin.time.date,
    peakTime: eclipse.peak.time.date,
    endTime: eclipse.partial_end.time.date,
    totalityStartTime: eclipse.total_begin?.time.date,
    totalityEndTime: eclipse.total_end?.time.date,
    obscuration: eclipse.obscuration,
    kind: eclipse.kind
  };
}

/**
 * Calculates the percentage of the Sun's disk area covered by the Moon
 * at a specific time and location.
 *
 * @param date Time of observation
 * @param lat Latitude in degrees
 * @param lng Longitude in degrees
 * @param elevation Elevation in meters (optional, default 0)
 * @returns Coverage percentage (0 to 1)
 */
export function calculateEclipseCoverage(date: Date, lat: number, lng: number, elevation: number = 0): number {
  const observer = new Observer(lat, lng, elevation);

  // 1. Calculate topocentric coordinates (Azimuth/Elevation) for Sun and Moon
  const sunTopo = Equator(Body.Sun, date, observer, true, true);
  const moonTopo = Equator(Body.Moon, date, observer, true, true);

  // 2. Calculate angular separation
  // We can convert RA/Dec to a unit vector or use built-in angle functions if available.
  // Astronomy Engine doesn't have a direct "AngleBetween" for Equator coordinates in the docs I recall,
  // but we can convert to vector or use spherical law of cosines.

  // Convert RA (hours) to degrees: RA * 15
  const sunRA = sunTopo.ra * 15 * (Math.PI / 180);
  const sunDec = sunTopo.dec * (Math.PI / 180);

  const moonRA = moonTopo.ra * 15 * (Math.PI / 180);
  const moonDec = moonTopo.dec * (Math.PI / 180);

  // Angular separation (sigma) using spherical law of cosines
  // cos(c) = sin(dec1)sin(dec2) + cos(dec1)cos(dec2)cos(ra1-ra2)
  const cosSigma = Math.sin(sunDec) * Math.sin(moonDec) +
                   Math.cos(sunDec) * Math.cos(moonDec) * Math.cos(sunRA - moonRA);

  // Use acos, clamping to [-1, 1] to avoid float errors
  const sigmaRad = Math.acos(Math.max(-1, Math.min(1, cosSigma)));
  const dist = sigmaRad * (180 / Math.PI); // degrees

  // 3. Angular radii
  // Astronomy-engine usually provides distance in AU (vec.dist or similar) or we can approximate/calculate.
  // Actually Equator output includes distance in AU.
  const sunDistAU = sunTopo.dist;
  const moonDistAU = moonTopo.dist;

  // Angular radius = asin(Radius / Distance)
  // Sun Radius ~ 696340 km
  // Moon Radius ~ 1737.4 km
  // 1 AU ~ 149597870.7 km
  const AU_KM = 149597870.7;
  const SUN_RADIUS_KM = 696340;
  const MOON_RADIUS_KM = 1737.4;

  const sunRadiusDeg = (Math.asin(SUN_RADIUS_KM / (sunDistAU * AU_KM)) * 180 / Math.PI);
  const moonRadiusDeg = (Math.asin(MOON_RADIUS_KM / (moonDistAU * AU_KM)) * 180 / Math.PI);

  return calculateCircleOverlap(sunRadiusDeg, moonRadiusDeg, dist);
}

/**
 * Calculates the area of overlap between two circles.
 * @param r1 Radius of circle 1
 * @param r2 Radius of circle 2
 * @param d Center-to-center distance
 * @returns Area overlap ratio relative to circle 1 area (0 to 1+)
 */
function calculateCircleOverlap(r1: number, r2: number, d: number): number {
  if (d >= r1 + r2) return 0; // No overlap
  if (d <= Math.abs(r1 - r2)) {
    // One inside the other
    const area1 = Math.PI * r1 * r1;
    const area2 = Math.PI * r2 * r2;
    return Math.min(area1, area2) / area1;
    // Actually we want fraction of Sun covered?
    // Yes. If Moon (r2) is inside Sun (r1), coverage is area2/area1.
    // If Sun (r1) is inside Moon (r2) (Total eclipse), coverage is 1 (Full coverage).
    if (r2 >= r1) return 1;
    return (Math.PI * r2 * r2) / (Math.PI * r1 * r1);
  }

  // Partial overlap
  const r1Sq = r1 * r1;
  const r2Sq = r2 * r2;

  const d1 = (r1Sq - r2Sq + d * d) / (2 * d);
  const d2 = d - d1;

  const term1 = r1Sq * Math.acos(d1 / r1);
  const term2 = d1 * Math.sqrt(r1Sq - d1 * d1);
  const term3 = r2Sq * Math.acos(d2 / r2);
  const term4 = d2 * Math.sqrt(r2Sq - d2 * d2);

  const intersectionArea = term1 - term2 + term3 - term4;
  const sunArea = Math.PI * r1Sq;

  return Math.min(1, intersectionArea / sunArea);
}
/**
 * Calculates the Sun's position (Azimuth and Elevation) for a specific time and location.
 *
 * @param date Time of observation
 * @param lat Latitude in degrees
 * @param lng Longitude in degrees
 * @param elevation Elevation in meters (optional, default 0)
 * @returns Object containing azimuth and elevation in degrees.
 */
export function getSunPosition(date: Date, lat: number, lng: number, elevation: number = 0) {
  const observer = new Observer(lat, lng, elevation);
  const sunTopo = Equator(Body.Sun, date, observer, true, true);
  const sunHor = Horizon(date, observer, sunTopo.ra, sunTopo.dec, 'normal');

  return {
    azimuth: sunHor.azimuth,
    elevation: sunHor.altitude
  };
}
