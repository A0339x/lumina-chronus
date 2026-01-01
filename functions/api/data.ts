// Cloudflare Pages Function - Weather & Flight Data API
// - Fetches weather for all airports in bulk, caches in KV
// - Proxies OpenSky with credentials, caches last known positions
// - Implements stale-while-revalidate and rate limiting safeguards

interface Env {
  WEATHER_CACHE: KVNamespace;
  OPENSKY_USERNAME: string;
  OPENSKY_PASSWORD: string;
}

interface AirportWeather {
  temp: number;
  condition: string | null;
}

interface WeatherData {
  airports: Record<string, AirportWeather>;
  updatedAt: string;
}

interface FlightPosition {
  icao24: string;
  callsign: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  onGround: boolean;
  lastUpdate: number;
}

interface FlightCache {
  positions: Record<string, FlightPosition>;
  updatedAt: string;
}

const WEATHER_CACHE_KEY = 'airport-weather-v2';
const FLIGHT_CACHE_KEY = 'flight-positions';
const WEATHER_TTL = 600; // 10 minutes
const FLIGHT_TTL = 30; // 30 seconds for flight data

// Rate limiting: track last fetch times
const RATE_LIMIT_KEY = 'rate-limits';
interface RateLimits {
  weatherLastFetch: number;
  flightLastFetch: number;
  weatherErrors: number;
  flightErrors: number;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const type = url.searchParams.get('type');

