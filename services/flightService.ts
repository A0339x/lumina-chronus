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
  squawk?: string; // Transponder code (4-digit octal)
}

// Emergency transponder codes
export const EMERGENCY_SQUAWKS: Record<string, { code: string; name: string; severity: 'critical' | 'warning'; description: string }> = {
  '7500': { code: '7500', name: 'Hijacking', severity: 'critical', description: 'Aircraft hijacking or unlawful interference' },
  '7600': { code: '7600', name: 'Radio Failure', severity: 'warning', description: 'Lost radio communications (NORDO)' },
  '7700': { code: '7700', name: 'Emergency', severity: 'critical', description: 'General emergency declared' },
  '7777': { code: '7777', name: 'Military Intercept', severity: 'critical', description: 'Military interceptor operations active' },
  '7400': { code: '7400', name: 'Drone Lost Link', severity: 'warning', description: 'Unmanned aircraft lost control signal' },
  '0000': { code: '0000', name: 'Transponder Issue', severity: 'warning', description: 'Possible transponder malfunction or military' },
};

// Informational transponder codes (not emergencies, but notable)
export const INFO_SQUAWKS: Record<string, { code: string; name: string; description: string }> = {
  '1200': { code: '1200', name: 'VFR (US)', description: 'Visual flight rules - no flight plan filed' },
  '7000': { code: '7000', name: 'VFR (ICAO)', description: 'Visual flight rules - Europe/international' },
  '2000': { code: '2000', name: 'No Code', description: 'Entering secondary radar coverage' },
  '1000': { code: '1000', name: 'IFR Mode S', description: 'IFR flight with Mode S transponder' },
  '7001': { code: '7001', name: 'VFR Special', description: 'VFR with special conditions' },
  '7004': { code: '7004', name: 'Aerobatic', description: 'Aerobatic flight in progress' },
  '7005': { code: '7005', name: 'Glider Tow', description: 'Aircraft towing a glider' },
  '7006': { code: '7006', name: 'Glider', description: 'Glider or sailplane' },
  '7007': { code: '7007', name: 'Helicopter', description: 'Helicopter operations' },
  '1202': { code: '1202', name: 'Glider (US)', description: 'Glider without radio' },
};

export type AlertSeverity = 'normal' | 'warning' | 'critical' | 'info';

export interface FlightAlert {
  type: 'squawk' | 'position' | 'altitude';
  severity: AlertSeverity;
  code?: string;
  name: string;
  description: string;
  timestamp: number;
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
  alerts: FlightAlert[]; // Active alerts for this flight
  alertSeverity: AlertSeverity; // Highest severity alert
}

