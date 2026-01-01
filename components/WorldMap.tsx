import React, { useEffect, useRef, memo, useState, useCallback } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { FireworkEvent, TimezoneData } from '../types';
import { fetchAllMetar, getTempWithFallback, isMetarCacheReady, getNearestAirportInfo, NearestAirportInfo } from '../services/metarService';
import { getCountryInfo, CountryInfo } from '../services/countryData';
import { useTemperature } from '../contexts/TemperatureContext';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Convert temperature (Celsius) to color
// Range: -40°C (blue) to +40°C (red)
const tempToColor = (tempC: number): string => {
  // Clamp to -40 to +40 range
  tempC = Math.max(-40, Math.min(40, tempC));

  // Normalize to 0-1 range (-40C = 0, +40C = 1)
  const temp = (tempC + 40) / 80;

  // Color gradient: Blue (cold) -> Cyan -> Green -> Yellow -> Orange -> Red (hot)
  let r, g, b;

  if (temp < 0.2) {
    // Very cold (-40 to -24): Blue to Cyan
    const t = temp / 0.2;
    r = Math.floor(100 * t);
    g = Math.floor(150 + 105 * t);
    b = 255;
  } else if (temp < 0.4) {
    // Cold (-24 to -8): Cyan to Green
    const t = (temp - 0.2) / 0.2;
    r = Math.floor(100 - 100 * t);
    g = 255;
    b = Math.floor(255 - 155 * t);
  } else if (temp < 0.6) {
    // Cool (-8 to +8): Green to Yellow
    const t = (temp - 0.4) / 0.2;
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

interface WorldMapProps {
  activeFireworks: FireworkEvent[];
  pastTimezones: TimezoneData[];
  devCelebrationOffset?: number | null; // For testing: trigger celebration on this offset
  devTrigger?: number; // Increment to re-trigger celebration
  allCelebrated?: boolean; // When true, sparkle the entire globe
}

interface HoverInfo {
  country: CountryInfo;
  airportInfo: NearestAirportInfo | null;
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

// Convert screen coordinates to lat/lng based on equirectangular projection
const screenToLatLng = (
  screenX: number,
  screenY: number,
  containerWidth: number,
  containerHeight: number
): { lat: number; lng: number } => {
  // The SVG is stretched to fill the container (width: 100%, height: 100%)
  // First convert screen coords to SVG internal coords
  const svgX = (screenX / containerWidth) * SVG_WIDTH;
  const svgY = (screenY / containerHeight) * SVG_HEIGHT;

  // For d3 geoEquirectangular projection:
  // scale = pixels per radian, so pixels per degree = scale * (π/180)
  const pixelsPerDegree = MAP_SCALE * (Math.PI / 180);

  // SVG center corresponds to map center [0, 20]
  const svgCenterX = SVG_WIDTH / 2;
  const svgCenterY = SVG_HEIGHT / 2;

  // Convert SVG coords to lat/lng
  const lng = MAP_CENTER_LNG + (svgX - svgCenterX) / pixelsPerDegree;
  const lat = MAP_CENTER_LAT - (svgY - svgCenterY) / pixelsPerDegree;

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

const WorldMap: React.FC<WorldMapProps> = ({ activeFireworks, pastTimezones, devCelebrationOffset, devTrigger, allCelebrated }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [landMask, setLandMask] = useState<ImageData | null>(null);
  const [metarReady, setMetarReady] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [currentCountry, setCurrentCountry] = useState<CountryInfo | null>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track newest timezone for celebration effect (using refs to avoid restarting animation loop)
  const newestTimezoneOffsetRef = useRef<number | null>(null);
  const celebrationIntensityRef = useRef(0);
  const previousTimezonesRef = useRef<Set<number>>(new Set());
  const devCelebrationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const celebrationIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        const { lat, lng } = screenToLatLng(localX, localY, rect.width, rect.height);
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

  // Update tooltip position and airport info on mouse move within country
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (currentCountry && mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      const { lat, lng } = screenToLatLng(localX, localY, rect.width, rect.height);
      const airportInfo = getNearestAirportInfo(lat, lng);

      setHoverInfo({
        country: currentCountry,
        airportInfo,
        x: event.clientX,
        y: event.clientY
      });
    }
  }, [currentCountry]);

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

    // Check if a pixel position is on land
    const isOnLand = (x: number, y: number): boolean => {
      if (!landMask) return false; // Don't show sparkles until mask is ready
      const px = Math.floor(x);
      const py = Math.floor(y);
      if (px < 0 || px >= landMask.width || py < 0 || py >= landMask.height) return false;
      const idx = (py * landMask.width + px) * 4;
      // Check if pixel is white (land) - R channel > 100 means land
      return landMask.data[idx] > 100;
    };

    // Convert longitude to x position, accounting for date line crossing
    const lngToX = (lng: number, width: number, tzOffset?: number): number => {
      let adjustedLng = lng;
      if (tzOffset !== undefined && tzOffset >= 12 && lng < 0) {
        adjustedLng = lng + 360;
      }
      return (adjustedLng + 180) * (width / 360);
    };

    class Particle {
      x: number;
      y: number;
      color: string;
      size: number;
      alpha: number;
      maxAlpha: number;
      twinkleSpeed: number;
      twinklePhase: number;
      life: number;
      maxLife: number;
      isCelebration: boolean;
      glowIntensity: number;
      pulsePhase: number;

      constructor(x: number, y: number, color: string, isCelebration: boolean = false, celebrationIntensity: number = 0) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.isCelebration = isCelebration;

        if (isCelebration) {
          // Celebration particles: larger, brighter, longer-lasting
          this.size = (Math.random() * 3 + 2) * (1 + celebrationIntensity * 0.5);
          this.maxAlpha = Math.min(1, (Math.random() * 0.5 + 0.5) * (1 + celebrationIntensity * 0.3));
          this.glowIntensity = 15 + celebrationIntensity * 10;
          this.maxLife = 90 + Math.floor(Math.random() * 60);
        } else {
          // Normal sparkles
          this.size = Math.random() * 2 + 1;
          this.maxAlpha = Math.random() * 0.7 + 0.3;
          this.glowIntensity = 8;
          this.maxLife = 60 + Math.floor(Math.random() * 90);
        }

        this.alpha = 0;
        this.twinkleSpeed = Math.random() * 0.15 + 0.05;
        this.twinklePhase = Math.random() * Math.PI * 2;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.life = 0;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = this.alpha;

        const s = this.size;
        ctx.translate(this.x, this.y);

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

      update(): boolean {
        this.life++;

        const lifeRatio = this.life / this.maxLife;

        if (lifeRatio < 0.15) {
          // Faster fade in for celebration
          this.alpha = (lifeRatio / 0.15) * this.maxAlpha;
        } else if (lifeRatio > 0.7) {
          this.alpha = ((1 - lifeRatio) / 0.3) * this.maxAlpha;
        } else {
          this.twinklePhase += this.twinkleSpeed;
          const twinkle = 0.6 + 0.4 * Math.sin(this.twinklePhase);

          if (this.isCelebration) {
            // Celebration particles pulse more dramatically
            this.pulsePhase += 0.1;
            const pulse = 0.8 + 0.2 * Math.sin(this.pulsePhase * 3);
            this.alpha = this.maxAlpha * twinkle * pulse;
          } else {
            this.alpha = this.maxAlpha * twinkle;
          }
        }

        return this.life < this.maxLife;
      }
    }

    const addSparkleOnLand = (x: number, y: number, lat: number, lng: number, isCelebration: boolean = false, intensity: number = 0): boolean => {
      if (!isOnLand(x, y)) return false;
      const sparkleColor = getTemperatureColor(lat, lng);
      particles.push(new Particle(x, y, sparkleColor, isCelebration, intensity));
      return true;
    };

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

      // Helper to generate sparkles for a timezone offset
      const generateSparklesForOffset = (offset: number, isCelebrating: boolean) => {
        const spawnChance = isCelebrating ? 0.5 - (currentIntensity * 0.3) : 0.85;
        const spawnCount = isCelebrating ? Math.ceil(currentIntensity * 3) : 1;

        for (let i = 0; i < spawnCount; i++) {
          if (Math.random() > spawnChance) {
            const centerLng = getTimezoneLongitude(offset);
            const lngVariation = (Math.random() - 0.5) * 15;
            const sparkLng = centerLng + lngVariation;
            const sparkLat = Math.random() * 130 - 60;
            const x = lngToX(sparkLng, canvas.width, offset);
            const y = ((-1 * sparkLat) + 90) * (canvas.height / 180);
            addSparkleOnLand(x, y, sparkLat, sparkLng, isCelebrating, currentIntensity);
          }
        }
      };

      // When all timezones have celebrated, sparkle the entire globe
      if (allCelebrated) {
        // Generate sparkles across all longitudes - don't require land mask
        for (let i = 0; i < 3; i++) {
          if (Math.random() > 0.7) {
            const sparkLng = Math.random() * 360 - 180; // Full longitude range
            const sparkLat = Math.random() * 130 - 60;
            const x = (sparkLng + 180) * (canvas.width / 360);
            const y = ((-1 * sparkLat) + 90) * (canvas.height / 180);
            // Try land check, but if mask isn't ready, show anyway
            if (landMask) {
              addSparkleOnLand(x, y, sparkLat, sparkLng, false, 0);
            } else {
              // No land mask yet - just add sparkle
              const sparkleColor = getTemperatureColor(sparkLat, sparkLng);
              particles.push(new Particle(x, y, sparkleColor, false, 0));
            }
          }
        }
      } else {
        // For each past timezone, generate sparkles in vertical bands on land
        pastTimezones.forEach(tz => {
          const isCelebrating = tz.offset === celebratingOffset && currentIntensity > 0;
          generateSparklesForOffset(tz.offset, isCelebrating);
        });

        // Dev mode: also generate celebration sparkles for the celebrating offset even if not in pastTimezones
        if (celebratingOffset !== null && currentIntensity > 0) {
          const isAlreadyInPast = pastTimezones.some(tz => tz.offset === celebratingOffset);
          if (!isAlreadyInPast) {
            generateSparklesForOffset(celebratingOffset, true);
          }
        }
      }

      // Active fireworks (current timezone hitting midnight)
      activeFireworks.forEach(fw => {
        if (Math.random() > 0.5) {
          const x = lngToX(fw.lng, canvas.width);
          const y = ((-1 * fw.lat) + 90) * (canvas.height / 180);
          addSparkleOnLand(x, y, fw.lat, fw.lng, true, 1);
        }
      });

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

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeFireworks, pastTimezones, landMask, metarReady, allCelebrated]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Hidden canvas for land mask */}
      <canvas ref={maskCanvasRef} className="hidden" />

      {/* Hidden map for land mask detection */}
      <div id="land-mask-map" className="absolute inset-0 w-full h-full opacity-0 pointer-events-none" aria-hidden="true">
        <ComposableMap
          projection="geoEquirectangular"
          projectionConfig={{
            scale: 220,
            center: [0, 20]
          }}
          style={{
            width: '100%',
            height: '100%',
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
        className="absolute inset-0 w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleCountryLeave}
      >
        <ComposableMap
          projection="geoEquirectangular"
          projectionConfig={{
            scale: 220,
            center: [0, 20]
          }}
          style={{
            width: '100%',
            height: '100%',
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
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-widest text-white/40">
                    Nearest Station
                  </span>
                </div>
                <p className="text-indigo-200 text-sm font-medium mb-1">
                  {hoverInfo.airportInfo.airport.name}
                </p>
                <p className="text-white/70 text-xs leading-relaxed">
                  {getTempDescription(hoverInfo.airportInfo.temp, unit, formatTemp)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(WorldMap);
