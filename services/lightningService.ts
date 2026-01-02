// Real-time lightning strike data from Blitzortung.org
// WebSocket connection for live global lightning detection

export interface LightningStrike {
  lat: number;
  lon: number;
  time: number; // milliseconds since epoch
  age: number;  // milliseconds since strike (computed)
}

// Store recent strikes (max 100, auto-cleanup old ones)
let strikes: LightningStrike[] = [];
let ws: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let listeners: ((strikes: LightningStrike[]) => void)[] = [];

const MAX_STRIKES = 100;
const MAX_AGE_MS = 60000; // Show strikes for 60 seconds
const WS_SERVERS = [
  'wss://live.lightningmaps.org:443/',
  'wss://live2.lightningmaps.org:443/',
];

let currentServerIndex = 0;
let lastStrokeId = 0;

// Subscribe to strike updates
export function subscribeLightning(callback: (strikes: LightningStrike[]) => void): () => void {
  listeners.push(callback);
  // Immediately send current strikes
  callback(getStrikes());

  // Return unsubscribe function
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
}

// Get current strikes with computed age
export function getStrikes(): LightningStrike[] {
  const now = Date.now();
  return strikes
    .map(s => ({ ...s, age: now - s.time }))
    .filter(s => s.age < MAX_AGE_MS);
}

// Notify all listeners
function notifyListeners() {
  const currentStrikes = getStrikes();
  listeners.forEach(l => l(currentStrikes));
}

// Clean up old strikes periodically
function cleanupStrikes() {
  const now = Date.now();
  strikes = strikes.filter(s => now - s.time < MAX_AGE_MS);
}

// Connect to Blitzortung WebSocket
export function connectLightning() {
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    return; // Already connected or connecting
  }

  const server = WS_SERVERS[currentServerIndex];
  console.log(`[Lightning] Connecting to ${server}...`);

  try {
    ws = new WebSocket(server);

    ws.onopen = () => {
      console.log('[Lightning] WebSocket connected');
      // Subscribe to global strikes with full world bounds
      const subscribeMsg = {
        v: 24,           // API version
        i: lastStrokeId, // Last stroke ID we have
        s: false,        // Don't need station data
        x: 0,            // XHR errors
        w: 0,            // WebSocket errors
        z: 2,            // Zoom level (world view)
        b: true,         // Is visible
        h: '',           // Location hash
        p: [90, 180, -90, -180], // World bounds [NE_lat, NE_lng, SW_lat, SW_lng]
      };
      ws?.send(JSON.stringify(subscribeMsg));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // LightningMaps sends strokes in a 'strokes' array
        if (data.strokes && Array.isArray(data.strokes)) {
          for (const stroke of data.strokes) {
            if (stroke.lat !== undefined && stroke.lon !== undefined && stroke.time !== undefined) {
              const strike: LightningStrike = {
                lat: stroke.lat,
                lon: stroke.lon,
                time: stroke.time, // Already in milliseconds
                age: 0,
              };

              // Track the latest stroke ID
              if (stroke.id && stroke.id > lastStrokeId) {
                lastStrokeId = stroke.id;
              }

              strikes.push(strike);
            }
          }

          // Keep only recent strikes
          if (strikes.length > MAX_STRIKES) {
            strikes = strikes.slice(-MAX_STRIKES);
          }

          if (data.strokes.length > 0) {
            notifyListeners();
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    };

    ws.onerror = (error) => {
      console.error('[Lightning] WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('[Lightning] WebSocket closed, reconnecting...');
      ws = null;

      // Try next server on reconnect
      currentServerIndex = (currentServerIndex + 1) % WS_SERVERS.length;

      // Reconnect after delay
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(connectLightning, 5000);
    };
  } catch (error) {
    console.error('[Lightning] Failed to create WebSocket:', error);
    // Try next server
    currentServerIndex = (currentServerIndex + 1) % WS_SERVERS.length;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(connectLightning, 5000);
  }
}

// Disconnect WebSocket
export function disconnectLightning() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
}

// Start cleanup interval
if (typeof window !== 'undefined') {
  setInterval(cleanupStrikes, 5000);
}
