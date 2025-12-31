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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: isExiting ? 0 : 1,
        scale: isExiting ? 1.05 : 1
      }}
      transition={{ duration: isExiting ? 0.8 : 1.5, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-indigo-950/95 via-slate-950/98 to-slate-950/95 backdrop-blur-sm"
    >
      <div className="text-center px-6 max-w-3xl">
        {/* Animated globe icon */}
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            rotate: { duration: 60, repeat: Infinity, ease: "linear" }
          }}
          className="inline-block mb-6"
        >
          <Globe2 size={80} className="text-indigo-400/80" strokeWidth={1} />
        </motion.div>

        {/* Main message */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-6 leading-tight"
        >
          The World Has Celebrated
          <span className="block mt-2 bg-gradient-to-r from-amber-200 via-pink-200 to-indigo-200 bg-clip-text text-transparent">
            Together As One
          </span>
        </motion.h1>

        {/* Divider with sparkles */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex items-center justify-center gap-4 my-8"
        >
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/30"></div>
          <Sparkles size={20} className="text-amber-300/70" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/30"></div>
        </motion.div>

        {/* Unity message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="text-lg sm:text-xl text-white/70 font-light leading-relaxed mb-8"
        >
          From the Line Islands to American Samoa, every corner of our planet
          has welcomed the new year. Though separated by oceans and borders,
          we shared the same sky, the same hope, the same moment.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="text-xl sm:text-2xl text-white/90 font-light italic mb-10"
        >
          "We are not divided. We are one humanity,
          <br className="hidden sm:block" />
          sharing one home among the stars."
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
            <Heart size={40} className="text-rose-400/80" fill="currentColor" />
          </motion.div>
        </motion.div>

        {/* Year text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 1 }}
          className="mt-8 text-6xl sm:text-7xl font-thin text-white/20 tracking-widest"
        >
          2026
        </motion.p>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5, duration: 1 }}
          className="mt-4 text-xs sm:text-sm text-white/30 uppercase tracking-[0.3em]"
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
          className="mt-10 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/20 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MapIcon size={18} className="group-hover:text-indigo-300 transition-colors" />
          <span className="text-sm tracking-wide">View the Celebration</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default UnityMessage;
