// Script to fetch live temperatures and update the hardcoded values
// Run by GitHub Actions every 3 hours
// Fetches temps for ~500 major international airports

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

async function fetchTemperatures() {
  const airports = getAirports();
  const temps = {};
  const batchSize = 100; // Open-Meteo can handle larger batches

  console.log(`Fetching temperatures for ${airports.length} airports...`);

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
          if (item.current_weather?.temperature !== undefined) {
            temps[batch[idx].icao] = Math.round(item.current_weather.temperature);
          }
        });
      } else if (data.current_weather?.temperature !== undefined) {
        temps[batch[0].icao] = Math.round(data.current_weather.temperature);
      }

      if ((i / batchSize) % 20 === 0) {
        console.log(`Progress: ${i}/${airports.length} (${Math.round(i/airports.length*100)}%)`);
      }
    } catch (error) {
      console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
    }
  }

  console.log(`Fetched ${Object.keys(temps).length} temperatures`);
  return temps;
}

async function updateMetarService(temps) {
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

  // Generate new temps code - simple flat object
  const lines = [
    '// Hardcoded temperatures - auto-updated by GitHub Actions',
    `// Last updated: ${new Date().toISOString()}`,
    `// Coverage: ${Object.keys(temps).length} airports`,
    'const HARDCODED_TEMPS: Record<string, number> = {',
  ];

  // Add all temps in a compact format (20 per line)
  const entries = Object.entries(temps);
  for (let i = 0; i < entries.length; i += 20) {
    const chunk = entries.slice(i, i + 20);
    lines.push('  ' + chunk.map(([k, v]) => `"${k}": ${v}`).join(', ') + ',');
  }

  lines.push('};');

  const newTempsCode = lines.join('\n');
  content = content.substring(0, startIdx) + newTempsCode + '\n\n' + content.substring(endIdx);

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Updated metarService.ts with new temperatures');
}

async function main() {
  try {
    const temps = await fetchTemperatures();

    if (Object.keys(temps).length < 400) {
      throw new Error('Too few temperatures fetched, something went wrong');
    }

    await updateMetarService(temps);
    console.log('Done!');
  } catch (error) {
    console.error('Failed:', error);
    process.exit(1);
  }
}

main();
