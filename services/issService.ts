// ISS (International Space Station) tracking service
// Uses the "Where The ISS At?" API for real-time position data
// Smoothly interpolates position between API calls for animation

export interface ISSPosition {
  lat: number;
  lng: number;
  altitude: number;    // km above Earth
  velocity: number;    // km/h
  visibility: string;  // 'daylight' | 'eclipsed'
  timestamp: number;
}

// Store positions for smooth interpolation
let currentPosition: ISSPosition | null = null;
let lastFetch = 0;
let lastHeading = 0;
const CACHE_DURATION = 5000; // 5 seconds between API calls

// Smooth rendering state
let renderedLat = 0;
let renderedLng = 0;
let targetLat = 0;
let targetLng = 0;
let hasInitialized = false;
let lastRenderTime = 0;

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

// Lerp helper for smooth transitions
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Handle longitude wrapping for smooth interpolation across the dateline
function lerpLongitude(a: number, b: number, t: number): number {
  let diff = b - a;
  // If the difference is greater than 180, we're crossing the dateline
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  let result = a + diff * t;
  // Normalize to -180 to 180
  if (result > 180) result -= 360;
  if (result < -180) result += 360;
  return result;
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

    const prevPosition = currentPosition;

    currentPosition = {
      lat: data.latitude,
      lng: data.longitude,
      altitude: Math.round(data.altitude),
      velocity: Math.round(data.velocity),
      visibility: data.visibility === 'daylight' ? 'daylight' : 'eclipsed',
      timestamp: data.timestamp * 1000,
    };

    // Calculate heading for extrapolation
    if (prevPosition && currentPosition) {
      lastHeading = calculateHeading(
        prevPosition.lat, prevPosition.lng,
        currentPosition.lat, currentPosition.lng
      );
    }

    // Initialize rendered position on first fetch
    if (!hasInitialized) {
      renderedLat = currentPosition.lat;
      renderedLng = currentPosition.lng;
      hasInitialized = true;
    }

    lastFetch = now;

    return currentPosition;
  } catch (error) {
    console.error('[ISS] Fetch error:', error);
    if (now - lastFetch > 30000) {
      lastFetch = now - 30000;
    }
    return currentPosition;
  }
}

// Get smoothly interpolated position for animation
export function getInterpolatedISSPosition(): ISSPosition | null {
  if (!currentPosition || !hasInitialized) return null;

  const now = Date.now();
  const deltaTime = lastRenderTime ? (now - lastRenderTime) / 1000 : 0.016; // seconds since last render
  lastRenderTime = now;

  const timeSinceUpdate = now - lastFetch;

  // Calculate where the ISS "should be" based on extrapolation from last known position
  const maxExtrapolation = 30000; // 30 seconds max
  const clampedTime = Math.min(timeSinceUpdate, maxExtrapolation);
  const heading = lastHeading || 45;
  const velocityKmPerSec = (currentPosition.velocity || 27600) / 3600;
  const distanceTraveled = velocityKmPerSec * (clampedTime / 1000);

  const extrapolated = moveAlongGreatCircle(
    currentPosition.lat,
    currentPosition.lng,
    heading,
    distanceTraveled
  );

  targetLat = extrapolated.lat;
  targetLng = extrapolated.lng;

  // Smoothly move rendered position towards target
  // Use a smooth factor based on frame time for consistent speed
  const smoothFactor = Math.min(1, deltaTime * 5); // Smooth over ~200ms

  renderedLat = lerp(renderedLat, targetLat, smoothFactor);
  renderedLng = lerpLongitude(renderedLng, targetLng, smoothFactor);

  return {
    ...currentPosition,
    lat: renderedLat,
    lng: renderedLng,
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
