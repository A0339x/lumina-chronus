import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, RotateCcw } from 'lucide-react';

const RotatePrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Only show on mobile-sized screens (< 1024px width) in portrait mode
      const isMobileSize = window.innerWidth < 1024;
      const isPortrait = window.innerHeight > window.innerWidth;
      setShowPrompt(isMobileSize && isPortrait);
    };

    // Check on mount
    checkOrientation();

    // Listen for resize/orientation changes
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/98 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center text-center px-8">
            {/* Rotating phone animation */}
            <motion.div
              animate={{ rotate: [0, -90, -90, 0] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.4, 0.6, 1]
              }}
              className="mb-8 text-indigo-400/80"
            >
              <Smartphone size={64} strokeWidth={1.5} />
            </motion.div>

            {/* Arrow indicator */}
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="mb-6 text-white/40"
            >
              <RotateCcw size={24} />
            </motion.div>

            {/* Text */}
            <h2 className="text-xl font-light text-white mb-2">
              Rotate Your Device
            </h2>
            <p className="text-white/50 text-sm max-w-xs">
              For the best experience viewing the world map, please rotate your phone to landscape mode.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RotatePrompt;
