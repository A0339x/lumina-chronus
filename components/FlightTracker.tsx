import React, { useState, useEffect, useCallback } from 'react';
import { Plane, Eye, EyeOff, X, Plus, ChevronDown, ChevronUp } from 'lucide-react';

export interface TrackedFlight {
  callsign: string;
  visible: boolean;
  addedAt: number;
}

interface FlightTrackerProps {
  flights: TrackedFlight[];
  onFlightsChange: (flights: TrackedFlight[]) => void;
}

const FlightTracker: React.FC<FlightTrackerProps> = ({ flights, onFlightsChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format callsign to standard format (uppercase, trim)
  const formatCallsign = (input: string): string => {
    let callsign = input.trim().toUpperCase().replace(/\s+/g, '');

    // Convert common formats: AC999 -> ACA999, UA123 -> UAL123
    if (/^AC\d+$/.test(callsign)) {
      callsign = 'ACA' + callsign.slice(2);
    } else if (/^UA\d+$/.test(callsign)) {
      callsign = 'UAL' + callsign.slice(2);
    } else if (/^AA\d+$/.test(callsign)) {
      callsign = 'AAL' + callsign.slice(2);
    } else if (/^DL\d+$/.test(callsign)) {
      callsign = 'DAL' + callsign.slice(2);
    } else if (/^WN\d+$/.test(callsign)) {
      callsign = 'SWA' + callsign.slice(2);
    } else if (/^WS\d+$/.test(callsign)) {
      callsign = 'WJA' + callsign.slice(2);
    }

    return callsign;
  };

  const addFlight = useCallback(() => {
    const callsign = formatCallsign(inputValue);

    if (!callsign) {
      setError('Enter a flight number');
      return;
    }

    if (callsign.length < 3) {
      setError('Flight number too short');
      return;
    }

    if (flights.some(f => f.callsign === callsign)) {
      setError('Already tracking this flight');
      return;
    }

    onFlightsChange([
      ...flights,
      { callsign, visible: true, addedAt: Date.now() }
    ]);
    setInputValue('');
    setError(null);
    setIsExpanded(true);
  }, [inputValue, flights, onFlightsChange]);

  const removeFlight = useCallback((callsign: string) => {
    onFlightsChange(flights.filter(f => f.callsign !== callsign));
  }, [flights, onFlightsChange]);

  const toggleVisibility = useCallback((callsign: string) => {
    onFlightsChange(
      flights.map(f =>
        f.callsign === callsign ? { ...f, visible: !f.visible } : f
      )
    );
  }, [flights, onFlightsChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addFlight();
    }
  };

  const visibleCount = flights.filter(f => f.visible).length;

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden min-w-[220px]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane size={14} className="text-amber-400" />
          <span className="text-white/80 text-xs font-medium">Flight Tracker</span>
        </div>
        {flights.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white/40 hover:text-white/70 transition-colors"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Input */}
      <div className="p-2">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter flight (e.g. AC999)"
            className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
          />
          <button
            onClick={addFlight}
            className="px-2 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 rounded-lg text-amber-400 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
        {error && (
          <p className="text-red-400/80 text-[10px] mt-1 px-1">{error}</p>
        )}
      </div>

      {/* Flight List */}
      {flights.length > 0 && isExpanded && (
        <div className="border-t border-white/10">
          <div className="max-h-[200px] overflow-y-auto">
            {flights.map((flight) => (
              <div
                key={flight.callsign}
                className={`flex items-center justify-between px-3 py-2 border-b border-white/5 last:border-b-0 ${
                  flight.visible ? 'bg-transparent' : 'bg-slate-800/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${flight.visible ? 'bg-emerald-400' : 'bg-white/20'}`} />
                  <span className={`text-xs font-mono ${flight.visible ? 'text-white/90' : 'text-white/40'}`}>
                    {flight.callsign}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleVisibility(flight.callsign)}
                    className={`p-1 rounded transition-colors ${
                      flight.visible
                        ? 'text-white/50 hover:text-white/80 hover:bg-white/10'
                        : 'text-white/30 hover:text-white/60 hover:bg-white/10'
                    }`}
                    title={flight.visible ? 'Hide from map' : 'Show on map'}
                  >
                    {flight.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button
                    onClick={() => removeFlight(flight.callsign)}
                    className="p-1 rounded text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Remove flight"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary when collapsed */}
      {flights.length > 0 && !isExpanded && (
        <div className="px-3 py-1.5 border-t border-white/10 text-[10px] text-white/40">
          Tracking {visibleCount} of {flights.length} flight{flights.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default FlightTracker;
