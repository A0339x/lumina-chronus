// ISS (International Space Station) tracking service
// Uses the "Where The ISS At?" API for real-time position data
// Smoothly animates at constant velocity between API updates

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

// Velocity (degrees per millisecond) - updated when we get new API data
let velocityLat = 0;
let velocityLng = 0;

// Rendered position (what we actually display) - moves at constant velocity
let renderedLat = 0;
let renderedLng = 0;
let lastRenderTime = 0;

// Normalize longitude to -180 to 180
function normalizeLng(lng: number): number {
  while (lng > 180) lng -= 360;
  while (lng < -180) lng += 360;
  return lng;
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

    const prevPosition = currentPosition;
    const prevFetchTime = lastFetchTime;

    currentPosition = {
      lat: data.latitude,
      lng: data.longitude,
      altitude: Math.round(data.altitude),
      velocity: Math.round(data.velocity),
      visibility: data.visibility === 'daylight' ? 'daylight' : 'eclipsed',
      timestamp: data.timestamp * 1000,
    };

    lastFetchTime = now;

    // Initialize on first fetch
    if (!hasInitialized) {
      renderedLat = currentPosition.lat;
      renderedLng = currentPosition.lng;
      lastRenderTime = now;
      hasInitialized = true;
    } else if (prevPosition) {
      // Calculate new velocity from the difference between API positions
      const timeDiff = now - prevFetchTime;
      if (timeDiff > 0) {
        velocityLat = (currentPosition.lat - prevPosition.lat) / timeDiff;

        // Handle longitude wrapping
        let lngDiff = currentPosition.lng - prevPosition.lng;
        if (lngDiff > 180) lngDiff -= 360;
        if (lngDiff < -180) lngDiff += 360;
        velocityLng = lngDiff / timeDiff;
      }

      // Smoothly correct any drift: nudge rendered position slightly toward actual
      // This prevents accumulating error over time without causing jumps
      const errorLat = currentPosition.lat - renderedLat;
      let errorLng = currentPosition.lng - renderedLng;
      if (errorLng > 180) errorLng -= 360;
      if (errorLng < -180) errorLng += 360;

      // Apply small correction (10% of error)
      renderedLat += errorLat * 0.1;
      renderedLng = normalizeLng(renderedLng + errorLng * 0.1);
    }

    return currentPosition;
  } catch (error) {
    console.error('[ISS] Fetch error:', error);
    return currentPosition;
  }
}

// Get smoothly animated position
export function getInterpolatedISSPosition(): ISSPosition | null {
  if (!currentPosition || !hasInitialized) return null;

  const now = Date.now();
  const deltaTime = now - lastRenderTime;
  lastRenderTime = now;

  // Move at constant velocity
  renderedLat += velocityLat * deltaTime;
  renderedLng = normalizeLng(renderedLng + velocityLng * deltaTime);

  // Clamp latitude to valid range
  renderedLat = Math.max(-90, Math.min(90, renderedLat));

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
