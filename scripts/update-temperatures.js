// Script to fetch live temperatures and weather conditions
// Run by GitHub Actions every 3 hours
// Fetches data for ~500 major international airports

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Open-Meteo weather codes to condition mapping
// https://open-meteo.com/en/docs#weathervariables
const weatherCodeToCondition = (code) => {
  if (code === 0) return null; // Clear sky - no alert
  if (code === 1 || code === 2 || code === 3) return null; // Partly cloudy - no alert
  if (code === 45 || code === 48) return 'fog'; // Fog
  if (code >= 51 && code <= 55) return null; // Drizzle - no alert
  if (code >= 56 && code <= 57) return 'freezing'; // Freezing drizzle
  if (code >= 61 && code <= 65) return code >= 65 ? 'rain' : null; // Rain (only heavy)
  if (code >= 66 && code <= 67) return 'freezing'; // Freezing rain
  if (code >= 71 && code <= 77) return 'snow'; // Snow
  if (code >= 80 && code <= 82) return code >= 82 ? 'rain' : null; // Rain showers (only violent)
  if (code >= 85 && code <= 86) return 'snow'; // Snow showers
  if (code >= 95 && code <= 99) return 'thunderstorm'; // Thunderstorm
  return null;
};

// Extract airports from metarService.ts
function getAirports() {
  const filePath = path.join(__dirname, '..', 'services', 'metarService.ts');
  const content = fs.readFileSync(filePath, 'utf-8');
  const matches = content.matchAll(/icao: "([A-Z]{4})", lat: ([\-\d.]+), lng: ([\-\d.]+)/g);

  const airports = [];
  for (const m of matches) {
    airports.push({ icao: m[1], lat: parseFloat(m[2]), lng: parseFloat(m[3]) });
  }
  return airports;
}

async function fetchWeatherData() {
  const airports = getAirports();
  const weatherData = {};
  const batchSize = 100;

  console.log(`Fetching weather data for ${airports.length} airports...`);

  for (let i = 0; i < airports.length; i += batchSize) {
    const batch = airports.slice(i, i + batchSize);
    const lats = batch.map(a => a.lat).join(',');
    const lngs = batch.map(a => a.lng).join(',');

    // Rate limit: 1 request per 150ms
    if (i > 0) {
      await delay(150);
    }

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current_weather=true`
      );

      if (!response.ok) {
        console.error(`Batch ${Math.floor(i / batchSize) + 1} failed: ${response.status}`);
        continue;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        data.forEach((item, idx) => {
          if (item.current_weather) {
            const temp = Math.round(item.current_weather.temperature);
            const condition = weatherCodeToCondition(item.current_weather.weathercode);
            weatherData[batch[idx].icao] = { temp, condition };
          }
        });
      } else if (data.current_weather) {
        const temp = Math.round(data.current_weather.temperature);
        const condition = weatherCodeToCondition(data.current_weather.weathercode);
        weatherData[batch[0].icao] = { temp, condition };
      }

      if ((i / batchSize) % 20 === 0) {
        console.log(`Progress: ${i}/${airports.length} (${Math.round(i/airports.length*100)}%)`);
      }
    } catch (error) {
      console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
    }
  }

  // Count conditions
  const conditionCounts = {};
  Object.values(weatherData).forEach(({ condition }) => {
    if (condition) {
      conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
    }
  });
  console.log(`Fetched ${Object.keys(weatherData).length} airports`);
  console.log('Weather conditions:', conditionCounts);

  return weatherData;
}

async function updateMetarService(weatherData) {
  const filePath = path.join(__dirname, '..', 'services', 'metarService.ts');
  let content = fs.readFileSync(filePath, 'utf-8');

  // Find and replace the HARDCODED_TEMPS section
  const startMarker = '// Hardcoded temperatures';
  const endMarker = '// Convert to Map for faster lookups';

  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    throw new Error('Could not find HARDCODED_TEMPS section in metarService.ts');
  }

  // Count airports with conditions
  const withConditions = Object.values(weatherData).filter(d => d.condition).length;

  // Generate new weather data code
  const lines = [
    '// Hardcoded temperatures and weather conditions - auto-updated by GitHub Actions',
    `// Last updated: ${new Date().toISOString()}`,
    `// Coverage: ${Object.keys(weatherData).length} airports, ${withConditions} with active weather`,
    'type WeatherCondition = "thunderstorm" | "snow" | "rain" | "fog" | "freezing" | null;',
    'interface AirportWeather { temp: number; condition: WeatherCondition; }',
    'const HARDCODED_WEATHER: Record<string, AirportWeather> = {',
  ];

  // Add all weather data in a compact format
  const entries = Object.entries(weatherData);
  for (let i = 0; i < entries.length; i += 10) {
    const chunk = entries.slice(i, i + 10);
    const formatted = chunk.map(([k, v]) => {
      if (v.condition) {
        return `"${k}":{temp:${v.temp},condition:"${v.condition}"}`;
      }
      return `"${k}":{temp:${v.temp},condition:null}`;
    }).join(',');
    lines.push('  ' + formatted + ',');
  }

  lines.push('};');

  const newCode = lines.join('\n');
  content = content.substring(0, startIdx) + newCode + '\n\n' + content.substring(endIdx);

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Updated metarService.ts with weather data');
}

async function main() {
  try {
    const weatherData = await fetchWeatherData();

    if (Object.keys(weatherData).length < 400) {
      throw new Error('Too few airports fetched, something went wrong');
    }

    await updateMetarService(weatherData);
    console.log('Done!');
  } catch (error) {
    console.error('Failed:', error);
    process.exit(1);
  }
}

main();
