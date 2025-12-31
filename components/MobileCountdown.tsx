import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTimeRemaining } from '../services/timeService';
import { TimezoneData } from '../types';

interface MobileCountdownProps {
  timezone: TimezoneData;
  timeRemaining: number;
}

const MobileCountdown: React.FC<MobileCountdownProps> = ({ timezone, timeRemaining }) => {
  const { hours, minutes, seconds } = formatTimeRemaining(timeRemaining);

  return (
    <div className="flex flex-col items-start">
      {/* Region name */}
      <motion.p
        key={timezone.regionName}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-white/60 text-[10px] tracking-wide mb-0.5"
      >
        {timezone.regionName}
      </motion.p>

      {/* Compact countdown */}
      <div className="flex items-baseline gap-0.5 font-mono text-white">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={`h-${hours}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-2xl font-bold"
          >
            {hours}
          </motion.span>
        </AnimatePresence>
        <span className="text-lg text-white/30">:</span>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={`m-${minutes}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-2xl font-bold"
          >
            {minutes}
          </motion.span>
        </AnimatePresence>
        <span className="text-lg text-white/30">:</span>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={`s-${seconds}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-2xl font-bold"
          >
            {seconds}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Timezone offset */}
      <p className="text-white/30 text-[8px] tracking-wider mt-0.5">
        {timezone.name}
      </p>
    </div>
  );
};

export default MobileCountdown;
