// ISS (International Space Station) tracking service
// Uses the "Where The ISS At?" API for real-time position data
// Interpolates position between API calls for smooth animation

export interface ISSPosition {
  lat: number;
  lng: number;
  altitude: number;    // km above Earth
  velocity: number;    // km/h
  visibility: string;  // 'daylight' | 'eclipsed'
  timestamp: number;
}

// Store positions for smooth interpolation
let previousPosition: ISSPosition | null = null;
let currentPosition: ISSPosition | null = null;
let lastFetch = 0;
let lastHeading = 0; // Store heading for continuous movement
const CACHE_DURATION = 5000; // 5 seconds between API calls

// Earth's radius in km
const EARTH_RADIUS = 6371;

// Calculate the ISS's approximate heading based on two positions
function calculateHeading(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;

  const x = Math.sin(dLng) * Math.cos(lat2Rad);
  const y = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  let heading = Math.atan2(x, y) * 180 / Math.PI;
  return (heading + 360) % 360;
}

// Move a point along a great circle given heading and distance
function moveAlongGreatCircle(lat: number, lng: number, heading: number, distanceKm: number): { lat: number; lng: number } {
  const angularDistance = distanceKm / EARTH_RADIUS;
  const headingRad = heading * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  const lngRad = lng * Math.PI / 180;

  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
    Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(headingRad)
  );

  const newLngRad = lngRad + Math.atan2(
    Math.sin(headingRad) * Math.sin(angularDistance) * Math.cos(latRad),
    Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(newLatRad)
  );

  return {
    lat: newLatRad * 180 / Math.PI,
    lng: ((newLngRad * 180 / Math.PI) + 540) % 360 - 180 // Normalize to -180 to 180
  };
}

export async function fetchISSPosition(): Promise<ISSPosition | null> {
  const now = Date.now();

  // Return cached data if fresh
  if (currentPosition && (now - lastFetch < CACHE_DURATION)) {
    return currentPosition;
  }

  try {
    const response = await fetch(
      'https://api.wheretheiss.at/v1/satellites/25544',
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      throw new Error(`ISS API error: ${response.status}`);
    }

    const data = await response.json();

    // Store previous position for interpolation
    previousPosition = currentPosition;

    currentPosition = {
      lat: data.latitude,
      lng: data.longitude,
      altitude: Math.round(data.altitude),
      velocity: Math.round(data.velocity),
      visibility: data.visibility === 'daylight' ? 'daylight' : 'eclipsed',
      timestamp: data.timestamp * 1000,
    };

    // Calculate and store heading for smooth movement
    if (previousPosition && currentPosition) {
      lastHeading = calculateHeading(
        previousPosition.lat, previousPosition.lng,
        currentPosition.lat, currentPosition.lng
      );
    }

    lastFetch = now;

    return currentPosition;
  } catch (error) {
    console.error('[ISS] Fetch error:', error);
    // Update lastFetch on failure to prevent runaway interpolation
    // The interpolation will stay capped at maxInterpolationTime
    if (now - lastFetch > 30000) {
      lastFetch = now - 30000; // Keep interpolation capped
    }
    return currentPosition;
  }
}

// Get interpolated position for smooth animation
export function getInterpolatedISSPosition(): ISSPosition | null {
  if (!currentPosition) return null;

  const now = Date.now();
  const timeSinceUpdate = now - lastFetch;

  // Cap interpolation to prevent runaway extrapolation if API fails
  // ISS completes an orbit in ~90 minutes, so limit to 30 seconds of extrapolation
  const maxInterpolationTime = 30000; // 30 seconds
  const clampedTime = Math.min(timeSinceUpdate, maxInterpolationTime);

  // Use stored heading (or default ISS heading of ~51.6 degrees for inclination)
  const heading = lastHeading || 45; // Default roughly NE direction

  // ISS velocity in km/s (velocity is in km/h)
  const velocityKmPerSec = (currentPosition.velocity || 27600) / 3600;

  // Distance traveled since last update (clamped)
  const distanceTraveled = velocityKmPerSec * (clampedTime / 1000);

  // Calculate new position along the trajectory
  const interpolated = moveAlongGreatCircle(
    currentPosition.lat,
    currentPosition.lng,
    heading,
    distanceTraveled
  );

  return {
    ...currentPosition,
    lat: interpolated.lat,
    lng: interpolated.lng,
  };
}

// Format velocity for display
export function formatVelocity(velocity: number): string {
  return `${velocity.toLocaleString()} km/h`;
}

// Format altitude for display
export function formatAltitude(altitude: number): string {
  return `${altitude} km`;
}
