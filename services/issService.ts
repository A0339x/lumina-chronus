// ISS (International Space Station) tracking service
// Uses the "Where The ISS At?" API for real-time position data

export interface ISSPosition {
  lat: number;
  lng: number;
  altitude: number;    // km above Earth
  velocity: number;    // km/h
  visibility: string;  // 'daylight' | 'eclipsed'
  timestamp: number;
}

let cachedPosition: ISSPosition | null = null;
let lastFetch = 0;
const CACHE_DURATION = 5000; // 5 seconds - ISS moves fast!

export async function fetchISSPosition(): Promise<ISSPosition | null> {
  const now = Date.now();

  // Return cached data if fresh
  if (cachedPosition && (now - lastFetch < CACHE_DURATION)) {
    return cachedPosition;
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

    cachedPosition = {
      lat: data.latitude,
      lng: data.longitude,
      altitude: Math.round(data.altitude),
      velocity: Math.round(data.velocity),
      visibility: data.visibility === 'daylight' ? 'daylight' : 'eclipsed',
      timestamp: data.timestamp * 1000, // Convert to milliseconds
    };
    lastFetch = now;

    return cachedPosition;
  } catch (error) {
    console.error('[ISS] Fetch error:', error);
    return cachedPosition; // Return stale data if available
  }
}

// Format velocity for display
export function formatVelocity(velocity: number): string {
  return `${velocity.toLocaleString()} km/h`;
}

// Format altitude for display
export function formatAltitude(altitude: number): string {
  return `${altitude} km`;
}
