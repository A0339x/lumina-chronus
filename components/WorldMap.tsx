import React, { useEffect, useRef, memo, useState, useCallback } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { ZoomIn, ZoomOut, Maximize2, Maximize, Minimize } from 'lucide-react';
import { FireworkEvent, TimezoneData } from '../types';
import { fetchAllMetar, getTempWithFallback, isMetarCacheReady, getNearestAirportInfo, NearestAirportInfo, getAirports, getAirportConditions, WeatherCondition, WeatherIntensity } from '../services/metarService';
import { getCountryInfo, CountryInfo } from '../services/countryData';
import { useTemperature } from '../contexts/TemperatureContext';
import { fetchFlightData, calculateFlightProgress, calculateDistanceFlown, FlightInfo, formatSquawkStatus } from '../services/flightService';
import { LightningStrike, subscribeLightning, connectLightning, disconnectLightning } from '../services/lightningService';
import { ISSPosition, fetchISSPosition, getInterpolatedISSPosition, formatVelocity, formatAltitude } from '../services/issService';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

// Convert temperature (Celsius) to color
// Range: -40°C (violet) to +40°C (red)
const tempToColor = (tempC: number): string => {
  // Clamp to -40 to +40 range
  tempC = Math.max(-40, Math.min(40, tempC));

  // Normalize to 0-1 range (-40C = 0, +40C = 1)
  const temp = (tempC + 40) / 80;

  // Color gradient: Violet (extreme cold) -> Blue -> Cyan -> Green -> Yellow -> Orange -> Red (hot)
  let r, g, b;

  if (temp < 0.15) {
    // Extreme cold (-40 to -28): Deep violet/magenta to Blue
    const t = temp / 0.15;
    r = Math.floor(180 - 80 * t);  // 180 -> 100
    g = Math.floor(50 + 100 * t);   // 50 -> 150
    b = 255;
  } else if (temp < 0.3) {
    // Very cold (-28 to -16): Blue to Cyan
    const t = (temp - 0.15) / 0.15;
    r = Math.floor(100 - 100 * t);  // 100 -> 0
    g = Math.floor(150 + 105 * t);  // 150 -> 255
    b = 255;
  } else if (temp < 0.45) {
    // Cold (-16 to -4): Cyan to Green
    const t = (temp - 0.3) / 0.15;
    r = 0;
    g = 255;
    b = Math.floor(255 - 155 * t);  // 255 -> 100
  } else if (temp < 0.6) {
    // Cool (-4 to +8): Green to Yellow
    const t = (temp - 0.45) / 0.15;
    r = Math.floor(255 * t);
    g = 255;
    b = Math.floor(100 - 100 * t);
  } else if (temp < 0.8) {
    // Warm (+8 to +24): Yellow to Orange
    const t = (temp - 0.6) / 0.2;
    r = 255;
    g = Math.floor(255 - 100 * t);
    b = 0;
  } else {
    // Hot (+24 to +40): Orange to Red
    const t = (temp - 0.8) / 0.2;
    r = 255;
    g = Math.floor(155 - 100 * t);
    b = Math.floor(50 * (1 - t));
  }

  return `rgb(${r}, ${g}, ${b})`;
};

// Get temperature color for a location using nearest station's real data
const getTemperatureColor = (lat: number, lng: number): string => {
  // Get the nearest airport's actual temperature
  const airportInfo = getNearestAirportInfo(lat, lng);
  const tempC = airportInfo ? airportInfo.temp : getTempWithFallback(lat, lng);
  // Add small random variation for visual interest
  const variation = (Math.random() - 0.5) * 2;
  return tempToColor(tempC + variation);
};

// Timezone longitude ranges (approximate center longitude for each UTC offset)
const getTimezoneLongitude = (offset: number): number => {
  // Each timezone is roughly 15 degrees wide (360/24)
  // UTC+0 is at 0 degrees, offset * 15 gives approximate center
  let lng = offset * 15;
  // Wrap around for display
  if (lng > 180) lng -= 360;
  return lng;
};

// Get local time at a location based on longitude
const getLocalTime = (lng: number): string => {
  const now = new Date();
  // Calculate UTC offset from longitude (15° per hour)
  const offsetHours = lng / 15;
  // Get UTC time in milliseconds and add offset
  const localTime = new Date(now.getTime() + offsetHours * 60 * 60 * 1000);
  // Format as HH:MM with AM/PM
  const hours = localTime.getUTCHours();
  const minutes = localTime.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
};

// Get color for weather condition (for pulsing rings)
const getWeatherConditionColor = (condition: WeatherCondition): string => {
  switch (condition) {
    case 'thunderstorm': return '#ff4444'; // Red
    case 'snow': return '#aaddff'; // Light blue
    case 'rain': return '#4488ff'; // Blue
    case 'fog': return '#888888'; // Gray
    case 'freezing': return '#88ffff'; // Cyan
    default: return '#ffffff';
  }
};

// Get display name for weather condition with intensity
const getWeatherConditionLabel = (condition: WeatherCondition, intensity: WeatherIntensity): string => {
  const intensityPrefix = intensity ? `${intensity.charAt(0).toUpperCase() + intensity.slice(1)} ` : '';

  switch (condition) {
    case 'thunderstorm': return intensity ? `${intensityPrefix}Thunderstorm` : 'Thunderstorm';
    case 'snow': return intensity ? `${intensityPrefix}Snow` : 'Snow';
    case 'rain': return intensity ? `${intensityPrefix}Rain` : 'Heavy Rain';
    case 'fog': return 'Fog';
    case 'freezing': return 'Freezing Conditions';
    default: return '';
  }
};

// Calculate heading/bearing between two points
const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;

  const x = Math.sin(dLng) * Math.cos(lat2Rad);
  const y = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  let bearing = Math.atan2(x, y) * 180 / Math.PI;
  return (bearing + 360) % 360;
};

interface WorldMapProps {
  activeFireworks: FireworkEvent[];
  pastTimezones: TimezoneData[];
  devCelebrationOffset?: number | null; // For testing: trigger celebration on this offset
  devTrigger?: number; // Increment to re-trigger celebration
  allCelebrated?: boolean; // When true, sparkle the entire globe
  trackedFlights?: string[]; // List of callsigns to track
  isFullscreen?: boolean; // Fullscreen mode
  onToggleFullscreen?: () => void; // Toggle fullscreen callback
}

interface HoverInfo {
  country: CountryInfo | null;
  airportInfo: NearestAirportInfo | null;
  x: number;
  y: number;
}

interface FlightHoverInfo {
  flight: FlightInfo;
  progress: number;
  x: number;
  y: number;
}

// Map projection constants (must match ComposableMap settings)
const MAP_SCALE = 220;
const MAP_CENTER_LNG = 0;
const MAP_CENTER_LAT = 20;
// react-simple-maps default SVG dimensions
const SVG_WIDTH = 800;
const SVG_HEIGHT = 600;
const SVG_ASPECT = SVG_WIDTH / SVG_HEIGHT;

