export interface TimezoneData {
  offset: number; // Offset in hours from UTC
  name: string;   // Display name (e.g., "UTC+9")
  cities: string[]; // Major cities in this timezone
  regionName: string; // General region name
  coords: { lat: number; lng: number }; // Coordinates for the primary city/region
}

export interface CountdownState {
  targetDate: Date;
  timezone: TimezoneData;
  timeRemaining: number; // in milliseconds
}

export interface CelebrationMessage {
  greeting: string;
  culturalFact: string;
}

export interface WeatherData {
  temperature: number; // Celsius
  condition: string;
}

export interface FireworkEvent {
  id: string;
  lat: number;
  lng: number;
  color: [number, number, number]; // RGB array for Cobe [0-1, 0-1, 0-1]
}