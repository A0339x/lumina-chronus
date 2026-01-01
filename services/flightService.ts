// Live flight tracking service
// Uses Cloudflare Worker to proxy OpenSky with credentials
// Worker handles rate limiting and caching

export interface FlightPosition {
  icao24: string;
  callsign: string;
  latitude: number;
  longitude: number;
  altitude: number; // meters
  velocity: number; // m/s
  heading: number; // degrees from north
  onGround: boolean;
  lastUpdate: number; // Unix timestamp
}

export interface FlightInfo {
  flightNumber: string;
  callsign: string;
  airline: string;
  aircraft: string;
  origin: { icao: string; name: string; lat: number; lng: number };
  destination: { icao: string; name: string; lat: number; lng: number };
  departureTime: string;
  arrivalTime: string;
  duration: string;
  distance: string;
  flightAttendant: string;
  status: 'Scheduled' | 'In Flight' | 'Landed' | 'Unknown';
  position: FlightPosition | null;
}

// Known flight details (static info that OpenSky doesn't provide)
const KNOWN_FLIGHTS: Record<string, Omit<FlightInfo, 'status' | 'position'>> = {
  'ACA999': {
    flightNumber: 'AC999',
    callsign: 'ACA999',
    airline: 'Air Canada',
    aircraft: 'Boeing 737 MAX 8',
    origin: { icao: 'CYUL', name: 'Montreal-Trudeau', lat: 45.47, lng: -73.74 },
    destination: { icao: 'MMPR', name: 'Puerto Vallarta', lat: 20.68, lng: -105.25 },
    departureTime: '09:00',
    arrivalTime: '13:15',
    duration: '5h 15m',
    distance: '3,650 km',
    flightAttendant: 'The Best Flight Attendant',
  },
};

// Cache for flight data
let flightCache: Map<string, FlightInfo> = new Map();
let lastFetchTime = 0;
const CACHE_TTL = 10000; // 10 seconds (OpenSky rate limit for anonymous users)

// Rate limit backoff handling
let backoffUntil = 0;
let consecutiveErrors = 0;
const MAX_BACKOFF = 300000; // 5 minutes max backoff