// Airline lookup from ICAO callsign prefixes
const AIRLINE_PREFIXES: Record<string, { name: string; country: string }> = {
  'ACA': { name: 'Air Canada', country: 'Canada' },
  'AAL': { name: 'American Airlines', country: 'USA' },
  'UAL': { name: 'United Airlines', country: 'USA' },
  'DAL': { name: 'Delta Air Lines', country: 'USA' },
  'SWA': { name: 'Southwest Airlines', country: 'USA' },
  'JBU': { name: 'JetBlue Airways', country: 'USA' },
  'ASA': { name: 'Alaska Airlines', country: 'USA' },
  'NKS': { name: 'Spirit Airlines', country: 'USA' },
  'FFT': { name: 'Frontier Airlines', country: 'USA' },
  'WJA': { name: 'WestJet', country: 'Canada' },
  'BAW': { name: 'British Airways', country: 'UK' },
  'DLH': { name: 'Lufthansa', country: 'Germany' },
  'AFR': { name: 'Air France', country: 'France' },
  'KLM': { name: 'KLM Royal Dutch', country: 'Netherlands' },
  'UAE': { name: 'Emirates', country: 'UAE' },
  'QTR': { name: 'Qatar Airways', country: 'Qatar' },
  'ETD': { name: 'Etihad Airways', country: 'UAE' },
  'SIA': { name: 'Singapore Airlines', country: 'Singapore' },
  'CPA': { name: 'Cathay Pacific', country: 'Hong Kong' },
  'QFA': { name: 'Qantas', country: 'Australia' },
  'ANZ': { name: 'Air New Zealand', country: 'New Zealand' },
  'ANA': { name: 'All Nippon Airways', country: 'Japan' },
  'JAL': { name: 'Japan Airlines', country: 'Japan' },
  'KAL': { name: 'Korean Air', country: 'South Korea' },
  'CCA': { name: 'Air China', country: 'China' },
  'CES': { name: 'China Eastern', country: 'China' },
  'CSN': { name: 'China Southern', country: 'China' },
  'THY': { name: 'Turkish Airlines', country: 'Turkey' },
  'RYR': { name: 'Ryanair', country: 'Ireland' },
  'EZY': { name: 'easyJet', country: 'UK' },
  'VIR': { name: 'Virgin Atlantic', country: 'UK' },
  'AZA': { name: 'ITA Airways', country: 'Italy' },
  'IBE': { name: 'Iberia', country: 'Spain' },
  'TAP': { name: 'TAP Air Portugal', country: 'Portugal' },
  'SAS': { name: 'Scandinavian Airlines', country: 'Sweden' },
  'FIN': { name: 'Finnair', country: 'Finland' },
  'AUA': { name: 'Austrian Airlines', country: 'Austria' },
  'SWR': { name: 'Swiss International', country: 'Switzerland' },
  'EJA': { name: 'NetJets', country: 'USA' },
  'EJM': { name: 'ExcelAire', country: 'USA' },
  'XOJ': { name: 'XOJET', country: 'USA' },
  'LXJ': { name: 'Flexjet', country: 'USA' },
  'TVS': { name: 'Travel Service', country: 'Czech Republic' },
  'VOI': { name: 'Volaris', country: 'Mexico' },
  'VIV': { name: 'Viva Aerobus', country: 'Mexico' },
  'AMX': { name: 'Aeromexico', country: 'Mexico' },
  'AVA': { name: 'Avianca', country: 'Colombia' },
  'LAN': { name: 'LATAM Airlines', country: 'Chile' },
  'GLO': { name: 'Gol Transportes', country: 'Brazil' },
  'TAM': { name: 'LATAM Brasil', country: 'Brazil' },
  'SKW': { name: 'SkyWest Airlines', country: 'USA' },
  'RPA': { name: 'Republic Airways', country: 'USA' },
  'ENY': { name: 'Envoy Air', country: 'USA' },
  'PDT': { name: 'Piedmont Airlines', country: 'USA' },
  'CPZ': { name: 'Compass Airlines', country: 'USA' },
  'EDV': { name: 'Endeavor Air', country: 'USA' },
  'GJS': { name: 'GoJet Airlines', country: 'USA' },
  'ASH': { name: 'Mesa Airlines', country: 'USA' },
  'FDX': { name: 'FedEx Express', country: 'USA' },
  'UPS': { name: 'UPS Airlines', country: 'USA' },
  'GTI': { name: 'Atlas Air', country: 'USA' },
  'ABX': { name: 'ABX Air', country: 'USA' },
};

// Get airline info from callsign
export function getAirlineFromCallsign(callsign: string): { name: string; country: string } | null {
  // Extract prefix (usually 3 letters)
  const prefix = callsign.replace(/[0-9]/g, '').toUpperCase();
  return AIRLINE_PREFIXES[prefix] || null;
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
    squawk: aircraft.squawk || undefined, // Transponder code
  };
}

// Check if a squawk code indicates an emergency
function checkSquawkAlerts(squawk: string | undefined): FlightAlert[] {
  if (!squawk) return [];

  const alerts: FlightAlert[] = [];
  const emergency = EMERGENCY_SQUAWKS[squawk as keyof typeof EMERGENCY_SQUAWKS];

  if (emergency) {
    alerts.push({
      type: 'squawk',
      severity: emergency.severity,
      code: squawk,
      name: emergency.name,
      description: emergency.description,
      timestamp: Date.now(),
    });
    console.warn(`[Flight] EMERGENCY SQUAWK DETECTED: ${squawk} - ${emergency.name}`);
  }

  return alerts;
}

