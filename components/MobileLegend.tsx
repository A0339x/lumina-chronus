import React from 'react';
import { useTemperature } from '../contexts/TemperatureContext';

const MobileLegend: React.FC = () => {
  const { unit, toggleUnit, convertTemp } = useTemperature();

  // Simplified: just show cold to hot with colors
  const temps = [-20, 0, 20, 40];
  const colors = ['#64ffff', '#00ff64', '#ffff00', '#ff3700'];

  return (
    <div className="flex flex-col items-end gap-1.5">
      {/* C/F Toggle */}
      <button
        onClick={toggleUnit}
        className="flex items-center bg-black/40 backdrop-blur-sm rounded-full p-0.5 border border-white/20"
      >
        <span
          className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium transition-all ${
            unit === 'C'
              ? 'bg-indigo-500 text-white'
              : 'text-white/50'
          }`}
        >
          °C
        </span>
        <span
          className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium transition-all ${
            unit === 'F'
              ? 'bg-indigo-500 text-white'
              : 'text-white/50'
          }`}
        >
          °F
        </span>
      </button>

      {/* Compact color bar with temps */}
      <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg p-2 flex items-center gap-1.5">
        {temps.map((tempC, idx) => (
          <div key={tempC} className="flex flex-col items-center gap-0.5">
            <div
              className="w-3 h-1 rounded-full"
              style={{
                backgroundColor: colors[idx],
                boxShadow: `0 0 6px ${colors[idx]}`
              }}
            />
            <span className="text-[7px] text-white/60">
              {convertTemp(tempC)}°
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileLegend;
