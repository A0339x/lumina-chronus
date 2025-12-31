import React, { useState, useEffect, useCallback } from 'react';
import { getNextMidnightTimezone, getPastTimezones, haveAllTimezonesCelebrated } from './services/timeService';
import { fetchWeather, getTempColor } from './services/weatherService';
import { CountdownState, FireworkEvent, TimezoneData } from './types';
import Background from './components/Background';
import CountdownDisplay from './components/CountdownDisplay';
import MobileCountdown from './components/MobileCountdown';
import Fireworks from './components/Fireworks';
import WorldMap from './components/WorldMap';
import TemperatureLegend from './components/TemperatureLegend';
import MobileLegend from './components/MobileLegend';
import UnityMessage from './components/UnityMessage';
import Onboarding from './components/Onboarding';
import { TemperatureProvider } from './contexts/TemperatureContext';
import { Loader2, Heart, Info } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<CountdownState | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [mapFireworks, setMapFireworks] = useState<FireworkEvent[]>([]);
  const [pastTimezones, setPastTimezones] = useState<TimezoneData[]>([]);

  // Dev mode for testing celebrations
  const [devCelebrationOffset, setDevCelebrationOffset] = useState<number | null>(null);
  const [devCelebrationKey, setDevCelebrationKey] = useState(0); // Increment to re-trigger same offset

  // Track if all timezones have celebrated
  const [allCelebrated, setAllCelebrated] = useState(false);
  const [showUnityMessage, setShowUnityMessage] = useState(true); // When all celebrated, show unity by default

  // Onboarding state - now on-demand instead of automatic
  const [showOnboarding, setShowOnboarding] = useState(false);

  // First-time visitor hint for info button
  const [showInfoHint, setShowInfoHint] = useState(() => {
    return localStorage.getItem('lumina-chronos-seen-hint') !== 'true';
  });

  // Fade out the hint after a few seconds
  useEffect(() => {
    if (showInfoHint) {
      const timer = setTimeout(() => {
        setShowInfoHint(false);
        localStorage.setItem('lumina-chronos-seen-hint', 'true');
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [showInfoHint]);

  // Initialize the timer logic
  const updateTimer = useCallback(() => {
    if (!state) return;

    const now = new Date();
    const diff = state.targetDate.getTime() - now.getTime();

    // Threshold for "It's happening now"
    if (diff <= 0) {
      handleNewYearTransition(state.timezone);
    } else {
      setState(prev => prev ? { ...prev, timeRemaining: diff } : null);
    }
  }, [state]);

  const handleNewYearTransition = async (finishedTimezone: any) => {
    // 1. Trigger Screen Confetti
    setShowConfetti(true);

    // 2. Trigger World Map Firework (Big Burst)
    try {
        const { lat, lng } = finishedTimezone.coords;
        const weather = await fetchWeather(lat, lng);
        const color = getTempColor(weather.temperature);
        
        const newFirework: FireworkEvent = {
            id: `${finishedTimezone.name}-${Date.now()}`,
            lat,
            lng,
            color
        };
        
        setMapFireworks(prev => [...prev, newFirework]);
        
        // After transition, re-calculate past timezones to include this one permanently
        setTimeout(() => {
            setPastTimezones(getPastTimezones());
        }, 1000);

    } catch (e) {
        console.error("Error generating map firework", e);
    }
    
    // 3. Move to next timezone
    setTimeout(() => {
      const next = getNextMidnightTimezone();
      setState({
        timezone: next.timezone,
        targetDate: next.targetDate,
        timeRemaining: next.targetDate.getTime() - new Date().getTime()
      });
      setShowConfetti(false);
      // Clear specific big firework event after a while to stop it re-triggering heavily, 
      // though the component handles fading.
      setMapFireworks([]); 
    }, 5000);
  };

  // Initial setup
  useEffect(() => {
    const init = () => {
      const next = getNextMidnightTimezone();
      setState({
        timezone: next.timezone,
        targetDate: next.targetDate,
        timeRemaining: next.targetDate.getTime() - new Date().getTime()
      });
      setPastTimezones(getPastTimezones());
      setIsInitializing(false);
    };
    init();
  }, []);

  // Timer Interval
  useEffect(() => {
    if (isInitializing) return;
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [updateTimer, isInitializing]);

  // Dev mode: Shift+C triggers celebration, Shift+U shows unity message
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'c' && state) {
        console.log('[DEV MODE] Triggering celebration for', state.timezone.name);
        setDevCelebrationOffset(state.timezone.offset);
        setDevCelebrationKey(prev => prev + 1);
      }
      if (e.shiftKey && e.key.toLowerCase() === 'u') {
        console.log('[DEV MODE] Toggling all celebrated state');
        setAllCelebrated(prev => {
          if (!prev) setShowUnityMessage(true); // Show unity when enabling
          return !prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state]);

  // Check if all timezones have celebrated
  useEffect(() => {
    if (haveAllTimezonesCelebrated()) {
      setAllCelebrated(true);
    }
  }, [pastTimezones]);

  if (isInitializing || !state) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
            <Loader2 className="animate-spin text-indigo-500" size={48} />
        </div>
    );
  }

  return (
    <TemperatureProvider>
      <main className="relative h-screen w-screen flex flex-col font-sans overflow-hidden selection:bg-indigo-500/30">
        <Background />
        <Fireworks trigger={showConfetti} />

        {/* Info button - subtle, in corner */}
        <button
          onClick={() => {
            setShowOnboarding(true);
            setShowInfoHint(false);
            localStorage.setItem('lumina-chronos-seen-hint', 'true');
          }}
          className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 pl-2 pr-3 py-2 rounded-full border transition-all ${
            showInfoHint
              ? 'bg-white/10 border-white/20 text-white/70 animate-pulse'
              : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70 hover:border-white/20'
          }`}
          aria-label="About Lumina Chronos"
        >
          <Info size={18} />
          <span
            className={`text-xs tracking-wide transition-all duration-500 overflow-hidden ${
              showInfoHint ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0'
            }`}
          >
            About
          </span>
        </button>

        {/* Onboarding modal - on demand */}
        {showOnboarding && (
          <Onboarding onComplete={() => setShowOnboarding(false)} />
        )}

        {/* Unity message when all timezones have celebrated */}
        {allCelebrated && showUnityMessage && (
          <UnityMessage onShowEarth={() => setShowUnityMessage(false)} />
        )}

        {/* MOBILE LAYOUT - Full screen map with overlays (up to 1024px) */}
        <div className="lg:hidden fixed inset-0 z-10 flex items-center justify-center">
          {/* Map container - 2:1 aspect ratio sized to fit viewport */}
          <div
            className="relative"
            style={{
              width: 'min(100vw, calc(100vh * 2))',
              height: 'min(50vw, 100vh)',
            }}
          >
            <WorldMap
              activeFireworks={mapFireworks}
              pastTimezones={pastTimezones}
              devCelebrationOffset={devCelebrationKey > 0 ? devCelebrationOffset : null}
              devTrigger={devCelebrationKey}
            />
          </div>

          {/* Countdown - Top Left */}
          <div className="absolute top-4 left-4 z-20">
            <MobileCountdown
              timezone={state.timezone}
              timeRemaining={state.timeRemaining}
            />
          </div>

          {/* Legend - Bottom Right */}
          <div className="absolute bottom-4 right-4 z-20">
            <MobileLegend />
          </div>

          {/* Unity button - Bottom Center (when applicable) */}
          {allCelebrated && !showUnityMessage && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
              <button
                onClick={() => setShowUnityMessage(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white/70 text-[10px] tracking-wide"
              >
                <Heart size={12} className="text-rose-400/70" />
                <span>Unity</span>
              </button>
            </div>
          )}
        </div>

        {/* DESKTOP LAYOUT - Original centered layout (1024px and up) */}
        <div className="hidden lg:flex relative z-10 w-full h-full overflow-hidden flex-col items-center p-2 sm:p-3">

          {/* Top Section: Compact Countdown */}
          <section className="w-full max-w-4xl flex justify-center shrink-0">
              <CountdownDisplay
                  timezone={state.timezone}
                  timeRemaining={state.timeRemaining}
              />
          </section>

          {/* Middle Section: World Map - MAIN FOCUS */}
          <section className="w-full flex-1 flex flex-col items-center justify-center min-h-0 py-1">
              <div className="w-full h-full max-w-7xl flex items-center justify-center">
                  <div className="w-full h-full max-h-[60vh] aspect-[2.5/1]">
                      <WorldMap
                        activeFireworks={mapFireworks}
                        pastTimezones={pastTimezones}
                        devCelebrationOffset={devCelebrationKey > 0 ? devCelebrationOffset : null}
                        devTrigger={devCelebrationKey}
                      />
                  </div>
              </div>
          </section>

          {/* Bottom Section: Compact Legend & Footer */}
          <section className="w-full max-w-xl shrink-0">
              <TemperatureLegend />
              <footer className="py-0.5 text-center">
                  {allCelebrated && !showUnityMessage ? (
                    <button
                      onClick={() => setShowUnityMessage(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80 hover:border-white/20 transition-all text-[10px] sm:text-xs tracking-wide"
                    >
                      <Heart size={12} className="text-rose-400/70" />
                      <span>View Unity Message</span>
                    </button>
                  ) : (
                    <p className="text-white/20 text-[8px] sm:text-[10px] tracking-[0.2em] uppercase">
                        Lumina Chronos • {state.timezone.name}
                    </p>
                  )}
              </footer>
          </section>
        </div>
      </main>
    </TemperatureProvider>
  );
};

export default App;