// Convert screen coordinates to lat/lng based on equirectangular projection
const screenToLatLng = (
  screenX: number,
  screenY: number,
  containerWidth: number,
  containerHeight: number,
  zoomLevel: number = 1,
  mapCenter: [number, number] = [MAP_CENTER_LNG, MAP_CENTER_LAT]
): { lat: number; lng: number } => {
  // SVG preserves aspect ratio (xMidYMid meet) - calculate actual rendered size
  const containerAspect = containerWidth / containerHeight;

  let svgX, svgY;

  if (containerAspect > SVG_ASPECT) {
    // Container is wider than SVG - SVG fitted to height, centered horizontally
    const scale = containerHeight / SVG_HEIGHT;
    const renderedWidth = SVG_WIDTH * scale;
    const offsetX = (containerWidth - renderedWidth) / 2;
    svgX = ((screenX - offsetX) / renderedWidth) * SVG_WIDTH;
    svgY = (screenY / containerHeight) * SVG_HEIGHT;
  } else {
    // Container is taller than SVG - SVG fitted to width, centered vertically
    const scale = containerWidth / SVG_WIDTH;
    const renderedHeight = SVG_HEIGHT * scale;
    const offsetY = (containerHeight - renderedHeight) / 2;
    svgX = (screenX / containerWidth) * SVG_WIDTH;
    svgY = ((screenY - offsetY) / renderedHeight) * SVG_HEIGHT;
  }

  // For d3 geoEquirectangular projection:
  // scale = pixels per radian, so pixels per degree = scale * (π/180)
  // Multiply by zoom level for zoomed projection
  const pixelsPerDegree = (MAP_SCALE * zoomLevel) * (Math.PI / 180);

  // SVG center corresponds to map center
  const svgCenterX = SVG_WIDTH / 2;
  const svgCenterY = SVG_HEIGHT / 2;

  // Convert SVG coords to lat/lng using current map center
  const lng = mapCenter[0] + (svgX - svgCenterX) / pixelsPerDegree;
  const lat = mapCenter[1] - (svgY - svgCenterY) / pixelsPerDegree;

  return { lat, lng };
};

// Get temperature description in natural language
const getTempDescription = (tempC: number, unit: 'C' | 'F', formatTemp: (c: number) => string): string => {
  const formatted = formatTemp(tempC);
  if (tempC <= -30) return `Extremely cold at ${formatted}`;
  if (tempC <= -20) return `Frigid ${formatted}`;
  if (tempC <= -10) return `Very cold ${formatted}`;
  if (tempC <= 0) return `Cold ${formatted}`;
  if (tempC <= 10) return `Chilly ${formatted}`;
  if (tempC <= 18) return `Cool ${formatted}`;
  if (tempC <= 24) return `Mild ${formatted}`;
  if (tempC <= 30) return `Warm ${formatted}`;
  if (tempC <= 35) return `Hot ${formatted}`;
  return `Very hot ${formatted}`;
};