// Get the highest severity from a list of alerts
function getHighestSeverity(alerts: FlightAlert[]): AlertSeverity {
  if (alerts.some(a => a.severity === 'critical')) return 'critical';
  if (alerts.some(a => a.severity === 'warning')) return 'warning';
  return 'normal';
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

    // Check for emergency squawk codes
    const alerts = checkSquawkAlerts(position.squawk);
    const alertSeverity = getHighestSeverity(alerts);

    // Determine flight status
    let status: 'In Flight' | 'Landed' | 'Scheduled' = position.onGround ? 'Landed' : 'In Flight';

    // If we have known flight info, check if we're near destination with stale data
    if (knownInfo && !position.onGround) {
      const distToDestination = haversineDistance(
        position.latitude, position.longitude,
        knownInfo.destination.lat, knownInfo.destination.lng
      );
      const isNearDestination = distToDestination < 100; // Within 100km
      const isLowAltitude = position.altitude < 3000; // Below 10,000ft
      const dataAge = (Date.now() / 1000) - position.lastUpdate;
      const isStaleData = dataAge > 600; // Data older than 10 minutes

      // If near destination, low altitude, and data is stale - probably landed
      if (isNearDestination && isLowAltitude && isStaleData) {
        status = 'Landed';
      }
      // If very close to destination (within 30km) and low, probably landed
      if (distToDestination < 30 && isLowAltitude) {
        status = 'Landed';
      }
    }

    if (knownInfo) {
      newCache.set(callsign, {
        ...knownInfo,
        status,
        position,
        alerts,
        alertSeverity,
      });
    } else {
      // Look up airline from callsign prefix
      const airlineInfo = getAirlineFromCallsign(callsign);
      const flightNumber = callsign.replace(/^([A-Z]{2,3})/, (match) => {
        // Convert ICAO to IATA-style (ACA123 -> AC123)
        const iataMap: Record<string, string> = {
          'ACA': 'AC', 'AAL': 'AA', 'UAL': 'UA', 'DAL': 'DL', 'SWA': 'WN',
          'JBU': 'B6', 'ASA': 'AS', 'WJA': 'WS', 'BAW': 'BA', 'DLH': 'LH',
          'AFR': 'AF', 'KLM': 'KL', 'UAE': 'EK', 'QTR': 'QR', 'SIA': 'SQ',
          'EJA': 'EJA', 'FDX': 'FX', 'UPS': '5X'
        };
        return iataMap[match] || match;
      });

      newCache.set(callsign, {
        flightNumber,
        callsign,
        airline: airlineInfo?.name || 'Private/Unknown',
        aircraft: '',
        origin: { icao: '', name: '', lat: 0, lng: 0 },
        destination: { icao: '', name: '', lat: 0, lng: 0 },
        departureTime: '',
        arrivalTime: '',
        duration: '',
        distance: '',
        flightAttendant: '',
        status,
        position,
        alerts,
        alertSeverity,
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
            alerts: [],
            alertSeverity: 'normal',
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
          alerts: [],
          alertSeverity: 'normal',
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

// Check if a flight has any active alerts
export function hasAlerts(flight: FlightInfo): boolean {
  return flight.alerts.length > 0;
}

// Check if a flight has critical alerts (7500 hijacking, 7700 emergency)
export function hasCriticalAlert(flight: FlightInfo): boolean {
  return flight.alertSeverity === 'critical';
}

// Get squawk code description for display
export function getSquawkDescription(squawk: string | undefined): string {
  if (!squawk) return 'No transponder signal';

  const emergency = EMERGENCY_SQUAWKS[squawk];
  if (emergency) {
    return `${emergency.name}: ${emergency.description}`;
  }

  const info = INFO_SQUAWKS[squawk];
  if (info) {
    return `${info.name}: ${info.description}`;
  }

  return `Transponder code: ${squawk}`;
}

// Format squawk for display with visual indicator
export function formatSquawkStatus(flight: FlightInfo): {
  code: string;
  status: 'normal' | 'warning' | 'critical' | 'info';
  label: string;
  description: string;
} {
  const squawk = flight.position?.squawk;

  if (!squawk) {
    return { code: '----', status: 'normal', label: 'No signal', description: 'No transponder signal received' };
  }

  const emergency = EMERGENCY_SQUAWKS[squawk];
  if (emergency) {
    return {
      code: squawk,
      status: emergency.severity,
      label: emergency.name,
      description: emergency.description
    };
  }

  const info = INFO_SQUAWKS[squawk];
  if (info) {
    return {
      code: squawk,
      status: 'info',
      label: info.name,
      description: info.description
    };
  }

  return { code: squawk, status: 'normal', label: 'Discrete', description: 'ATC-assigned transponder code' };
}

// List of flights we want to track
export const TRACKED_FLIGHTS = ['ACA999'];
