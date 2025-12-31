import { TIMEZONES } from './timeData';
import { TimezoneData } from '../types';

/**
 * Finds the timezone that will hit midnight next.
 */
export const getNextMidnightTimezone = (): { timezone: TimezoneData; targetDate: Date } => {
  const now = new Date();
  const currentUtcTime = now.getTime() + (now.getTimezoneOffset() * 60000);

  let bestTimezone = TIMEZONES[0];
  let minDiff = Number.MAX_SAFE_INTEGER;
  let bestTargetDate = new Date();

  for (const tz of TIMEZONES) {
    // Calculate local time for this timezone
    const tzOffsetMs = tz.offset * 60 * 60 * 1000;
    const tzLocalTimeMs = currentUtcTime + tzOffsetMs;
    const tzDate = new Date(tzLocalTimeMs);

    // We want the *next* midnight.
    const nextMidnightLocal = new Date(tzDate);
    nextMidnightLocal.setHours(24, 0, 0, 0); 

    const diff = nextMidnightLocal.getTime() - tzDate.getTime();

    if (diff > 0 && diff < minDiff) {
      minDiff = diff;
      bestTimezone = tz;
      bestTargetDate = new Date(now.getTime() + diff);
    }
  }

  return { timezone: bestTimezone, targetDate: bestTargetDate };
};

/**
 * Returns a list of timezones where it is already New Year (past 00:00 Jan 1st).
 * Since this is a generic app, we assume "New Year" means the local time is 
 * in the early morning (00:00 - 12:00) of the "next" day compared to the user, 
 * or simply if their local time hours are < 12 and it's a new day cycle.
 * 
 * Simplified logic for this demo:
 * We look at the getNextMidnightTimezone. Any timezone with an offset > nextMidnight.offset 
 * has likely already celebrated (moving East to West).
 */
export const getPastTimezones = (): TimezoneData[] => {
    const next = getNextMidnightTimezone();
    // In the sequence of New Year, timezones with Higher offsets celebrate first.
    // e.g., +14 celebrates before +13.
    // If the "next" is +10, then +14, +13, +12, +11 have passed.
    
    return TIMEZONES.filter(tz => tz.offset > next.timezone.offset);
};

export const formatTimeRemaining = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0')
  };
};

/**
 * Check if all timezones have celebrated New Year
 * This happens when the last timezone (UTC-11 or UTC-12) has passed midnight
 */
export const haveAllTimezonesCelebrated = (): boolean => {
  const pastTimezones = getPastTimezones();
  // All timezones have celebrated when pastTimezones includes ALL timezones
  return pastTimezones.length === TIMEZONES.length;
};