// Fetch live flight data via Cloudflare Worker
export async function fetchFlightData(callsigns: string[]): Promise<Map<string, FlightInfo>> {
  const now = Date.now();

  // Return cached data if still fresh
  if (now - lastFetchTime < CACHE_TTL && flightCache.size > 0) {
    return flightCache;
  }

  // Check if we're in backoff mode due to rate limiting
  if (now < backoffUntil) {
    return flightCache; // Return stale cache during backoff
  }

  try {
    // Call our Cloudflare Worker which proxies OpenSky with credentials
    const response = await fetch(
      `/api/data?type=flights&callsigns=${callsigns.join(',')}`
    );

    if (!response.ok) {
      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        consecutiveErrors++;
        const backoffTime = Math.min(CACHE_TTL * Math.pow(2, consecutiveErrors), MAX_BACKOFF);
        backoffUntil = now + backoffTime;
        // Silent - don't spam console
      }
      return flightCache; // Return stale cache on error
    }

    // Success - reset error counter
    consecutiveErrors = 0;

    const data = await response.json() as { flights: Record<string, any> };

    if (!data.flights || Object.keys(data.flights).length === 0) {
      // No new data - preserve last known positions from cache
      // This prevents the plane from snapping back to origin
      lastFetchTime = now;
      return flightCache; // Keep showing last known positions
    }

    // Process flights returned by Worker
    const newCache = new Map<string, FlightInfo>();

    for (const [callsign, flightData] of Object.entries(data.flights)) {
      const position: FlightPosition = {
        icao24: flightData.icao24,
        callsign: flightData.callsign,
        latitude: flightData.latitude,
        longitude: flightData.longitude,
        altitude: flightData.altitude || 0,
        velocity: flightData.velocity || 0,
        heading: flightData.heading || 0,
        onGround: flightData.onGround || false,
        lastUpdate: flightData.lastUpdate || Date.now() / 1000,
      };

      const knownInfo = KNOWN_FLIGHTS[callsign];

      if (knownInfo) {
        newCache.set(callsign, {
          ...knownInfo,
          status: position.onGround ? 'Landed' : 'In Flight',
          position,
        });
      } else {
        newCache.set(callsign, {
          flightNumber: callsign.replace('ACA', 'AC'),
          callsign,
          airline: callsign.startsWith('ACA') ? 'Air Canada' : 'Unknown',
          aircraft: 'Unknown',
          origin: { icao: 'Unknown', name: 'Unknown', lat: 0, lng: 0 },
          destination: { icao: 'Unknown', name: 'Unknown', lat: 0, lng: 0 },
          departureTime: '--:--',
          arrivalTime: '--:--',
          duration: '--',
          distance: '--',
          flightAttendant: 'The Best Flight Attendant',
          status: position.onGround ? 'Landed' : 'In Flight',
          position,
        });
      }
    }

    // For tracked flights not found in new data, check if they've landed
    for (const callsign of callsigns) {
      if (!newCache.has(callsign)) {
        const cached = flightCache.get(callsign);
        const knownInfo = KNOWN_FLIGHTS[callsign];

        if (cached?.position && knownInfo) {
          // Check if last known position is close to destination (within ~50km)
          const distToDestination = haversineDistance(
            cached.position.latitude, cached.position.longitude,
            knownInfo.destination.lat, knownInfo.destination.lng
          );

          if (distToDestination < 50 || cached.position.onGround) {
            // Likely landed - show at destination
            newCache.set(callsign, {
              ...knownInfo,
              status: 'Landed',
              position: {
                ...cached.position,
                latitude: knownInfo.destination.lat,
                longitude: knownInfo.destination.lng,
                altitude: 0,
                velocity: 0,
                onGround: true,
              },
            });
          } else {
            // Still in transit or unknown - keep last known position
            newCache.set(callsign, cached);
          }
        } else if (knownInfo) {
          // No previous position, show as scheduled (not yet departed)
          newCache.set(callsign, {
            ...knownInfo,
            status: 'Scheduled',
            position: null,
          });
        }
      }
    }

    flightCache = newCache;
    lastFetchTime = now;

    return flightCache;
  } catch (error) {
    console.error('Failed to fetch flight data:', error);
    return flightCache; // Return stale cache on error
  }
}

// Get a specific flight's info
export async function getFlight(callsign: string): Promise<FlightInfo | null> {
  const flights = await fetchFlightData([callsign]);
  return flights.get(callsign) || null;
}

// Calculate flight progress (0-1) based on current position
export function calculateFlightProgress(flight: FlightInfo): number {
  if (!flight.position || flight.status !== 'In Flight') {
    return flight.status === 'Landed' ? 1 : 0;
  }

  const { origin, destination } = flight;
  const { latitude, longitude } = flight.position;

  // Calculate total distance and distance traveled
  const totalDist = haversineDistance(
    origin.lat, origin.lng,
    destination.lat, destination.lng
  );

  const distFromOrigin = haversineDistance(
    origin.lat, origin.lng,
    latitude, longitude
  );

  // Clamp progress between 0 and 1
  return Math.min(1, Math.max(0, distFromOrigin / totalDist));
}

// Haversine formula for distance between two points (returns km)
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate distance flown in km
export function calculateDistanceFlown(flight: FlightInfo): number {
  if (!flight.position || flight.status !== 'In Flight') {
    return 0;
  }

  return haversineDistance(
    flight.origin.lat, flight.origin.lng,
    flight.position.latitude, flight.position.longitude
  );
}

// List of flights we want to track
export const TRACKED_FLIGHTS = ['ACA999'];
