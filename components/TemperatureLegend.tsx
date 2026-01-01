import React from 'react';
import { useTemperature } from '../contexts/TemperatureContext';

const TemperatureLegend: React.FC = () => {
  const { unit, toggleUnit, convertTemp } = useTemperature();

  // Temperature values in Celsius
  const temps = [-40, -20, 0, 20, 40];
  // Violet -> Blue -> Cyan -> Green -> Yellow -> Orange -> Red
  const colors = ['#b432ff', '#0096ff', '#00ffff', '#ffff00', '#ff3700'];

  return (
    <div className="flex items-center gap-2">
      {/* C/F Toggle */}
      <button
        onClick={toggleUnit}
        className="flex items-center bg-white/10 rounded-full p-0.5 border border-white/20 hover:border-white/30 transition-colors"
      >
        <span
          className={`px-1 py-0.5 rounded-full text-[8px] font-medium transition-all ${
            unit === 'C'
              ? 'bg-indigo-500 text-white'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          °C
        </span>
        <span
          className={`px-1 py-0.5 rounded-full text-[8px] font-medium transition-all ${
            unit === 'F'
              ? 'bg-indigo-500 text-white'
              : 'text-white/50 hover:text-white/70'
          }`}
        >
          °F
        </span>
      </button>

      {/* Compact color bar with temps */}
      <div className="flex items-center gap-1.5 text-[8px] text-white/60">
        {temps.map((tempC, idx) => (
          <div key={tempC} className="flex items-center gap-1">
            <div
              className="w-3 h-1 rounded-full"
              style={{
                backgroundColor: colors[idx],
                boxShadow: `0 0 4px ${colors[idx]}`
              }}
            ></div>
            <span>{tempC > 0 ? '+' : ''}{convertTemp(tempC)}°</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemperatureLegend;
