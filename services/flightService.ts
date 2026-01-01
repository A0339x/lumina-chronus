// Live flight tracking service
// Multi-source ADS-B aggregation with automatic fallback
// Sources: adsb.fi, ADSB.lol, airplanes.live, OpenSky (via Cloudflare Worker)

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
  source?: string; // Which API provided this data
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

// ADS-B data sources in order of preference
interface ADSBSource {
  name: string;
  baseUrl: string;
  rateLimit: number; // ms between requests
  lastRequest: number;
  errors: number;
  backoffUntil: number;
}

const ADSB_SOURCES: ADSBSource[] = [
  {
    name: 'adsb.fi',
    baseUrl: 'https://opendata.adsb.fi/api/v2',
    rateLimit: 1000, // 1 request per second
    lastRequest: 0,
    errors: 0,
    backoffUntil: 0,
  },
  {
    name: 'ADSB.lol',
    baseUrl: 'https://api.adsb.lol/v2',
    rateLimit: 500, // No official rate limit, be conservative
    lastRequest: 0,
    errors: 0,
    backoffUntil: 0,
  },
  {
    name: 'airplanes.live',
    baseUrl: 'https://api.airplanes.live/v2',
    rateLimit: 1000, // 1 request per second
    lastRequest: 0,
    errors: 0,
    backoffUntil: 0,
  },
];

// Known flight details (static info that ADS-B doesn't provide)
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
const CACHE_TTL = 5000; // 5 seconds - faster updates with multiple sources
const MAX_BACKOFF = 300000; // 5 minutes max backoff

// Parse ADS-B Exchange v2 format response (used by adsb.fi, ADSB.lol, airplanes.live)
function parseADSBv2Response(data: any, sourceName: string): FlightPosition | null {
  // Response format: { ac: [{ hex, flight, lat, lon, alt_baro, gs, track, ... }] }
  if (!data || !data.ac || !Array.isArray(data.ac) || data.ac.length === 0) {
    return null;
  }

  const aircraft = data.ac[0];

  // Must have position data
  if (aircraft.lat === undefined || aircraft.lon === undefined) {
    return null;
  }

  return {
    icao24: aircraft.hex || '',
    callsign: (aircraft.flight || '').trim(),
    latitude: aircraft.lat,
    longitude: aircraft.lon,
    altitude: aircraft.alt_baro === 'ground' ? 0 : (aircraft.alt_baro || aircraft.alt_geom || 0) * 0.3048, // feet to meters
    velocity: (aircraft.gs || 0) * 0.514444, // knots to m/s
    heading: aircraft.track || aircraft.true_heading || 0,
    onGround: aircraft.alt_baro === 'ground' || aircraft.on_ground === true || (aircraft.alt_baro && aircraft.alt_baro < 100),
    lastUpdate: aircraft.seen_pos ? (Date.now() / 1000 - aircraft.seen_pos) : Date.now() / 1000,
    source: sourceName,
  };
}

// Fetch from a single ADS-B source
async function fetchFromADSBSource(source: ADSBSource, callsign: string): Promise<FlightPosition | null> {
  const now = Date.now();

  // Check rate limit
  if (now - source.lastRequest < source.rateLimit) {
    return null;
  }

  // Check backoff
  if (now < source.backoffUntil) {
    return null;
  }

  try {
    source.lastRequest = now;

    const response = await fetch(
      `${source.baseUrl}/callsign/${callsign}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      source.errors++;
      if (response.status === 429) {
        // Rate limited - back off exponentially
        source.backoffUntil = now + Math.min(source.rateLimit * Math.pow(2, source.errors), MAX_BACKOFF);
      }
      return null;
    }

    const data = await response.json();
    const position = parseADSBv2Response(data, source.name);

    if (position) {
      // Success - reset error counter
      source.errors = 0;
      console.log(`[Flight] ${callsign} found via ${source.name}`);
    }

    return position;
  } catch (error) {
    source.errors++;
    console.warn(`[Flight] ${source.name} error:`, error);
    return null;
  }
}

// Fetch from OpenSky via our Cloudflare Worker (fallback)
async function fetchFromOpenSky(callsigns: string[]): Promise<Map<string, FlightPosition>> {
  const positions = new Map<string, FlightPosition>();

  try {
    const response = await fetch(
      `/api/data?type=flights&callsigns=${callsigns.join(',')}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      return positions;
    }

    const data = await response.json() as { flights: Record<string, any> };

    if (data.flights) {
      for (const [callsign, flightData] of Object.entries(data.flights)) {
        if (flightData.latitude !== undefined && flightData.longitude !== undefined) {
          positions.set(callsign, {
            icao24: flightData.icao24,
            callsign: flightData.callsign,
            latitude: flightData.latitude,
            longitude: flightData.longitude,
            altitude: flightData.altitude || 0,
            velocity: flightData.velocity || 0,
            heading: flightData.heading || 0,
            onGround: flightData.onGround || false,
            lastUpdate: flightData.lastUpdate || Date.now() / 1000,
            source: 'OpenSky',
          });
        }
      }
    }
  } catch (error) {
    console.warn('[Flight] OpenSky error:', error);
  }

  return positions;
}

// Main fetch function - tries multiple sources with fallback
export async function fetchFlightData(callsigns: string[]): Promise<Map<string, FlightInfo>> {
  const now = Date.now();

  // Return cached data if still fresh
  if (now - lastFetchTime < CACHE_TTL && flightCache.size > 0) {
    return flightCache;
  }

  const positions = new Map<string, FlightPosition>();

  // Try each callsign against ADS-B sources
  for (const callsign of callsigns) {
    let found = false;

    // Try each source in order until we get data
    for (const source of ADSB_SOURCES) {
      const position = await fetchFromADSBSource(source, callsign);
      if (position && position.latitude && position.longitude) {
        positions.set(callsign, position);
        found = true;
        break; // Got data, move to next callsign
      }
    }

    // If no ADS-B source had data, we'll try OpenSky below
    if (!found) {
      console.log(`[Flight] ${callsign} not found in community ADS-B, trying OpenSky...`);
    }
  }

  // For any callsigns not found, try OpenSky as final fallback
  const missingCallsigns = callsigns.filter(cs => !positions.has(cs));
  if (missingCallsigns.length > 0) {
    const openSkyPositions = await fetchFromOpenSky(missingCallsigns);
    for (const [callsign, position] of openSkyPositions) {
      positions.set(callsign, position);
    }
  }

  // Build flight info from positions
  const newCache = new Map<string, FlightInfo>();

  for (const [callsign, position] of positions) {
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

  // For tracked flights not found in any source, check if they've landed
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

        // Only mark as landed if:
        // 1. Close to destination AND at low altitude (< 3000m / ~10,000ft), OR
        // 2. Was already marked as on ground
        const isLowAltitude = cached.position.altitude < 3000;
        const isNearDestination = distToDestination < 50;

        if ((isNearDestination && isLowAltitude) || cached.position.onGround) {
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
          // Still in transit (possibly lost signal at cruise altitude)
          // Keep last known position but don't change status
          newCache.set(callsign, {
            ...cached,
            // If at cruise altitude (> 8000m / ~26,000ft), still mark as In Flight
            status: cached.position.altitude > 8000 ? 'In Flight' : cached.status,
          });
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

// Get current data source status
export function getDataSourceStatus(): { name: string; errors: number; lastRequest: number }[] {
  return ADSB_SOURCES.map(s => ({
    name: s.name,
    errors: s.errors,
    lastRequest: s.lastRequest,
  }));
}

// List of flights we want to track
export const TRACKED_FLIGHTS = ['ACA999'];
