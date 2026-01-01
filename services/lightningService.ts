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
  'wss://ws1.blitzortung.org',
  'ws://ws1.blitzortung.org',
];

let currentServerIndex = 0;

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
      // Subscribe to global strikes (no geographic filter)
      // Blitzortung expects a JSON message to set region
      // Empty/global subscription
      ws?.send(JSON.stringify({ west: -180, east: 180, north: 90, south: -90 }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Blitzortung sends strikes with time in nanoseconds
        if (data.lat !== undefined && data.lon !== undefined && data.time !== undefined) {
          const strike: LightningStrike = {
            lat: data.lat,
            lon: data.lon,
            time: Math.floor(data.time / 1000000), // Convert nanoseconds to milliseconds
            age: 0,
          };

          strikes.push(strike);

          // Keep only recent strikes
          if (strikes.length > MAX_STRIKES) {
            strikes = strikes.slice(-MAX_STRIKES);
          }

          notifyListeners();
        }
      } catch (e) {
        // Ignore parse errors - some messages may not be strike data
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