const WorldMap: React.FC<WorldMapProps> = ({ activeFireworks, pastTimezones, devCelebrationOffset, devTrigger, allCelebrated, trackedFlights = [], isFullscreen = false, onToggleFullscreen }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [landMask, setLandMask] = useState<ImageData | null>(null);
  const [metarReady, setMetarReady] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [currentCountry, setCurrentCountry] = useState<CountryInfo | null>(null);
  const [flightHoverInfo, setFlightHoverInfo] = useState<FlightHoverInfo | null>(null);
  const [isFlightTooltipVisible, setIsFlightTooltipVisible] = useState(false);
  const [liveFlights, setLiveFlights] = useState<Map<string, FlightInfo>>(new Map());
  const [lightningStrikes, setLightningStrikes] = useState<LightningStrike[]>([]);
  const [issPosition, setIssPosition] = useState<ISSPosition | null>(null);
  const [issHoverInfo, setIssHoverInfo] = useState<{ x: number; y: number } | null>(null);
  const [isIssTooltipVisible, setIsIssTooltipVisible] = useState(false);
  const issPositionRef = useRef<ISSPosition | null>(null);
  const issCanvasPosRef = useRef<{ x: number; y: number } | null>(null);
  const flightProgressRef = useRef(0);

  // Zoom and pan state - using animated values for smooth transitions
  const [zoom, setZoom] = useState(1);           // Current animated zoom
  const [targetZoom, setTargetZoom] = useState(1); // Target zoom to animate toward
  const [center, setCenter] = useState<[number, number]>([0, 20]); // [lng, lat]
  const [targetCenter, setTargetCenter] = useState<[number, number]>([0, 20]);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; centerLng: number; centerLat: number } | null>(null);
  const zoomRef = useRef(1);
  const centerRef = useRef<[number, number]>([0, 20]);
  const targetZoomRef = useRef(1);
  const targetCenterRef = useRef<[number, number]>([0, 20]);
  const animationRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  // Keep target refs in sync
  useEffect(() => {
    targetZoomRef.current = targetZoom;
  }, [targetZoom]);

  useEffect(() => {
    targetCenterRef.current = targetCenter;
  }, [targetCenter]);

  // Smooth zoom/pan animation - uses refs to always read latest values
  useEffect(() => {
    let isRunning = true;

    const animate = () => {
      if (!isRunning) return;

      // Skip animation during drag - direct updates only
      if (isDraggingRef.current) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const LERP_FACTOR = 0.35; // Snappier animation (0.1 = slow, 0.5 = fast)
      let needsUpdate = false;

      // Animate zoom - read from refs for latest values
      const zoomDiff = targetZoomRef.current - zoomRef.current;
      if (Math.abs(zoomDiff) > 0.001) {
        const newZoom = zoomRef.current + zoomDiff * LERP_FACTOR;
        zoomRef.current = newZoom;
        setZoom(newZoom);
        needsUpdate = true;
      } else if (zoomRef.current !== targetZoomRef.current) {
        zoomRef.current = targetZoomRef.current;
        setZoom(targetZoomRef.current);
      }

      // Animate center - read from refs for latest values
      const centerLngDiff = targetCenterRef.current[0] - centerRef.current[0];
      const centerLatDiff = targetCenterRef.current[1] - centerRef.current[1];
      if (Math.abs(centerLngDiff) > 0.001 || Math.abs(centerLatDiff) > 0.001) {
        const newCenter: [number, number] = [
          centerRef.current[0] + centerLngDiff * LERP_FACTOR,
          centerRef.current[1] + centerLatDiff * LERP_FACTOR
        ];
        centerRef.current = newCenter;
        setCenter(newCenter);
        needsUpdate = true;
      } else if (centerRef.current[0] !== targetCenterRef.current[0] || centerRef.current[1] !== targetCenterRef.current[1]) {
        centerRef.current = [...targetCenterRef.current];
        setCenter([...targetCenterRef.current]);
      }

      // Keep animation running for responsive feel
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      isRunning = false;
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []); // No dependencies - runs once, reads from refs

  // Zoom constraints
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 6;
  const BASE_SCALE = 220;
  const planePositionsRef = useRef<Map<string, { x: number; y: number; bearing: number }>>(new Map());
  const hoveredFlightRef = useRef<string | null>(null);
  const liveFlightsRef = useRef<Map<string, FlightInfo>>(new Map());
  const lightningStrikesRef = useRef<LightningStrike[]>([]);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track newest timezone for celebration effect (using refs to avoid restarting animation loop)
  const newestTimezoneOffsetRef = useRef<number | null>(null);
  const celebrationIntensityRef = useRef(0);
  const previousTimezonesRef = useRef<Set<number>>(new Set());
  const devCelebrationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const celebrationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for animation loop to avoid restarting when props change
  const pastTimezonesRef = useRef<TimezoneData[]>(pastTimezones);
  const allCelebratedRef = useRef<boolean>(allCelebrated || false);
  const activeFireworksRef = useRef<FireworkEvent[]>(activeFireworks);

  // Keep refs in sync with props
  useEffect(() => {
    pastTimezonesRef.current = pastTimezones;
  }, [pastTimezones]);

  useEffect(() => {
    allCelebratedRef.current = allCelebrated || false;
  }, [allCelebrated]);

  useEffect(() => {
    activeFireworksRef.current = activeFireworks;
  }, [activeFireworks]);

  const { unit, formatTemp } = useTemperature();

  // Handle country hover (just set the country)
  const handleCountryHover = useCallback((geo: any, event: React.MouseEvent) => {
    const countryId = geo.id;
    const countryInfo = getCountryInfo(countryId);

    if (countryInfo) {
      // Clear any pending fade timeout
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }

      setCurrentCountry(countryInfo);
      setIsTooltipVisible(true);

      // Get initial airport info based on mouse position
      if (mapContainerRef.current) {
        const rect = mapContainerRef.current.getBoundingClientRect();
        const localX = event.clientX - rect.left;
        const localY = event.clientY - rect.top;
        const { lat, lng } = screenToLatLng(localX, localY, rect.width, rect.height, zoomRef.current, centerRef.current);
        const airportInfo = getNearestAirportInfo(lat, lng);

        setHoverInfo({
          country: countryInfo,
          airportInfo,
          x: event.clientX,
          y: event.clientY
        });
      }
    }
  }, []);

  const handleCountryLeave = useCallback(() => {
    // Start fade out
    setIsTooltipVisible(false);
    setCurrentCountry(null);

    // Clear hover info after fade animation completes
    fadeTimeoutRef.current = setTimeout(() => {
      setHoverInfo(null);
    }, 200);
  }, []);

  // Update tooltip position and airport info on mouse move
  // Works both over land (with country info) and ocean (nearest airport only)
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!mapContainerRef.current) return;

    const rect = mapContainerRef.current.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;

    // Check if hovering over the ISS
    if (issCanvasPosRef.current) {
      const issPos = issCanvasPosRef.current;
      const dx = localX - issPos.x;
      const dy = localY - issPos.y;
      const distToISS = Math.sqrt(dx * dx + dy * dy);

      if (distToISS < 20) {
        // Hovering over ISS
        setIsIssTooltipVisible(true);
        setIssHoverInfo({ x: event.clientX, y: event.clientY });
        setIsTooltipVisible(false);
        setIsFlightTooltipVisible(false);
        return;
      } else {
        setIsIssTooltipVisible(false);
        setIssHoverInfo(null);
      }
    }

    // Check if hovering over any plane
    let foundPlane = false;
    for (const [callsign, planePos] of planePositionsRef.current) {
      const dx = localX - planePos.x;
      const dy = localY - planePos.y;
      const distToPlane = Math.sqrt(dx * dx + dy * dy);

      if (distToPlane < 25) {
        // Hovering over plane - show flight info
        const flight = liveFlightsRef.current.get(callsign);
        if (flight) {
          hoveredFlightRef.current = callsign;
          setIsFlightTooltipVisible(true);
          setFlightHoverInfo({
            flight,
            progress: calculateFlightProgress(flight),
            x: event.clientX,
            y: event.clientY
          });
          // Hide country tooltip
          setIsTooltipVisible(false);
          setIsIssTooltipVisible(false);
          foundPlane = true;
          break;
        }
      }
    }

    if (!foundPlane) {
      // Not hovering over any plane
      hoveredFlightRef.current = null;
      setIsFlightTooltipVisible(false);
      setFlightHoverInfo(null);
    }

    const { lat, lng } = screenToLatLng(localX, localY, rect.width, rect.height, zoomRef.current, centerRef.current);
    const airportInfo = getNearestAirportInfo(lat, lng);

    if (currentCountry) {
      // Over land with country detected - show country + airport info
      setHoverInfo({
        country: currentCountry,
        airportInfo,
        x: event.clientX,
        y: event.clientY
      });
    } else if (airportInfo && airportInfo.distance < 15) {
      // No country detected but near an airport (within ~15 degrees / ~1500km)
      // This catches land areas where country detection failed (Greenland gaps, small islands)
      // as well as ocean areas near coasts
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }
      setIsTooltipVisible(true);
      setHoverInfo({
        country: null,
        airportInfo,
        x: event.clientX,
        y: event.clientY
      });
    } else if (!currentCountry && hoverInfo) {
      // Moving over open ocean far from airports - hide tooltip
      setIsTooltipVisible(false);
      fadeTimeoutRef.current = setTimeout(() => {
        setHoverInfo(null);
      }, 200);
    }
  }, [currentCountry, hoverInfo]);

  // Zoom with mouse wheel - smooth animated zoom
  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.25 : 0.25; // Slightly larger steps for wheel
    setTargetZoom(prev => {
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta * prev));
      return newZoom;
    });
  }, []);

  // Start drag for panning
  const handleDragStart = useCallback((event: React.MouseEvent) => {
    if (targetZoomRef.current <= 1) return; // No panning at default zoom
    setIsDragging(true);
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      centerLng: centerRef.current[0],
      centerLat: centerRef.current[1]
    };
  }, []);

  // Pan while dragging - direct update for responsive feel
  const handleDrag = useCallback((event: React.MouseEvent) => {
    if (!isDraggingRef.current || !dragStartRef.current || !mapContainerRef.current) return;

    const rect = mapContainerRef.current.getBoundingClientRect();
    const dx = event.clientX - dragStartRef.current.x;
    const dy = event.clientY - dragStartRef.current.y;

    // Convert pixel movement to degrees (adjusted for zoom)
    // Use zoomRef for consistent calculation with canvas
    const pixelsPerDegree = (BASE_SCALE * zoomRef.current) * (Math.PI / 180) * (rect.width / SVG_WIDTH);
    const dLng = -dx / pixelsPerDegree;
    const dLat = dy / pixelsPerDegree;

    // Calculate new center with bounds
    let newLng = dragStartRef.current.centerLng + dLng;
    let newLat = dragStartRef.current.centerLat + dLat;

    // Clamp latitude
    newLat = Math.max(-60, Math.min(80, newLat));

    // Wrap longitude
    if (newLng > 180) newLng -= 360;
    if (newLng < -180) newLng += 360;

    // Direct update for dragging - update all refs and state together
    const newCenter: [number, number] = [newLng, newLat];
    centerRef.current = newCenter;
    targetCenterRef.current = newCenter;
    setCenter(newCenter);
    setTargetCenter(newCenter);
  }, []);

  // End drag
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    isDraggingRef.current = false;
    dragStartRef.current = null;
  }, []);

  // Zoom controls - smooth animated zoom
  const handleZoomIn = useCallback(() => {
    setTargetZoom(prev => Math.min(MAX_ZOOM, prev * 1.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setTargetZoom(prev => {
      const newZoom = Math.max(MIN_ZOOM, prev / 1.5);
      // Reset center when zooming back to 1x
      if (newZoom <= 1) {
        setTargetCenter([0, 20]);
      }
      return newZoom;
    });
  }, []);

  const handleResetView = useCallback(() => {
    setTargetZoom(1);
    setTargetCenter([0, 20]);
  }, []);

  // Fetch METAR weather data on mount
  useEffect(() => {
    const loadMetar = async () => {
      await fetchAllMetar();
      setMetarReady(isMetarCacheReady());
    };
    loadMetar();

    // Refresh METAR data every 30 minutes
    const interval = setInterval(loadMetar, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch live flight data
  useEffect(() => {
    if (trackedFlights.length === 0) {
      setLiveFlights(new Map());
      liveFlightsRef.current = new Map();
      return;
    }

    const loadFlights = async () => {
      const flights = await fetchFlightData(trackedFlights);
      setLiveFlights(flights);
      liveFlightsRef.current = flights;
    };
    loadFlights();

    // Refresh flight data every 10 seconds
    const interval = setInterval(loadFlights, 10 * 1000);
    return () => clearInterval(interval);
  }, [trackedFlights]);

  // Lightning WebSocket disabled - awaiting Blitzortung.org API access approval
  // useEffect(() => {
  //   connectLightning();
  //   const unsubscribe = subscribeLightning((strikes) => {
  //     setLightningStrikes(strikes);
  //     lightningStrikesRef.current = strikes;
  //   });
  //   return () => {
  //     unsubscribe();
  //     disconnectLightning();
  //   };
  // }, []);

  // Fetch ISS position
  useEffect(() => {
    const loadISS = async () => {
      const position = await fetchISSPosition();
      setIssPosition(position);
      issPositionRef.current = position;
    };
    loadISS();

    // Update every 5 seconds - ISS moves fast!
    const interval = setInterval(loadISS, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update flight tooltip when live data changes (so numbers update while hovering)
  useEffect(() => {
    if (isFlightTooltipVisible && flightHoverInfo && hoveredFlightRef.current) {
      const flight = liveFlights.get(hoveredFlightRef.current);
      if (flight) {
        setFlightHoverInfo(prev => prev ? {
          ...prev,
          flight,
          progress: calculateFlightProgress(flight),
        } : null);
      }
    }
  }, [liveFlights, isFlightTooltipVisible]);

  // Dev mode: trigger celebration on demand
  useEffect(() => {
    if (devCelebrationOffset === null || devCelebrationOffset === undefined || !devTrigger) return;

    // Clear any existing dev celebration
    if (devCelebrationIntervalRef.current) {
      clearInterval(devCelebrationIntervalRef.current);
    }

    // Start celebration for the dev offset
    newestTimezoneOffsetRef.current = devCelebrationOffset;
    celebrationIntensityRef.current = 1;

    console.log(`[DEV] Celebration triggered for UTC${devCelebrationOffset >= 0 ? '+' : ''}${devCelebrationOffset}`);

    // Gradually fade out celebration over 15 seconds
    devCelebrationIntervalRef.current = setInterval(() => {
      celebrationIntensityRef.current -= 0.02;
      if (celebrationIntensityRef.current <= 0) {
        if (devCelebrationIntervalRef.current) {
          clearInterval(devCelebrationIntervalRef.current);
          devCelebrationIntervalRef.current = null;
        }
        newestTimezoneOffsetRef.current = null;
        celebrationIntensityRef.current = 0;
        console.log('[DEV] Celebration ended');
      }
    }, 300);

    return () => {
      if (devCelebrationIntervalRef.current) {
        clearInterval(devCelebrationIntervalRef.current);
      }
    };
  }, [devCelebrationOffset, devTrigger]);

  // Detect when a new timezone hits midnight and trigger celebration
  useEffect(() => {
    const currentOffsets = new Set(pastTimezones.map(tz => tz.offset));
    const previousOffsets = previousTimezonesRef.current;

    // On first render, just initialize the ref without triggering celebration
    if (previousOffsets.size === 0 && currentOffsets.size > 0) {
      previousTimezonesRef.current = currentOffsets;
      return;
    }

    // Find newly added timezone (should only be one at a time)
    let newOffset: number | null = null;
    currentOffsets.forEach(offset => {
      if (!previousOffsets.has(offset)) {
        newOffset = offset;
      }
    });

    // Update ref for next comparison
    previousTimezonesRef.current = currentOffsets;

    if (newOffset !== null) {
      // Clear any existing celebration interval
      if (celebrationIntervalRef.current) {
        clearInterval(celebrationIntervalRef.current);
        celebrationIntervalRef.current = null;
      }

      // New timezone just hit midnight!
      newestTimezoneOffsetRef.current = newOffset;
      celebrationIntensityRef.current = 1;

      // Gradually fade out celebration over 15 seconds
      celebrationIntervalRef.current = setInterval(() => {
        celebrationIntensityRef.current -= 0.02;
        if (celebrationIntensityRef.current <= 0) {
          if (celebrationIntervalRef.current) {
            clearInterval(celebrationIntervalRef.current);
            celebrationIntervalRef.current = null;
          }
          newestTimezoneOffsetRef.current = null;
          celebrationIntensityRef.current = 0;
        }
      }, 300); // Every 300ms
    }
    // Note: We intentionally don't clean up the interval on effect re-run
    // The interval manages itself and clears when celebration ends
  }, [pastTimezones]);

  // Cleanup celebration interval on unmount
  useEffect(() => {
    return () => {
      if (celebrationIntervalRef.current) {
        clearInterval(celebrationIntervalRef.current);
      }
    };
  }, []);

  // Create land mask from the hidden mask map
  useEffect(() => {
    const createLandMask = () => {
      const maskMap = document.getElementById('land-mask-map');
      const maskCanvas = maskCanvasRef.current;
      if (!maskMap || !maskCanvas || !containerRef.current) return;

      const width = containerRef.current.offsetWidth;
      const height = containerRef.current.offsetHeight;

      // Skip if container has no dimensions yet
      if (width === 0 || height === 0) {
        // Retry after a short delay
        setTimeout(createLandMask, 100);
        return;
      }

      maskCanvas.width = width;
      maskCanvas.height = height;

      const ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // Find the SVG inside the mask map
      const svg = maskMap.querySelector('svg');
      if (!svg) return;

      // Clone and modify SVG for mask
      const svgClone = svg.cloneNode(true) as SVGSVGElement;
      svgClone.setAttribute('width', String(width));
      svgClone.setAttribute('height', String(height));

      // Make all paths white on black for clear land detection
      const paths = svgClone.querySelectorAll('path');
      paths.forEach(path => {
        path.setAttribute('fill', '#FFFFFF');
        path.setAttribute('stroke', '#FFFFFF');
      });

      const svgData = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        setLandMask(imageData);
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        console.error('Failed to load land mask image');
        URL.revokeObjectURL(url);
      };
      img.src = url;
    };

    // Delay to ensure SVG is rendered
    const timer = setTimeout(createLandMask, 1000);
    window.addEventListener('resize', createLandMask);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', createLandMask);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    // Convert lat/lng to canvas coordinates matching the map's projection
    const latLngToCanvas = (lat: number, lng: number): { x: number; y: number } => {
      // Match the map's d3 geoEquirectangular projection
      // Use current zoom level and center from refs
      const currentZoom = zoomRef.current;
      const currentCenter = centerRef.current;
      const pixelsPerDegree = (MAP_SCALE * currentZoom) * (Math.PI / 180);

      // Convert to SVG coordinates using current center
      const svgX = (SVG_WIDTH / 2) + (lng - currentCenter[0]) * pixelsPerDegree;
      const svgY = (SVG_HEIGHT / 2) - (lat - currentCenter[1]) * pixelsPerDegree;

      // Convert SVG coords to canvas coords (accounting for aspect ratio)
      const containerAspect = canvas.width / canvas.height;

      let canvasX, canvasY;
      if (containerAspect > SVG_ASPECT) {
        // Container wider - SVG fitted to height
        const scale = canvas.height / SVG_HEIGHT;
        const offsetX = (canvas.width - SVG_WIDTH * scale) / 2;
        canvasX = offsetX + svgX * scale;
        canvasY = svgY * scale;
      } else {
        // Container taller - SVG fitted to width
        const scale = canvas.width / SVG_WIDTH;
        const offsetY = (canvas.height - SVG_HEIGHT * scale) / 2;
        canvasX = svgX * scale;
        canvasY = offsetY + svgY * scale;
      }

      return { x: canvasX, y: canvasY };
    };

    class Particle {
      lat: number;  // Store geographic coordinates
      lng: number;
      x: number;    // Canvas coordinates (recalculated each frame)
      y: number;
      color: string;
      size: number;
      baseSize: number;
      alpha: number;
      maxAlpha: number;
      twinkleSpeed: number;
      twinklePhase: number;
      life: number;
      maxLife: number;
      isCelebration: boolean;
      glowIntensity: number;
      pulsePhase: number;
      weatherConditions: WeatherCondition[]; // Now supports multiple conditions
      weatherRingPhases: number[]; // Separate phase for each condition

      constructor(lat: number, lng: number, color: string, isCelebration: boolean = false, celebrationIntensity: number = 0, weatherConditions: WeatherCondition[] = []) {
        this.lat = lat;
        this.lng = lng;
        // Initialize canvas position (will be updated each frame)
        const pos = latLngToCanvas(lat, lng);
        this.x = pos.x;
        this.y = pos.y;
        this.color = color;
        this.isCelebration = isCelebration;
        this.weatherConditions = weatherConditions;
        // Initialize phases for each condition (staggered for visual interest)
        this.weatherRingPhases = weatherConditions.map((_, i) =>
          (Math.random() * Math.PI * 2) + (i * Math.PI * 0.5)
        );

        if (isCelebration) {
          // Celebration particles: larger, brighter, longer-lasting
          this.baseSize = (Math.random() * 3 + 2) * (1 + celebrationIntensity * 0.5);
          this.maxAlpha = Math.min(1, (Math.random() * 0.5 + 0.5) * (1 + celebrationIntensity * 0.3));
          this.glowIntensity = 15 + celebrationIntensity * 10;
          this.maxLife = 120 + Math.floor(Math.random() * 80);
        } else {
          // Normal sparkles - visible and animated
          this.baseSize = Math.random() * 2.5 + 1.5; // Slightly larger: 1.5-4
          this.maxAlpha = Math.random() * 0.5 + 0.5; // Brighter: 0.5-1.0
          this.glowIntensity = 12; // More glow
          this.maxLife = 150 + Math.floor(Math.random() * 150);
        }

        this.size = this.baseSize;
        this.alpha = 0;
        this.twinkleSpeed = Math.random() * 0.12 + 0.06; // Faster: 0.06-0.18 for noticeable twinkling
        this.twinklePhase = Math.random() * Math.PI * 2;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.life = 0;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = this.alpha;

        const s = this.size;
        ctx.translate(this.x, this.y);

        // Draw weather alert pulsing rings FIRST (behind the sparkle)
        // Each condition gets its own ring set at different radii
        if (this.weatherConditions.length > 0) {
          // Base radius increases for each additional condition (concentric)
          const radiusStep = 12; // Spacing between condition ring sets

          this.weatherConditions.forEach((condition, condIndex) => {
            if (!condition) return;

            const ringColor = getWeatherConditionColor(condition);
            const baseRadius = 8 + (condIndex * radiusStep); // Inner conditions closer, outer farther
            const ringPhase = this.weatherRingPhases[condIndex] || 0;

            // Draw 3 expanding rings for this condition
            for (let i = 0; i < 3; i++) {
              const phase = (ringPhase + i * (Math.PI * 2 / 3)) % (Math.PI * 2);
              const ringProgress = phase / (Math.PI * 2); // 0 to 1
              const ringRadius = baseRadius + ringProgress * 18; // Expand outward
              const ringAlpha = (1 - ringProgress) * 0.5; // Fade out as it expands

              ctx.beginPath();
              ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
              ctx.strokeStyle = ringColor;
              ctx.lineWidth = 2 - ringProgress; // Thinner as it expands
              ctx.globalAlpha = ringAlpha * this.alpha;
              ctx.stroke();
            }
          });
          ctx.globalAlpha = this.alpha;
        }

        // Outer glow - stronger for celebration
        ctx.shadowBlur = this.glowIntensity;
        ctx.shadowColor = this.color;

        // Draw 4-point star/diamond
        ctx.beginPath();
        ctx.moveTo(0, -s * 2);
        ctx.lineTo(s * 0.3, -s * 0.3);
        ctx.lineTo(s * 2, 0);
        ctx.lineTo(s * 0.3, s * 0.3);
        ctx.lineTo(0, s * 2);
        ctx.lineTo(-s * 0.3, s * 0.3);
        ctx.lineTo(-s * 2, 0);
        ctx.lineTo(-s * 0.3, -s * 0.3);
        ctx.closePath();

        ctx.fillStyle = this.color;
        ctx.fill();

        // Bright center - larger for celebration
        const centerSize = this.isCelebration ? s * 0.6 : s * 0.4;
        ctx.beginPath();
        ctx.arc(0, 0, centerSize, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Extra ring effect for celebration particles
        if (this.isCelebration && this.alpha > 0.5) {
          ctx.beginPath();
          ctx.arc(0, 0, s * 2.5, 0, Math.PI * 2);
          ctx.strokeStyle = this.color;
          ctx.lineWidth = 0.5;
          ctx.globalAlpha = this.alpha * 0.3;
          ctx.stroke();
        }

        ctx.restore();
      }

      // Update canvas position based on current zoom/center
      updatePosition() {
        const pos = latLngToCanvas(this.lat, this.lng);
        this.x = pos.x;
        this.y = pos.y;
      }

      update(): boolean {
        this.life++;

        // Update position for zoom/pan changes
        this.updatePosition();

        // Animate weather ring expansion for all conditions
        if (this.weatherConditions.length > 0) {
          for (let i = 0; i < this.weatherRingPhases.length; i++) {
            this.weatherRingPhases[i] += 0.08; // Speed of ring expansion
            if (this.weatherRingPhases[i] > Math.PI * 2) {
              this.weatherRingPhases[i] -= Math.PI * 2;
            }
          }
        }

        // Continuous twinkling - more dramatic brightness variation
        this.twinklePhase += this.twinkleSpeed;
        // Twinkle between 30% and 100% brightness for obvious animation
        const twinkle = 0.3 + 0.7 * ((Math.sin(this.twinklePhase) + 1) / 2);

        // Add secondary slower oscillation for more organic feel
        const slowPulse = 0.8 + 0.2 * Math.sin(this.twinklePhase * 0.3);

        if (this.isCelebration) {
          this.pulsePhase += 0.15;
          const pulse = 0.7 + 0.3 * Math.sin(this.pulsePhase * 3);
          this.alpha = this.maxAlpha * twinkle * pulse;
        } else {
          this.alpha = this.maxAlpha * twinkle * slowPulse;
        }

        // Also vary the size for more dynamic effect (pulsing)
        this.size = this.baseSize * (0.8 + 0.4 * ((Math.sin(this.twinklePhase * 0.7) + 1) / 2));

        // Always return true - sparkles never die, they respawn when needed
        return true;
      }
    }

    const handleResize = () => {
      if (containerRef.current && canvas) {
        canvas.width = containerRef.current.offsetWidth;
        canvas.height = containerRef.current.offsetHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const render = () => {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get current celebration state
      const currentIntensity = celebrationIntensityRef.current;
      const celebratingOffset = newestTimezoneOffsetRef.current;

      // Sparkles at airport locations - ALL airports sparkle simultaneously
      const airports = getAirports();

      // Track which airports have active sparkles
      const airportHasSparkle = new Set<number>();
      for (const p of particles) {
        if ((p as any).airportIndex !== undefined) {
          airportHasSparkle.add((p as any).airportIndex);
        }
      }

      if (allCelebratedRef.current) {
        // After all celebrated: ensure ALL airports have a sparkle
        airports.forEach((airport, index) => {
          if (!airportHasSparkle.has(index)) {
            const sparkleColor = getTemperatureColor(airport.lat, airport.lng);
            const conditions = getAirportConditions(airport.icao);
            const particle = new Particle(airport.lat, airport.lng, sparkleColor, false, 0, conditions);
            (particle as any).airportIndex = index;
            // Stagger the start so they don't all twinkle in sync
            particle.life = Math.floor(Math.random() * particle.maxLife * 0.8);
            particles.push(particle);
          }
        });
      } else {
        // During countdown: ensure all airports in past timezones have sparkles
        const pastOffsets = new Set(pastTimezonesRef.current.map(tz => tz.offset));

        airports.forEach((airport, index) => {
          const approxOffset = Math.round(airport.lng / 15);
          const isInPastTimezone = pastOffsets.has(approxOffset) || pastOffsets.has(approxOffset + 1) || pastOffsets.has(approxOffset - 1);

          if (isInPastTimezone && !airportHasSparkle.has(index)) {
            const isCelebrating = celebratingOffset !== null && currentIntensity > 0 &&
              Math.abs(approxOffset - celebratingOffset) <= 1;
            const sparkleColor = getTemperatureColor(airport.lat, airport.lng);
            const conditions = getAirportConditions(airport.icao);
            const particle = new Particle(airport.lat, airport.lng, sparkleColor, isCelebrating, currentIntensity, conditions);
            (particle as any).airportIndex = index;
            // Stagger the start so they don't all twinkle in sync
            particle.life = Math.floor(Math.random() * particle.maxLife * 0.8);
            particles.push(particle);
          }
        });
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const alive = p.update();
        if (alive) {
          p.draw(ctx);
        } else {
          particles.splice(i, 1);
        }
      }

      // Draw lightning strikes
      const currentStrikes = lightningStrikesRef.current;
      for (const strike of currentStrikes) {
        const strikePos = latLngToCanvas(strike.lat, strike.lon);
        const ageRatio = strike.age / 60000; // 0 to 1 over 60 seconds
        const alpha = Math.max(0, 1 - ageRatio); // Fade out over time

        if (alpha > 0) {
          ctx.save();
          ctx.translate(strikePos.x, strikePos.y);

          // Flash effect - bright burst that fades quickly
          const flashAlpha = strike.age < 500 ? (1 - strike.age / 500) * 0.8 : 0;
          if (flashAlpha > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, 20 + (1 - flashAlpha) * 30, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.5})`;
            ctx.fill();
          }

          // Lightning bolt icon
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = '#ffff00';
          ctx.fillStyle = '#ffff00';
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ffff00';
          ctx.lineWidth = 2;

          // Simple bolt shape
          ctx.beginPath();
          ctx.moveTo(2, -8);
          ctx.lineTo(-2, -2);
          ctx.lineTo(1, -2);
          ctx.lineTo(-3, 8);
          ctx.lineTo(1, 0);
          ctx.lineTo(-1, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Small glow circle
          ctx.beginPath();
          ctx.arc(0, 0, 4 + (1 - ageRatio) * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 100, ${alpha * 0.3})`;
          ctx.fill();

          ctx.restore();
        }
      }

      // Draw ISS (International Space Station) - use interpolated position for smooth animation
      const iss = getInterpolatedISSPosition();
      if (iss) {
        const issPos = latLngToCanvas(iss.lat, iss.lng);
        // Update ref for hover detection
        issPositionRef.current = iss;
        issCanvasPosRef.current = issPos;

        ctx.save();
        ctx.translate(issPos.x, issPos.y);

        // Orbital trail effect - fading dots behind the ISS
        const trailLength = 8;
        for (let i = trailLength; i > 0; i--) {
          const trailAlpha = (1 - i / trailLength) * 0.3;
          const trailOffset = i * 3;
          ctx.beginPath();
          ctx.arc(-trailOffset, 0, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 220, 255, ${trailAlpha})`;
          ctx.fill();
        }

        // Outer glow ring (pulsing)
        const pulsePhase = (Date.now() % 2000) / 2000;
        const pulseSize = 12 + Math.sin(pulsePhase * Math.PI * 2) * 3;
        ctx.beginPath();
        ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(200, 220, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // ISS body - simplified station shape
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(200, 220, 255, 0.8)';

        // Solar panels (horizontal bars)
        ctx.fillStyle = 'rgba(100, 140, 200, 0.9)';
        ctx.fillRect(-10, -1.5, 20, 3);

        // Main module (center)
        ctx.fillStyle = 'rgba(220, 230, 255, 0.95)';
        ctx.fillRect(-3, -2.5, 6, 5);

        // Bright center dot
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Clear plane positions for this frame
      planePositionsRef.current.clear();

      // Draw all tracked flights
      for (const [callsign, flight] of liveFlightsRef.current) {
        if (!flight.position) continue; // Skip flights without position data

        const isLive = flight.status === 'In Flight' && flight.position !== null;
        const hasKnownRoute = flight.origin.lat !== 0 && flight.destination.lat !== 0;

        // Get plane position
        const planeCanvasPos = latLngToCanvas(flight.position.latitude, flight.position.longitude);
        const bearing = flight.position.heading || 0;

        // Store plane position for hover detection
        planePositionsRef.current.set(callsign, { x: planeCanvasPos.x, y: planeCanvasPos.y, bearing });

        // Draw route line if we have origin/destination
        if (hasKnownRoute) {
          const originPos = latLngToCanvas(flight.origin.lat, flight.origin.lng);
          const destPos = latLngToCanvas(flight.destination.lat, flight.destination.lng);

          // Draw the full route as a subtle dashed line
          ctx.save();
          ctx.setLineDash([3, 6]);
          ctx.strokeStyle = isLive ? 'rgba(165, 180, 252, 0.25)' : 'rgba(165, 180, 252, 0.12)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(originPos.x, originPos.y);
          ctx.lineTo(destPos.x, destPos.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw the traveled path as subtle gradient line (only if in flight)
          if (isLive) {
            ctx.strokeStyle = 'rgba(199, 210, 254, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(165, 180, 252, 0.5)';
            ctx.beginPath();
            ctx.moveTo(originPos.x, originPos.y);
            ctx.lineTo(planeCanvasPos.x, planeCanvasPos.y);
            ctx.stroke();
            ctx.shadowBlur = 0;
          }

          // Draw origin marker
          ctx.fillStyle = 'rgba(199, 210, 254, 0.6)';
          ctx.beginPath();
          ctx.arc(originPos.x, originPos.y, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Draw destination marker
          ctx.strokeStyle = 'rgba(199, 210, 254, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(destPos.x, destPos.y, 3.5, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();
        }

        // Draw the plane icon
        ctx.save();
        ctx.translate(planeCanvasPos.x, planeCanvasPos.y);
        ctx.rotate((bearing - 90) * Math.PI / 180);

        const planeSize = 7;

        // Color based on alert status
        const hasAlert = flight.alertSeverity === 'critical' || flight.alertSeverity === 'warning';
        if (flight.alertSeverity === 'critical') {
          ctx.fillStyle = 'rgba(248, 113, 113, 0.9)'; // Red for critical
          ctx.shadowColor = '#ef4444';
        } else if (flight.alertSeverity === 'warning') {
          ctx.fillStyle = 'rgba(251, 191, 36, 0.9)'; // Amber for warning
          ctx.shadowColor = '#f59e0b';
        } else {
          ctx.fillStyle = isLive ? 'rgba(224, 231, 255, 0.9)' : 'rgba(165, 180, 252, 0.4)';
          ctx.shadowColor = '#ffc832';
        }
        ctx.shadowBlur = isLive ? 6 : 3;

        // Plane body
        ctx.beginPath();
        ctx.moveTo(planeSize * 1.5, 0);
        ctx.lineTo(-planeSize, -planeSize * 0.4);
        ctx.lineTo(-planeSize * 0.5, 0);
        ctx.lineTo(-planeSize, planeSize * 0.4);
        ctx.closePath();
        ctx.fill();

        // Wings
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-planeSize * 0.3, -planeSize * 1.2);
        ctx.lineTo(-planeSize * 0.6, 0);
        ctx.lineTo(-planeSize * 0.3, planeSize * 1.2);
        ctx.closePath();
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.moveTo(-planeSize * 0.8, 0);
        ctx.lineTo(-planeSize * 1.1, -planeSize * 0.6);
        ctx.lineTo(-planeSize, 0);
        ctx.lineTo(-planeSize * 1.1, planeSize * 0.6);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [landMask, metarReady, isFullscreen]); // isFullscreen triggers canvas resize when toggled

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Hidden canvas for land mask */}
      <canvas ref={maskCanvasRef} className="hidden" />

      {/* Hidden map for land mask detection */}
      <div id="land-mask-map" className="absolute inset-0 w-full h-full opacity-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <ComposableMap
          projection="geoEquirectangular"
          projectionConfig={{
            scale: BASE_SCALE * zoom,
            center: center
          }}
          style={{
            width: '110%',
            height: '110%',
            marginLeft: '-5%',
            marginTop: '-5%',
          }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#FFFFFF"
                  stroke="#FFFFFF"
                  strokeWidth={1}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* Vector World Map */}
      <div
        ref={mapContainerRef}
        className={`absolute inset-0 w-full h-full overflow-hidden ${isDragging ? 'cursor-grabbing' : targetZoom > 1 ? 'cursor-grab' : ''}`}
        onMouseMove={(e) => {
          handleMouseMove(e);
          handleDrag(e);
        }}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onMouseLeave={(e) => {
          handleCountryLeave();
          handleDragEnd();
        }}
        onWheel={handleWheel}
      >
        <ComposableMap
          projection="geoEquirectangular"
          projectionConfig={{
            scale: BASE_SCALE * zoom,
            center: center
          }}
          style={{
            width: '110%',
            height: '110%',
            marginLeft: '-5%',
            marginTop: '-5%',
            background: 'transparent',
          }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="rgba(99, 102, 241, 0.12)"
                  stroke="rgba(165, 180, 252, 0.25)"
                  strokeWidth={0.4}
                  onMouseEnter={(e) => handleCountryHover(geo, e)}
                  onMouseLeave={handleCountryLeave}
                  style={{
                    default: { outline: 'none', cursor: 'default' },
                    hover: {
                      outline: 'none',
                      fill: 'rgba(99, 102, 241, 0.25)',
                      cursor: 'default'
                    },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-40 flex flex-col gap-1">
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-2 bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-lg text-white/70 hover:text-white hover:bg-slate-800/80 transition-all mb-1"
            title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen (Shift+F)"}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        )}
        <button
          onClick={handleZoomIn}
          disabled={targetZoom >= MAX_ZOOM}
          className="p-2 bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-lg text-white/70 hover:text-white hover:bg-slate-800/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={handleZoomOut}
          disabled={targetZoom <= MIN_ZOOM}
          className="p-2 bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-lg text-white/70 hover:text-white hover:bg-slate-800/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
        {targetZoom > 1 && (
          <button
            onClick={handleResetView}
            className="p-2 bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-lg text-white/70 hover:text-white hover:bg-slate-800/80 transition-all"
            title="Reset view"
          >
            <Maximize2 size={16} />
          </button>
        )}
        {targetZoom > 1 && (
          <div className="px-2 py-1 bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-lg text-center">
            <span className="text-[10px] text-white/50">{zoom.toFixed(1)}x</span>
          </div>
        )}
      </div>

      {/* Hover Tooltip */}
      <div
        className={`fixed z-50 pointer-events-none transition-opacity duration-200 ease-out ${
          isTooltipVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          left: (hoverInfo?.x ?? 0) + 16,
          top: (hoverInfo?.y ?? 0) + 16,
        }}
      >
        {hoverInfo && (
          <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 shadow-2xl max-w-xs">
            {hoverInfo.country ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-widest text-indigo-300/60">
                    {hoverInfo.country.continent}
                  </span>
                </div>
                <h3 className="text-white font-medium text-sm mb-2">
                  {hoverInfo.country.name}
                </h3>
                {hoverInfo.airportInfo && (
                  <div className="border-t border-white/10 pt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase tracking-widest text-white/40">
                        Nearest Station
                      </span>
                      <span className="text-[10px] text-amber-300/80 font-medium">
                        {getLocalTime(hoverInfo.airportInfo.airport.lng)}
                      </span>
                    </div>
                    <p className="text-indigo-200 text-sm font-medium mb-1">
                      {hoverInfo.airportInfo.airport.name}
                    </p>
                    <p className="text-white/70 text-xs leading-relaxed">
                      {getTempDescription(hoverInfo.airportInfo.temp, unit, formatTemp)}
                    </p>
                    {hoverInfo.airportInfo.conditions.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1">
                        {hoverInfo.airportInfo.conditions.map((condition, idx) => condition && (
                          <div key={idx} className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full animate-pulse"
                              style={{ backgroundColor: getWeatherConditionColor(condition) }}
                            />
                            <span className="text-xs font-medium" style={{ color: getWeatherConditionColor(condition) }}>
                              {getWeatherConditionLabel(condition, idx === 0 ? hoverInfo.airportInfo.intensity : null)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : hoverInfo.airportInfo && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-widest text-cyan-300/60">
                    Island / Coastal
                  </span>
                  <span className="text-[10px] text-amber-300/80 font-medium">
                    {getLocalTime(hoverInfo.airportInfo.airport.lng)}
                  </span>
                </div>
                <p className="text-indigo-200 text-sm font-medium mb-1">
                  {hoverInfo.airportInfo.airport.name}
                </p>
                <p className="text-white/70 text-xs leading-relaxed">
                  {getTempDescription(hoverInfo.airportInfo.temp, unit, formatTemp)}
                </p>
                {hoverInfo.airportInfo.conditions.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {hoverInfo.airportInfo.conditions.map((condition, idx) => condition && (
                      <div key={idx} className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full animate-pulse"
                          style={{ backgroundColor: getWeatherConditionColor(condition) }}
                        />
                        <span className="text-xs font-medium" style={{ color: getWeatherConditionColor(condition) }}>
                          {getWeatherConditionLabel(condition, idx === 0 ? hoverInfo.airportInfo.intensity : null)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Flight Tooltip */}
      <div
        className={`fixed z-50 pointer-events-none transition-opacity duration-200 ease-out ${
          isFlightTooltipVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          left: Math.min(Math.max(10, (flightHoverInfo?.x ?? 0) + 25), window.innerWidth - 320),
          top: (() => {
            const cursorY = flightHoverInfo?.y ?? 0;
            const tooltipHeight = 480;
            const margin = 30;
            const spaceBelow = window.innerHeight - cursorY - margin;
            const spaceAbove = cursorY - margin;

            // Prefer below cursor, but use above if not enough space
            if (spaceBelow >= tooltipHeight) {
              return cursorY + margin;
            } else if (spaceAbove >= tooltipHeight) {
              return cursorY - tooltipHeight - margin;
            } else {
              // Not enough space either way - clamp to screen
              return Math.max(10, Math.min(cursorY - tooltipHeight / 2, window.innerHeight - tooltipHeight - 10));
            }
          })(),
        }}
      >
        {flightHoverInfo && (
          <div className="bg-slate-900/95 backdrop-blur-md border border-amber-400/30 rounded-xl px-4 py-3 shadow-2xl min-w-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-lg">{flightHoverInfo.flight.flightNumber}</span>
                <span className="text-white/60 text-sm">{flightHoverInfo.flight.airline}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  flightHoverInfo.flight.status === 'In Flight'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : flightHoverInfo.flight.status === 'Landed'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {flightHoverInfo.flight.status}
                </span>
              </div>
            </div>

            {/* Live tracking source */}
            {flightHoverInfo.flight.position?.source && (
              <div className="text-[10px] text-cyan-400/70 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                {(() => {
                  const source = flightHoverInfo.flight.position.source;
                  if (source === 'adsb.fi') return 'Live from volunteer radar network in Finland';
                  if (source === 'ADSB.lol') return 'Live from community flight trackers';
                  if (source === 'airplanes.live') return 'Live from global volunteer network';
                  if (source === 'OpenSky') return 'Live from OpenSky research network';
                  return `Live tracking active`;
                })()}
              </div>
            )}

            {/* Route - only show if we have route info */}
            {flightHoverInfo.flight.origin.icao && flightHoverInfo.flight.destination.icao && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-center">
                    <p className="text-white font-medium text-sm">{flightHoverInfo.flight.origin.icao}</p>
                    <p className="text-white/50 text-[10px]">{flightHoverInfo.flight.origin.name}</p>
                  </div>
                  <div className="flex-1 flex items-center gap-1 px-2">
                    <div className="h-px flex-1 bg-amber-400/30"></div>
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                    </svg>
                    <div className="h-px flex-1 bg-amber-400/30"></div>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium text-sm">{flightHoverInfo.flight.destination.icao}</p>
                    <p className="text-white/50 text-[10px]">{flightHoverInfo.flight.destination.name}</p>
                  </div>
                </div>

                {/* Progress bar - only show if progress is valid (not -1) */}
                {flightHoverInfo.progress >= 0 ? (
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-white/50 mb-1">
                      <span>{flightHoverInfo.flight.departureTime || ''}</span>
                      <span>{Math.round(flightHoverInfo.progress * 100)}% Complete</span>
                      <span>{flightHoverInfo.flight.arrivalTime || ''}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                        style={{ width: `${flightHoverInfo.progress * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mb-3 text-[10px] text-amber-400/60 text-center">
                    Route may differ from scheduled
                  </div>
                )}

                {/* Flight details - only with route */}
                {(flightHoverInfo.flight.aircraft || flightHoverInfo.flight.duration || flightHoverInfo.flight.distance) && (
                  <div className="grid grid-cols-3 gap-2 text-center border-t border-white/10 pt-2 mb-3">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase">Aircraft</p>
                      <p className="text-white/80 text-xs">{flightHoverInfo.flight.aircraft || '--'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase">Duration</p>
                      <p className="text-white/80 text-xs">{flightHoverInfo.flight.duration || '--'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase">Distance</p>
                      <p className="text-white/80 text-xs">{flightHoverInfo.flight.distance || '--'}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Live flight data (altitude, speed, heading/distance) */}
            {flightHoverInfo.flight.position && (
              <>
                <div className="grid grid-cols-3 gap-2 text-center border-t border-cyan-400/20 pt-2 mb-3">
                  <div>
                    <p className="text-[10px] text-cyan-400/60 uppercase">Altitude</p>
                    <p className="text-cyan-300 text-xs font-medium">
                      {Math.round(flightHoverInfo.flight.position.altitude * 3.28084).toLocaleString()} ft
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-cyan-400/60 uppercase">Speed</p>
                    <p className="text-cyan-300 text-xs font-medium">
                      {Math.round(flightHoverInfo.flight.position.velocity * 1.944)} kts
                    </p>
                  </div>
                  <div>
                    {flightHoverInfo.flight.origin.lat !== 0 ? (
                      <>
                        <p className="text-[10px] text-cyan-400/60 uppercase">Flown</p>
                        <p className="text-cyan-300 text-xs font-medium">
                          {Math.round(calculateDistanceFlown(flightHoverInfo.flight)).toLocaleString()} km
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[10px] text-cyan-400/60 uppercase">Heading</p>
                        <p className="text-cyan-300 text-xs font-medium">
                          {Math.round(flightHoverInfo.flight.position.heading)}°
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Transponder squawk code */}
                {(() => {
                  const squawkStatus = formatSquawkStatus(flightHoverInfo.flight);
                  const isEmergency = squawkStatus.status === 'critical' || squawkStatus.status === 'warning';
                  const isInfo = squawkStatus.status === 'info';
                  return (
                    <div className={`rounded-lg mb-3 ${
                      squawkStatus.status === 'critical' ? 'bg-red-500/20 border border-red-500/40' :
                      squawkStatus.status === 'warning' ? 'bg-amber-500/20 border border-amber-500/40' :
                      squawkStatus.status === 'info' ? 'bg-blue-500/10 border border-blue-500/20' :
                      'bg-slate-700/30'
                    }`}>
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-white/50 uppercase">Squawk</span>
                          <span className={`font-mono font-bold text-sm ${
                            squawkStatus.status === 'critical' ? 'text-red-400' :
                            squawkStatus.status === 'warning' ? 'text-amber-400' :
                            squawkStatus.status === 'info' ? 'text-blue-300' :
                            'text-white/80'
                          }`}>
                            {squawkStatus.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isEmergency && (
                            <span className={`w-2 h-2 rounded-full animate-pulse ${
                              squawkStatus.status === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                            }`}></span>
                          )}
                          {isInfo && (
                            <span className="w-2 h-2 rounded-full bg-blue-400/50"></span>
                          )}
                          <span className={`text-[10px] font-medium ${
                            squawkStatus.status === 'critical' ? 'text-red-400' :
                            squawkStatus.status === 'warning' ? 'text-amber-400' :
                            squawkStatus.status === 'info' ? 'text-blue-300' :
                            'text-white/50'
                          }`}>
                            {squawkStatus.label}
                          </span>
                        </div>
                      </div>
                      {/* Show description for non-normal codes */}
                      {(isEmergency || isInfo) && (
                        <div className={`px-2 pb-1.5 text-[9px] ${
                          squawkStatus.status === 'critical' ? 'text-red-300/70' :
                          squawkStatus.status === 'warning' ? 'text-amber-300/70' :
                          'text-blue-200/60'
                        }`}>
                          {squawkStatus.description}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}

            {/* Flight Attendant - only show if set */}
            {flightHoverInfo.flight.flightAttendant && (
              <div className="border-t border-white/10 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-pink-300/60 uppercase tracking-wider">Flight Attendant</span>
                </div>
                <p className="text-pink-300 font-medium text-sm mt-0.5">{flightHoverInfo.flight.flightAttendant}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ISS Tooltip */}
      <div
        className={`fixed z-50 pointer-events-none transition-opacity duration-200 ease-out ${
          isIssTooltipVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          left: (issHoverInfo?.x ?? 0) + 16,
          top: (issHoverInfo?.y ?? 0) + 16,
        }}
      >
        {issPosition && (
          <div className="bg-slate-900/95 backdrop-blur-md border border-indigo-400/30 rounded-xl px-4 py-3 shadow-2xl min-w-[220px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-400/50 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-pulse"></div>
                </div>
                <span className="text-white font-medium">ISS</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full">
                Live
              </span>
            </div>

            {/* Station name */}
            <p className="text-white/60 text-xs mb-3">International Space Station</p>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 text-center border-t border-indigo-400/20 pt-3">
              <div>
                <p className="text-[10px] text-indigo-300/60 uppercase">Altitude</p>
                <p className="text-indigo-200 text-sm font-medium">{formatAltitude(issPosition.altitude)}</p>
              </div>
              <div>
                <p className="text-[10px] text-indigo-300/60 uppercase">Velocity</p>
                <p className="text-indigo-200 text-sm font-medium">{formatVelocity(issPosition.velocity)}</p>
              </div>
            </div>

            {/* Position */}
            <div className="grid grid-cols-2 gap-3 text-center border-t border-indigo-400/20 pt-3 mt-3">
              <div>
                <p className="text-[10px] text-white/40 uppercase">Latitude</p>
                <p className="text-white/70 text-xs">{issPosition.lat.toFixed(2)}°</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase">Longitude</p>
                <p className="text-white/70 text-xs">{issPosition.lng.toFixed(2)}°</p>
              </div>
            </div>

            {/* Visibility status */}
            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-center gap-2">
              <div className={`w-2 h-2 rounded-full ${issPosition.visibility === 'daylight' ? 'bg-yellow-400' : 'bg-slate-500'}`}></div>
              <span className="text-[10px] text-white/50 uppercase tracking-wider">
                {issPosition.visibility === 'daylight' ? 'In Sunlight' : 'In Earth\'s Shadow'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(WorldMap);
