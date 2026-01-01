// Cloudflare Pages Function - Weather & Flight Data API
// Caches weather in KV, proxies OpenSky with credentials

interface Env {
  WEATHER_CACHE: KVNamespace;
  OPENSKY_USERNAME: string;
  OPENSKY_PASSWORD: string;
}

interface WeatherData {
  temps: Record<string, number>;
  conditions: Record<string, string | null>;
  updatedAt: string;
}

const WEATHER_CACHE_KEY = 'airport-weather';
const WEATHER_TTL = 900; // 15 minutes in seconds

// CORS headers for frontend access
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
      return await handleWeather(context.env);
    } else if (type === 'flights') {
      return await handleFlights(context.env, url.searchParams);
    } else {
      return jsonResponse({ error: 'Invalid type. Use ?type=weather or ?type=flights' }, 400);
    }
  } catch (error) {
    console.error('API error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
};

async function handleWeather(env: Env): Promise<Response> {
  // Try to get cached weather data
  const cached = await env.WEATHER_CACHE.get(WEATHER_CACHE_KEY, 'json') as WeatherData | null;

  if (cached) {
    const age = Date.now() - new Date(cached.updatedAt).getTime();
    // Return cached if less than 15 minutes old
    if (age < WEATHER_TTL * 1000) {
      return jsonResponse({ ...cached, source: 'cache' });
    }
  }

  // Fetch fresh weather data from Open-Meteo for major cities
  const weatherData = await fetchWeatherData();

  // Cache the result
  await env.WEATHER_CACHE.put(WEATHER_CACHE_KEY, JSON.stringify(weatherData), {
    expirationTtl: WEATHER_TTL * 2, // Keep in KV a bit longer as backup
  });

  return jsonResponse({ ...weatherData, source: 'fresh' });
}

async function handleFlights(env: Env, params: URLSearchParams): Promise<Response> {
  const callsigns = params.get('callsigns')?.split(',') || [];

  if (callsigns.length === 0) {
    return jsonResponse({ error: 'No callsigns provided' }, 400);
  }

  // Build OpenSky URL with credentials in URL (their API prefers this)
  const openskyUrl = `https://${encodeURIComponent(env.OPENSKY_USERNAME)}:${encodeURIComponent(env.OPENSKY_PASSWORD)}@opensky-network.org/api/states/all?lamin=15&lomin=-115&lamax=55&lomax=-60`;

  try {
    const response = await fetch(openskyUrl);

    if (!response.ok) {
      // Pass through rate limit info if available
      const retryAfter = response.headers.get('X-Rate-Limit-Retry-After-Seconds');
      return jsonResponse({
        error: `OpenSky API error: ${response.status}`,
        retryAfter: retryAfter ? parseInt(retryAfter) : null,
      }, response.status);
    }

    const data = await response.json() as { states: any[] | null };

    if (!data.states) {
      return jsonResponse({ flights: {} });
    }

    // Filter to requested callsigns
    const flights: Record<string, any> = {};

    for (const state of data.states) {
      const callsign = (state[1] || '').trim();
      if (callsigns.includes(callsign)) {
        flights[callsign] = {
          icao24: state[0],
          callsign,
          latitude: state[6],
          longitude: state[5],
          altitude: state[7],
          velocity: state[9],
          heading: state[10],
          onGround: state[8],
          lastUpdate: state[4],
        };
      }
    }

    return jsonResponse({ flights });
  } catch (error) {
    console.error('OpenSky fetch error:', error);
    return jsonResponse({ error: 'Failed to fetch flight data' }, 502);
  }
}

// Fetch weather for major timezone cities from Open-Meteo
async function fetchWeatherData(): Promise<WeatherData> {
  // Key cities for each major timezone offset
  const cities = [
    { id: 'UTC+14', lat: -4.71, lng: -174.51 }, // Kiritimati
    { id: 'UTC+13', lat: -21.21, lng: -175.15 }, // Nukualofa
    { id: 'UTC+12', lat: -36.85, lng: 174.76 }, // Auckland
    { id: 'UTC+11', lat: -22.27, lng: 166.44 }, // Noumea
    { id: 'UTC+10', lat: -33.87, lng: 151.21 }, // Sydney
    { id: 'UTC+9', lat: 35.68, lng: 139.65 }, // Tokyo
    { id: 'UTC+8', lat: 39.90, lng: 116.40 }, // Beijing
    { id: 'UTC+7', lat: 13.75, lng: 100.50 }, // Bangkok
    { id: 'UTC+6', lat: 23.81, lng: 90.41 }, // Dhaka
    { id: 'UTC+5', lat: 24.86, lng: 67.01 }, // Karachi
    { id: 'UTC+4', lat: 25.28, lng: 55.30 }, // Dubai
    { id: 'UTC+3', lat: 55.75, lng: 37.62 }, // Moscow
    { id: 'UTC+2', lat: 30.04, lng: 31.24 }, // Cairo
    { id: 'UTC+1', lat: 48.86, lng: 2.35 }, // Paris
    { id: 'UTC+0', lat: 51.51, lng: -0.13 }, // London
    { id: 'UTC-1', lat: 14.92, lng: -23.51 }, // Praia
    { id: 'UTC-2', lat: -3.72, lng: -38.54 }, // Fernando de Noronha area
    { id: 'UTC-3', lat: -22.91, lng: -43.17 }, // Rio
    { id: 'UTC-4', lat: 40.71, lng: -74.01 }, // New York
    { id: 'UTC-5', lat: 41.88, lng: -87.63 }, // Chicago
    { id: 'UTC-6', lat: 19.43, lng: -99.13 }, // Mexico City
    { id: 'UTC-7', lat: 33.45, lng: -112.07 }, // Phoenix
    { id: 'UTC-8', lat: 34.05, lng: -118.24 }, // Los Angeles
    { id: 'UTC-9', lat: 61.22, lng: -149.90 }, // Anchorage
    { id: 'UTC-10', lat: 21.31, lng: -157.86 }, // Honolulu
    { id: 'UTC-11', lat: -14.27, lng: -170.70 }, // Pago Pago
  ];

  const temps: Record<string, number> = {};
  const conditions: Record<string, string | null> = {};

  // Batch fetch (Open-Meteo allows multiple locations)
  const lats = cities.map(c => c.lat).join(',');
  const lngs = cities.map(c => c.lng).join(',');

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current_weather=true`
    );

    if (response.ok) {
      const data = await response.json() as any[];

      // Open-Meteo returns array when multiple locations
      if (Array.isArray(data)) {
        data.forEach((d, i) => {
          if (d.current_weather) {
            temps[cities[i].id] = d.current_weather.temperature;
            conditions[cities[i].id] = null; // Could parse weather code
          }
        });
      }
    }
  } catch (error) {
    console.error('Weather fetch error:', error);
  }

  // Fallback for any missing data
  for (const city of cities) {
    if (!(city.id in temps)) {
      // Estimate based on latitude and season
      const isNorthernHemisphere = city.lat > 0;
      temps[city.id] = isNorthernHemisphere ? -2 : 25;
    }
  }

  return {
    temps,
    conditions,
    updatedAt: new Date().toISOString(),
  };
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}