  try {
    if (type === 'weather') {
      return await handleWeather(context.env, context);
    } else if (type === 'flights') {
      return await handleFlights(context.env, url.searchParams);
    } else {
      return jsonResponse({ error: 'Use ?type=weather or ?type=flights' }, 400);
    }
  } catch (error) {
    console.error('API error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
};

// ============ WEATHER HANDLING ============

async function handleWeather(env: Env, ctx: EventContext<Env, any, any>): Promise<Response> {
  const now = Date.now();

  // Always try to get cached data first
  const cached = await env.WEATHER_CACHE.get(WEATHER_CACHE_KEY, 'json') as WeatherData | null;
  const rateLimits = await getRateLimits(env);

  // Check if we should refresh (stale-while-revalidate)
  const shouldRefresh = !cached || (now - new Date(cached.updatedAt).getTime() > WEATHER_TTL * 1000);
  const canRefresh = (now - rateLimits.weatherLastFetch > 60000) && (rateLimits.weatherErrors < 3);

  if (shouldRefresh && canRefresh) {
    // Refresh in background, return stale data immediately if available
    if (cached) {
      // Fire off refresh without waiting (stale-while-revalidate)
      ctx.waitUntil(refreshWeather(env, rateLimits));
      return jsonResponse({ ...cached, source: 'stale' });
    } else {
      // No cache, must wait for fresh data
      const fresh = await refreshWeather(env, rateLimits);
      if (fresh) {
        return jsonResponse({ ...fresh, source: 'fresh' });
      }
    }
  }

  if (cached) {
    return jsonResponse({ ...cached, source: 'cache' });
  }

  // No data at all - return fallback
  return jsonResponse({
    airports: {},
    updatedAt: new Date().toISOString(),
    source: 'fallback'
  });
}

async function refreshWeather(env: Env, rateLimits: RateLimits): Promise<WeatherData | null> {
  const now = Date.now();

  try {
    // Update rate limit timestamp
    rateLimits.weatherLastFetch = now;
    await saveRateLimits(env, rateLimits);

    const weatherData = await fetchAllAirportWeather();

    // Reset error count on success
    rateLimits.weatherErrors = 0;
    await saveRateLimits(env, rateLimits);

    // Cache the result
    await env.WEATHER_CACHE.put(WEATHER_CACHE_KEY, JSON.stringify(weatherData), {
      expirationTtl: WEATHER_TTL * 3, // Keep longer as backup
    });

    return weatherData;
  } catch (error) {
    console.error('Weather refresh error:', error);
    rateLimits.weatherErrors++;
    await saveRateLimits(env, rateLimits);
    return null;
  }
}

async function fetchAllAirportWeather(): Promise<WeatherData> {
  const airports: Record<string, AirportWeather> = {};

  // Fetch in batches of 100 (Open-Meteo limit)
  for (let i = 0; i < AIRPORTS.length; i += 100) {
    const batch = AIRPORTS.slice(i, i + 100);
    const lats = batch.map(a => a.lat).join(',');
    const lngs = batch.map(a => a.lng).join(',');

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current_weather=true`,
        { signal: AbortSignal.timeout(10000) } // 10 second timeout
      );

      if (response.ok) {
        const data = await response.json() as any;

        // Open-Meteo returns array for multiple locations
        const results = Array.isArray(data) ? data : [data];
        results.forEach((d: any, idx: number) => {
          if (d?.current_weather && batch[idx]) {
            airports[batch[idx].icao] = {
              temp: Math.round(d.current_weather.temperature),
              condition: null,
            };
          }
        });
      }
    } catch (error) {
      console.error(`Weather batch ${i} error:`, error);
    }

    // Small delay between batches to be nice to the API
    if (i + 100 < AIRPORTS.length) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  // Fill in missing with estimates
  for (const airport of AIRPORTS) {
    if (!(airport.icao in airports)) {
      airports[airport.icao] = {
        temp: estimateTemp(airport.lat),
        condition: null,
      };
    }
  }

  return {
    airports,
    updatedAt: new Date().toISOString(),
  };
}

function estimateTemp(lat: number): number {
  const month = new Date().getMonth();
  const isWinter = month < 3 || month > 9;
  const latFactor = Math.abs(lat) / 90;
  const baseTemp = 25 - (latFactor * 50);
  const seasonalAdj = isWinter ? (lat > 0 ? -15 : 15) : (lat > 0 ? 15 : -15);
  return Math.round(baseTemp + seasonalAdj * latFactor);
}

// ============ FLIGHT HANDLING ============
// Uses Cache API for hot path (10s TTL), KV for persistent backup (1h)

const FLIGHT_CACHE_URL = 'https://lumina-chronos.internal/flights';

async function handleFlights(env: Env, params: URLSearchParams): Promise<Response> {
  const callsigns = params.get('callsigns')?.split(',').filter(Boolean) || [];

  if (callsigns.length === 0) {
    return jsonResponse({ error: 'No callsigns provided' }, 400);
  }

  const cache = caches.default;
  const cacheKey = new Request(FLIGHT_CACHE_URL);

  // 1. Try Cache API first (edge cache, very fast)
  const cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) {
    const data = await cachedResponse.json() as FlightCache;
    const age = Date.now() - new Date(data.updatedAt).getTime();

    // If fresh (< 10 seconds), return immediately
    if (age < 10000) {
      const relevantFlights = filterFlights(data.positions, callsigns);
      return jsonResponse({ flights: relevantFlights, source: 'edge-cache', age: Math.round(age / 1000) });
    }
  }

  // 2. Cache is stale or missing - fetch fresh data
  const rateLimits = await getRateLimits(env);
  const now = Date.now();
  const canFetch = (now - rateLimits.flightLastFetch > 5000) && (rateLimits.flightErrors < 5);

  if (canFetch) {
    // Get KV backup for existing positions
    const kvBackup = await env.WEATHER_CACHE.get(FLIGHT_CACHE_KEY, 'json') as FlightCache | null;
    const fresh = await fetchFlightPositions(env, callsigns, rateLimits, kvBackup);

    if (fresh) {
      // Store in Cache API (10 second TTL for hot path)
      const cacheResponse = new Response(JSON.stringify(fresh), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=10', // 10 seconds
        },
      });
      await cache.put(cacheKey, cacheResponse);

      const relevantFlights = filterFlights(fresh.positions, callsigns);
      return jsonResponse({ flights: relevantFlights, source: 'fresh' });
    }
  }

  // 3. Fallback to KV backup
  const kvBackup = await env.WEATHER_CACHE.get(FLIGHT_CACHE_KEY, 'json') as FlightCache | null;
  if (kvBackup?.positions) {
    const relevantFlights = filterFlights(kvBackup.positions, callsigns);
    return jsonResponse({ flights: relevantFlights, source: 'kv-backup' });
  }

  return jsonResponse({ flights: {}, source: 'none' });
}

function filterFlights(positions: Record<string, FlightPosition>, callsigns: string[]): Record<string, FlightPosition> {
  const result: Record<string, FlightPosition> = {};
  for (const cs of callsigns) {
    if (positions[cs]) {
      result[cs] = positions[cs];
    }
  }
  return result;
}

async function fetchFlightPositions(
  env: Env,
  callsigns: string[],
  rateLimits: RateLimits,
  existingCache: FlightCache | null
): Promise<FlightCache | null> {
  const now = Date.now();

  try {
    rateLimits.flightLastFetch = now;
    await saveRateLimits(env, rateLimits);

    const openskyUrl = `https://${encodeURIComponent(env.OPENSKY_USERNAME)}:${encodeURIComponent(env.OPENSKY_PASSWORD)}@opensky-network.org/api/states/all?lamin=15&lomin=-115&lamax=55&lomax=-60`;

    const response = await fetch(openskyUrl, {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`OpenSky error: ${response.status}`);
    }

    const data = await response.json() as { states: any[] | null };

    // Start with existing cached positions (preserve last known)
    const positions: Record<string, FlightPosition> = existingCache?.positions || {};

    if (data.states) {
      for (const state of data.states) {
        const callsign = (state[1] || '').trim();
        if (callsigns.includes(callsign) && state[6] != null && state[5] != null) {
          positions[callsign] = {
            icao24: state[0],
            callsign,
            latitude: state[6],
            longitude: state[5],
            altitude: state[7] || 0,
            velocity: state[9] || 0,
            heading: state[10] || 0,
            onGround: state[8] || false,
            lastUpdate: state[4] || now / 1000,
          };
        }
      }
    }

    // Reset errors on success
    rateLimits.flightErrors = 0;
    await saveRateLimits(env, rateLimits);

    const cache: FlightCache = {
      positions,
      updatedAt: new Date().toISOString(),
    };

    // Cache the positions
    await env.WEATHER_CACHE.put(FLIGHT_CACHE_KEY, JSON.stringify(cache), {
      expirationTtl: 3600, // Keep for 1 hour as backup
    });

    return cache;
  } catch (error) {
    console.error('Flight fetch error:', error);
    rateLimits.flightErrors++;
    await saveRateLimits(env, rateLimits);
    return null;
  }
}

// ============ RATE LIMITING ============

async function getRateLimits(env: Env): Promise<RateLimits> {
  const cached = await env.WEATHER_CACHE.get(RATE_LIMIT_KEY, 'json') as RateLimits | null;
  return cached || {
    weatherLastFetch: 0,
    flightLastFetch: 0,
    weatherErrors: 0,
    flightErrors: 0,
  };
}

async function saveRateLimits(env: Env, limits: RateLimits): Promise<void> {
  await env.WEATHER_CACHE.put(RATE_LIMIT_KEY, JSON.stringify(limits), {
    expirationTtl: 3600,
  });
}

// ============ UTILITIES ============

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// ============ AIRPORT DATA ============
// Minimal list: just ICAO, lat, lng for weather fetching
// Full airport details remain in frontend metarService

const AIRPORTS = [
  // North America
  { icao: "KATL", lat: 33.64, lng: -84.43 },
  { icao: "KLAX", lat: 33.94, lng: -118.41 },
  { icao: "KORD", lat: 41.98, lng: -87.90 },
  { icao: "KDFW", lat: 32.90, lng: -97.04 },
  { icao: "KDEN", lat: 39.86, lng: -104.67 },
  { icao: "KJFK", lat: 40.64, lng: -73.78 },
  { icao: "KSFO", lat: 37.62, lng: -122.38 },
  { icao: "KSEA", lat: 47.45, lng: -122.31 },
  { icao: "KLAS", lat: 36.08, lng: -115.15 },
  { icao: "KMCO", lat: 28.43, lng: -81.31 },
  { icao: "KEWR", lat: 40.69, lng: -74.17 },
  { icao: "KMIA", lat: 25.80, lng: -80.29 },
  { icao: "KPHX", lat: 33.43, lng: -112.01 },
  { icao: "KIAH", lat: 29.98, lng: -95.34 },
  { icao: "KBOS", lat: 42.36, lng: -71.01 },
  { icao: "KMSP", lat: 44.88, lng: -93.22 },
  { icao: "KFLL", lat: 26.07, lng: -80.15 },
  { icao: "KDTW", lat: 42.21, lng: -83.35 },
  { icao: "KPHL", lat: 39.87, lng: -75.24 },
  { icao: "KLGA", lat: 40.78, lng: -73.87 },
  { icao: "KHNL", lat: 21.32, lng: -157.92 },
  { icao: "PANC", lat: 61.17, lng: -150.00 },
  // Canada
  { icao: "CYYZ", lat: 43.68, lng: -79.63 },
  { icao: "CYVR", lat: 49.19, lng: -123.18 },
  { icao: "CYUL", lat: 45.47, lng: -73.74 },
  { icao: "CYYC", lat: 51.11, lng: -114.02 },
  // Mexico
  { icao: "MMMX", lat: 19.44, lng: -99.07 },
  { icao: "MMUN", lat: 21.04, lng: -86.87 },
  // Europe
  { icao: "EGLL", lat: 51.47, lng: -0.46 },
  { icao: "LFPG", lat: 49.01, lng: 2.55 },
  { icao: "EHAM", lat: 52.31, lng: 4.76 },
  { icao: "EDDF", lat: 50.03, lng: 8.57 },
  { icao: "LEMD", lat: 40.47, lng: -3.57 },
  { icao: "LIRF", lat: 41.80, lng: 12.25 },
  { icao: "UUEE", lat: 55.97, lng: 37.41 },
  // Asia
  { icao: "VHHH", lat: 22.31, lng: 113.91 },
  { icao: "RJTT", lat: 35.55, lng: 139.78 },
  { icao: "ZBAA", lat: 40.08, lng: 116.58 },
  { icao: "RKSI", lat: 37.46, lng: 126.44 },
  { icao: "WSSS", lat: 1.35, lng: 103.99 },
  { icao: "VTBS", lat: 13.69, lng: 100.75 },
  { icao: "VIDP", lat: 28.57, lng: 77.10 },
  { icao: "OMDB", lat: 25.25, lng: 55.36 },
  // Oceania
  { icao: "YSSY", lat: -33.95, lng: 151.18 },
  { icao: "YMML", lat: -37.67, lng: 144.84 },
  { icao: "NZAA", lat: -37.01, lng: 174.79 },
  // South America
  { icao: "SBGR", lat: -23.43, lng: -46.47 },
  { icao: "SCEL", lat: -33.39, lng: -70.79 },
  { icao: "SAEZ", lat: -34.82, lng: -58.54 },
  { icao: "SKBO", lat: 4.70, lng: -74.15 },
  // Africa
  { icao: "FAOR", lat: -26.14, lng: 28.24 },
  { icao: "HECA", lat: 30.12, lng: 31.41 },
  { icao: "GMMN", lat: 33.37, lng: -7.59 },
  // More coverage for timezone spread
  { icao: "PHNL", lat: 21.32, lng: -157.92 }, // Hawaii
  { icao: "NFFN", lat: -17.75, lng: 177.44 }, // Fiji
  { icao: "NSFA", lat: -13.85, lng: -171.99 }, // Samoa
];
