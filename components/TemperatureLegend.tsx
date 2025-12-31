import React from 'react';
import { Thermometer } from 'lucide-react';
import { useTemperature } from '../contexts/TemperatureContext';

const TemperatureLegend: React.FC = () => {
  const { unit, toggleUnit, convertTemp } = useTemperature();

  // Temperature values in Celsius
  const temps = [-40, -20, 0, 20, 40];
  const colors = ['#6496ff', '#64ffff', '#00ff64', '#ffff00', '#ff3700'];

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-1 sm:mb-2">
        <div className="flex items-center gap-1.5 text-white/50 text-[8px] sm:text-[10px] tracking-widest uppercase">
          <Thermometer size={10} className="sm:w-3 sm:h-3" />
          <span>Temperature</span>
        </div>

        {/* C/F Toggle */}
        <button
          onClick={toggleUnit}
          className="flex items-center bg-white/10 rounded-full p-0.5 border border-white/20 hover:border-white/30 transition-colors"
        >
          <span
            className={`px-1.5 py-0.5 rounded-full text-[8px] sm:text-[10px] font-medium transition-all ${
              unit === 'C'
                ? 'bg-indigo-500 text-white'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            °C
          </span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[8px] sm:text-[10px] font-medium transition-all ${
              unit === 'F'
                ? 'bg-indigo-500 text-white'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            °F
          </span>
        </button>
      </div>

      <div className="w-full bg-white/5 border border-white/10 backdrop-blur-md rounded-lg sm:rounded-xl p-2 sm:p-3 flex justify-between items-center text-[8px] sm:text-[10px] text-white/80">
        {temps.map((tempC, idx) => (
          <React.Fragment key={tempC}>
            {idx > 0 && <div className="h-4 sm:h-6 w-px bg-white/10"></div>}
            <div className="flex flex-col items-center gap-0.5 sm:gap-1">
              <div
                className="w-4 sm:w-6 h-0.5 sm:h-1 rounded-full"
                style={{
                  backgroundColor: colors[idx],
                  boxShadow: `0 0 8px ${colors[idx]}`
                }}
              ></div>
              <span>
                {tempC > 0 ? '+' : ''}{convertTemp(tempC)}°
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default TemperatureLegend;
