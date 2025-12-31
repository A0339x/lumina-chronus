import React, { useEffect, useRef } from "react";
import createGlobe from "cobe";
import { FireworkEvent } from "../types";

interface Globe3DProps {
  fireworks: FireworkEvent[];
}

const Globe3D: React.FC<Globe3DProps> = ({ fireworks }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;
    let width = 0;
    
    // Internal tracking of firework animations for the render loop
    // Each element: { ...FireworkEvent, size: number, opacity: number }
    const activeMarkers: any[] = [];

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
      }
    };
    window.addEventListener('resize', onResize);
    onResize();

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.1, 0.1, 0.2], // Dark Blue-ish base
      markerColor: [1, 1, 1],
      glowColor: [0.3, 0.3, 0.5],
      markers: [],
      onRender: (state) => {
        // Rotate globe
        state.phi = phi;
        phi += 0.002;

        // Process fireworks animations
        // We sync the props `fireworks` with our internal `activeMarkers`
        // New fireworks from props
        fireworks.forEach(fw => {
            if (!activeMarkers.find(m => m.id === fw.id)) {
                activeMarkers.push({
                    location: [fw.lat, fw.lng],
                    size: 0,
                    color: fw.color,
                    maxSize: 0.08 + Math.random() * 0.04,
                    id: fw.id,
                    age: 0
                });
            }
        });

        // Update markers
        const updatedMarkers = activeMarkers.map(m => {
            m.age += 0.01;
            m.size = Math.sin(m.age * Math.PI) * m.maxSize; // Grow then shrink
            return {
                location: m.location,
                size: Math.max(0, m.size),
                color: m.color
            };
        }).filter(m => m.size > 0.001); // Remove finished

        // Update active markers list (cleanup old ones logic in pure JS array for next frame)
        // Note: mutation of local array `activeMarkers` inside render loop is tricky. 
        // We act on the array in place.
        for (let i = activeMarkers.length - 1; i >= 0; i--) {
            if (activeMarkers[i].age > 1) { // End of animation
                activeMarkers.splice(i, 1);
            }
        }

        state.markers = updatedMarkers;
      },
    });

    return () => {
      globe.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, [fireworks]);

  return (
    <div className="w-full h-full opacity-90 relative">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
};

export default Globe3D;