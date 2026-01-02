// ISS (International Space Station) tracking service
// Uses the "Where The ISS At?" API for real-time position data
// Smoothly interpolates between API positions for animation

export interface ISSPosition {
  lat: number;
  lng: number;
  altitude: number;    // km above Earth
  velocity: number;    // km/h
  visibility: string;  // 'daylight' | 'eclipsed'
  timestamp: number;
}

// API data
let currentPosition: ISSPosition | null = null;
let lastFetchTime = 0;
let hasInitialized = false;
const CACHE_DURATION = 5000; // 5 seconds between API calls

// For smooth movement: track position history
let positionHistory: Array<{ lat: number; lng: number; time: number }> = [];
const MAX_HISTORY = 3;

// Rendered position (what we actually display)
let renderedLat = 0;
let renderedLng = 0;
let lastRenderTime = 0;

// Lerp helper
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Handle longitude wrapping for smooth interpolation across the dateline
function lerpLongitude(a: number, b: number, t: number): number {
  let diff = b - a;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  let result = a + diff * t;
  if (result > 180) result -= 360;
  if (result < -180) result += 360;
  return result;
}

// Calculate velocity (degrees per ms) from position history
function calculateVelocity(): { latPerMs: number; lngPerMs: number } {
  if (positionHistory.length < 2) {
    return { latPerMs: 0, lngPerMs: 0 };
  }

  const recent = positionHistory[positionHistory.length - 1];
  const older = positionHistory[positionHistory.length - 2];
  const timeDiff = recent.time - older.time;

  if (timeDiff <= 0) return { latPerMs: 0, lngPerMs: 0 };

  let lngDiff = recent.lng - older.lng;
  if (lngDiff > 180) lngDiff -= 360;
  if (lngDiff < -180) lngDiff += 360;

  return {
    latPerMs: (recent.lat - older.lat) / timeDiff,
    lngPerMs: lngDiff / timeDiff
  };
}

export async function fetchISSPosition(): Promise<ISSPosition | null> {
  const now = Date.now();

  // Return cached data if fresh
  if (currentPosition && (now - lastFetchTime < CACHE_DURATION)) {
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

    currentPosition = {
      lat: data.latitude,
      lng: data.longitude,
      altitude: Math.round(data.altitude),
      velocity: Math.round(data.velocity),
      visibility: data.visibility === 'daylight' ? 'daylight' : 'eclipsed',
      timestamp: data.timestamp * 1000,
    };

    // Add to position history
    positionHistory.push({
      lat: currentPosition.lat,
      lng: currentPosition.lng,
      time: now
    });

    // Keep history bounded
    if (positionHistory.length > MAX_HISTORY) {
      positionHistory.shift();
    }

    lastFetchTime = now;

    // Initialize rendered position on first fetch
    if (!hasInitialized) {
      renderedLat = currentPosition.lat;
      renderedLng = currentPosition.lng;
      lastRenderTime = now;
      hasInitialized = true;
    }

    return currentPosition;
  } catch (error) {
    console.error('[ISS] Fetch error:', error);
    return currentPosition;
  }
}

// Get smoothly interpolated position for animation
export function getInterpolatedISSPosition(): ISSPosition | null {
  if (!currentPosition || !hasInitialized) return null;

  const now = Date.now();
  const deltaTime = now - lastRenderTime;
  lastRenderTime = now;

  // Calculate current velocity from history
  const velocity = calculateVelocity();

  // Predict where ISS should be right now based on last known position + velocity
  const timeSinceFetch = now - lastFetchTime;
  const predictedLat = currentPosition.lat + velocity.latPerMs * timeSinceFetch;
  let predictedLng = currentPosition.lng + velocity.lngPerMs * timeSinceFetch;

  // Normalize longitude
  if (predictedLng > 180) predictedLng -= 360;
  if (predictedLng < -180) predictedLng += 360;

  // Smoothly move rendered position towards predicted position
  // Higher factor = faster catch-up, lower = smoother but more lag
  const smoothFactor = 0.1;

  renderedLat = lerp(renderedLat, predictedLat, smoothFactor);
  renderedLng = lerpLongitude(renderedLng, predictedLng, smoothFactor);

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
