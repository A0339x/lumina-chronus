import { TIMEZONES } from './timeData';
import { TimezoneData } from '../types';

/**
 * Get the local date/time for a timezone
 */
const getLocalTime = (tz: TimezoneData): Date => {
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const tzOffsetMs = tz.offset * 60 * 60 * 1000;
  return new Date(utcMs + tzOffsetMs);
};

/**
 * Check if a timezone has already celebrated New Year (is on Jan 1st or later)
 */
const hasTimezoneСelebrated = (tz: TimezoneData): boolean => {
  const localTime = getLocalTime(tz);
  const month = localTime.getMonth(); // 0 = January

  // Any time after December = celebrated (month > 0 means we're past Jan 1)
  // During January, any day >= 1 means celebrated
  return month > 0 || (month === 0 && localTime.getDate() >= 1);
};

/**
 * Finds the timezone that will hit New Year's midnight next.
 * Only considers timezones still on December 31st.
 */
export const getNextMidnightTimezone = (): { timezone: TimezoneData; targetDate: Date } => {
  const now = new Date();

  let bestTimezone: TimezoneData | null = null;
  let minDiff = Number.MAX_SAFE_INTEGER;
  let bestTargetDate = new Date();

  for (const tz of TIMEZONES) {
    // Skip timezones that have already celebrated
    if (hasTimezoneСelebrated(tz)) {
      continue;
    }

    // This timezone is still on December 31st
    const localTime = getLocalTime(tz);

    // Calculate time until midnight
    const midnight = new Date(localTime);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - localTime.getTime();

    if (diff > 0 && diff < minDiff) {
      minDiff = diff;
      bestTimezone = tz;
      bestTargetDate = new Date(now.getTime() + diff);
    }
  }

  // If all timezones have celebrated, return the last one (UTC-11)
  if (!bestTimezone) {
    const lastTz = TIMEZONES.find(tz => tz.offset === -11) || TIMEZONES[TIMEZONES.length - 1];
    return { timezone: lastTz, targetDate: new Date() };
  }

  return { timezone: bestTimezone, targetDate: bestTargetDate };
};

/**
 * Returns all timezones that have already celebrated New Year (past midnight Jan 1st)
 */
export const getPastTimezones = (): TimezoneData[] => {
  return TIMEZONES.filter(tz => hasTimezoneСelebrated(tz));
};

/**
 * Check if all timezones have celebrated New Year
 */
export const haveAllTimezonesCelebrated = (): boolean => {
  return TIMEZONES.every(tz => hasTimezoneСelebrated(tz));
};

export const formatTimeRemaining = (ms: number) => {
  if (ms <= 0) {
    return { hours: '00', minutes: '00', seconds: '00' };
  }

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
