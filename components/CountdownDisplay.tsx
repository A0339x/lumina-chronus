import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTimeRemaining } from '../services/timeService';
import { TimezoneData } from '../types';
import { getLocalGreeting, GreetingEntry } from '../services/greetings';
import { Globe, MapPin, MousePointerClick } from 'lucide-react';

interface CountdownDisplayProps {
  timezone: TimezoneData;
  timeRemaining: number;
}

const CountdownDisplay: React.FC<CountdownDisplayProps> = ({ timezone, timeRemaining }) => {
  const { hours, minutes, seconds } = formatTimeRemaining(timeRemaining);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [localGreeting, setLocalGreeting] = useState<GreetingEntry>(() =>
    getLocalGreeting(undefined, timezone.regionName)
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-rotate cities every 2 minutes
  useEffect(() => {
    if (!timezone.cities || timezone.cities.length === 0) return;

    const timer = setTimeout(() => {
        setSelectedCity(current => {
            const currentIndex = current ? timezone.cities.indexOf(current) : -1;
            const nextIndex = (currentIndex + 1) % timezone.cities.length;
            return timezone.cities[nextIndex];
        });
    }, 120000); // 2 minutes

    return () => clearTimeout(timer);
  }, [selectedCity, timezone]);

  // Scroll selected city into view
  useEffect(() => {
    if (selectedCity && scrollContainerRef.current) {
        // Sanitize city name for ID usage just in case, though names are usually safe
        const safeId = `city-btn-${selectedCity.replace(/\s+/g, '-')}`;
        const btn = document.getElementById(safeId);
        if (btn) {
            btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
  }, [selectedCity]);

  // Reset selected city when the actual timezone changes automatically
  useEffect(() => {
    setSelectedCity(null);
    setLocalGreeting(getLocalGreeting(undefined, timezone.regionName));
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = 0;
    }
  }, [timezone.name, timezone.regionName]);

  // Update local greeting when city is selected
  useEffect(() => {
    setLocalGreeting(getLocalGreeting(selectedCity || undefined, timezone.regionName));
  }, [selectedCity, timezone.regionName]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl z-10">

      {/* Target Region Header - Compact */}
      <motion.div
        key={timezone.name}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center mb-0.5"
      >
        <div className="inline-flex items-center gap-1 text-emerald-300/70 text-[8px] sm:text-[10px] font-medium tracking-wider mb-0.5 uppercase">
            <Globe size={8} className="sm:w-2.5 sm:h-2.5" />
            <span>Upcoming Midnight</span>
        </div>
        <h1 className="text-lg sm:text-xl md:text-2xl font-light text-white tracking-tight drop-shadow-lg">
          {timezone.regionName}
        </h1>
        <p className="text-white/50 text-[8px] sm:text-[10px] font-light tracking-widest">{timezone.name} (GMT {timezone.offset > 0 ? '+' : ''}{timezone.offset})</p>
      </motion.div>

      {/* Countdown & Greeting - Clean, no background */}
      <div className="w-full flex flex-col items-center">
        {/* The Numbers */}
        <div className="flex items-baseline justify-center gap-2 sm:gap-3 md:gap-4 text-white font-mono leading-none select-none">
            <TimeUnit value={hours} label="HRS" />
            <span className="text-lg sm:text-xl md:text-2xl font-thin text-white/20">:</span>
            <TimeUnit value={minutes} label="MIN" />
            <span className="text-lg sm:text-xl md:text-2xl font-thin text-white/20">:</span>
            <TimeUnit value={seconds} label="SEC" />
        </div>

        {/* Local Greeting */}
        <div className="mt-2 sm:mt-3 min-h-[28px] sm:min-h-[36px] flex flex-col items-center text-center">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={`greeting-${localGreeting.text}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-0.5"
                >
                    <h3 className="text-sm sm:text-base md:text-lg font-light bg-gradient-to-r from-amber-200 via-white to-indigo-200 bg-clip-text text-transparent leading-tight drop-shadow-lg">
                        {localGreeting.text}
                    </h3>
                    <p className="text-white/40 text-[7px] sm:text-[8px] tracking-wider">
                        {localGreeting.language}
                    </p>
                    {!selectedCity && (
                        <p className="text-indigo-300/50 text-[7px] sm:text-[8px] uppercase tracking-widest flex items-center justify-center gap-0.5 animate-pulse pt-0.5">
                            <MousePointerClick size={7} /> Select city for local greeting
                        </p>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
      </div>

      {/* Cities List - Single Row */}
      <div className="w-full mt-2 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div
            ref={scrollContainerRef}
            className="flex gap-3 sm:gap-4 px-4 pb-1 justify-center min-w-max"
        >
            {timezone.cities.map((city, idx) => {
                const isSelected = selectedCity === city;
                const safeId = `city-btn-${city.replace(/\s+/g, '-')}`;
                return (
                    <motion.button
                        key={city}
                        id={safeId}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedCity(city)}
                        className={`
                            shrink-0 flex items-center gap-1 text-[10px] sm:text-xs transition-all
                            ${isSelected
                                ? 'text-white'
                                : 'text-white/50 hover:text-white/80'
                            }
                        `}
                    >
                        <MapPin size={8} className={`sm:w-2.5 sm:h-2.5 ${isSelected ? "text-indigo-400" : "text-white/30"}`} />
                        <span className={isSelected ? "underline underline-offset-2 decoration-indigo-400/50" : ""}>{city}</span>
                    </motion.button>
                );
            })}
        </div>
      </div>
    </div>
  );
};

const TimeUnit: React.FC<{ value: string; label: string }> = ({ value, label }) => (
    <div className="flex flex-col items-center">
        <div className="relative">
            <AnimatePresence mode='popLayout'>
                <motion.span
                    key={value}
                    initial={{ y: 10, opacity: 0, filter: 'blur(5px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    exit={{ y: -10, opacity: 0, filter: 'blur(5px)' }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="block text-xl sm:text-2xl md:text-3xl font-bold tracking-tighter bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent"
                >
                    {value}
                </motion.span>
            </AnimatePresence>
        </div>
        <span className="text-[6px] sm:text-[8px] font-medium tracking-[0.15em] text-indigo-300/50">{label}</span>
    </div>
);

export default CountdownDisplay;