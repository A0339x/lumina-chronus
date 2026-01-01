import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Globe2, Sparkles, MapIcon } from 'lucide-react';

interface UnityMessageProps {
  onShowEarth: () => void;
}

const UnityMessage: React.FC<UnityMessageProps> = ({ onShowEarth }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleShowEarth = () => {
    setIsExiting(true);
    // Wait for fade animation to complete before switching
    setTimeout(() => {
      onShowEarth();
    }, 800);
  };

  // Calculate responsive icon sizes based on viewport - sized to fit all content on screen
  const globeSize = typeof window !== 'undefined'
    ? Math.max(24, Math.min(80, window.innerHeight * 0.08))
    : 60;
  const heartSize = typeof window !== 'undefined'
    ? Math.max(16, Math.min(48, window.innerHeight * 0.045))
    : 32;
  const sparkleSize = typeof window !== 'undefined'
    ? Math.max(10, Math.min(24, window.innerHeight * 0.025))
    : 18;
  const mapIconSize = typeof window !== 'undefined'
    ? Math.max(10, Math.min(20, window.innerHeight * 0.02))
    : 16;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: isExiting ? 0 : 1,
        scale: isExiting ? 1.05 : 1
      }}
      transition={{ duration: isExiting ? 0.8 : 1.5, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md"
    >
      <div className="text-center px-4 max-w-[95vw] overflow-hidden">
        {/* Animated globe icon */}
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            rotate: { duration: 60, repeat: Infinity, ease: "linear" }
          }}
          className="inline-block mb-[1.5vh]"
        >
          <Globe2 size={globeSize} className="text-indigo-400/80" strokeWidth={1} />
        </motion.div>

        {/* Main message */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-[clamp(1rem,3.5vw,2.75rem)] font-light text-white mb-[1.5vh] leading-tight"
        >
          The World Has Celebrated
          <span className="block mt-[1vh] bg-gradient-to-r from-amber-200 via-pink-200 to-indigo-200 bg-clip-text text-transparent">
            Together As One
          </span>
        </motion.h1>

        {/* Divider with sparkles */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex items-center justify-center gap-[1.5vw] my-[2vh]"
        >
          <div className="h-px w-[8vw] max-w-24 bg-gradient-to-r from-transparent to-white/30"></div>
          <Sparkles size={sparkleSize} className="text-amber-300/70" />
          <div className="h-px w-[8vw] max-w-24 bg-gradient-to-l from-transparent to-white/30"></div>
        </motion.div>

        {/* Unity message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="text-[clamp(0.65rem,1.8vw,1.125rem)] text-white/70 font-light leading-relaxed mb-[2vh]"
        >
          From the Line Islands to American Samoa, every corner of our planet
          has welcomed the new year. We shared the same sky, the same hope,
          the same moment.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="text-[clamp(0.75rem,2vw,1.35rem)] text-white/90 font-light italic mb-[2.5vh]"
        >
          "Even as the world tries to divide us,
          <br className="hidden sm:block" />
          we are one."
        </motion.p>

        {/* Heart icon with pulse */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.5, duration: 0.5, type: "spring" }}
          className="inline-block"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Heart size={heartSize} className="text-rose-400/80" fill="currentColor" />
          </motion.div>
        </motion.div>

        {/* Year text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 1 }}
          className="mt-[2vh] text-[clamp(1.25rem,6vw,5rem)] font-thin text-white/20 tracking-widest"
        >
          2026
        </motion.p>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5, duration: 1 }}
          className="mt-[1vh] text-[clamp(0.5rem,1vw,0.75rem)] text-white/30 uppercase tracking-[0.3em]"
        >
          Happy New Year, Earth
        </motion.p>

        {/* Toggle to Earth view */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isExiting ? 0 : 1, y: 0 }}
          transition={{ delay: isExiting ? 0 : 4, duration: 0.8 }}
          onClick={handleShowEarth}
          disabled={isExiting}
          className="mt-[2.5vh] inline-flex items-center gap-2 px-[1.5vw] py-[1vh] rounded-full bg-white/5 border border-white/20 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MapIcon size={mapIconSize} className="group-hover:text-indigo-300 transition-colors" />
          <span className="text-[clamp(0.7rem,1vw,0.875rem)] tracking-wide">View the Celebration</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default UnityMessage;
