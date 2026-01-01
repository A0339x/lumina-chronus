# Lumina Chronos - Session Summary

## Project Overview
A New Year's countdown visualization app that displays a world map with airport sparkles, weather conditions, flight tracking, and celebratory effects as each timezone hits midnight.

## Recent Session Changes (Latest First)

### Multi-Source ADS-B Flight Tracking
- Implemented automatic fallback between multiple free ADS-B sources
- Sources in order of preference:
  1. **adsb.fi** - 4,500+ feeders globally, 1 req/sec limit
  2. **ADSB.lol** - Open source, no official rate limit
  3. **airplanes.live** - Community network, 1 req/sec limit
  4. **OpenSky** (via Cloudflare Worker) - Final fallback
- All sources use compatible ADS-B Exchange v2 format
- Automatic rate limit handling and exponential backoff
- 5 second cache TTL for faster updates
- File: `services/flightService.ts`

### Smarter Flight Landing Detection
- Only marks as "Landed" if near destination AND at low altitude (<3000m)
- Keeps status as "In Flight" if signal lost at cruise altitude (>8000m)
- Prevents false "Landed" when ADS-B coverage is spotty

### ISS Tracker with Smooth Animation
- Real-time ISS position from wheretheiss.at API
- Smooth interpolation between API updates using great circle math
- Extrapolates position based on actual ISS velocity (~27,500 km/h)
- Visual: Solar panel shape, orbital trail, pulsing glow
- Hover tooltip: altitude, velocity, lat/lng, sunlight status
- File: `services/issService.ts`

### Fireworks Tab Visibility Fix
- Skips confetti when page is hidden (document.hidden)
- Prevents accumulated burst when returning to tab

### Unity Message Frosted Glass Effect
- Semi-transparent overlay (60% opacity) with backdrop blur
- Map sparkles visible through the message

### Temperature Legend Redesign
- Compact inline horizontal layout, centered

### Flight Path Styling
- Subtle indigo tones instead of bright yellow
- Smaller markers and plane icon
- Origin: filled white orb, Destination: white ring

### Lightning Strike Visualization
- Real-time from Blitzortung WebSocket
- Flash burst and fade-out animation

### Multi-Condition Weather Support
- Airports can display multiple weather conditions simultaneously
- Concentric ring visualization

## Key Files

### Services
- `services/flightService.ts` - Multi-source ADS-B flight tracking
- `services/issService.ts` - ISS tracking with interpolation
- `services/lightningService.ts` - Blitzortung WebSocket
- `services/metarService.ts` - Airport weather data
- `services/countryData.ts` - Country information

### Components
- `components/WorldMap.tsx` - Main map canvas
- `components/Fireworks.tsx` - Confetti effects
- `components/UnityMessage.tsx` - Post-New Year message
- `components/TemperatureLegend.tsx` - Temperature scale

### API
- `functions/api/data.ts` - Cloudflare Pages Function

## Flight Data Sources Research

### Free Sources (Implemented)
- **adsb.fi**: https://opendata.adsb.fi/api/v2/callsign/{callsign}
- **ADSB.lol**: https://api.adsb.lol/v2/callsign/{callsign}
- **airplanes.live**: https://api.airplanes.live/v2/callsign/{callsign}
- **OpenSky**: Via Cloudflare Worker proxy

### Official Sources (Researched)
- **FAA SWIM**: Free via SWIFT Portal (https://portal.swim.faa.gov/) - US only
  - STDDS: Surface movement, ASDE-X radar, OOOI events
  - SFDPS: En route flight data
- **Eurocontrol NM B2B**: Requires organizational agreement - Europe
- **Aireon**: Space-based ADS-B, enterprise pricing - Global

## Git Tags
- `pre-aurora` - State before aurora implementation (reverted)

## API Usage Notes
- Open-Meteo: Free tier, bulk endpoint for weather
- Blitzortung: Free WebSocket, no API key
- NOAA: Free, no API key
- ADS-B community networks: Free with rate limits
