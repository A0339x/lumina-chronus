import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe2, Sparkles, Thermometer, MapPin, Heart, ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
}

const steps: OnboardingStep[] = [
  {
    icon: <Globe2 size={48} strokeWidth={1} />,
    title: "Welcome to Lumina Chronos",
    subtitle: "A Global New Year's Experience",
    description: "Watch as midnight sweeps across the Earth, timezone by timezone, from the Line Islands to American Samoa."
  },
  {
    icon: <Sparkles size={48} strokeWidth={1} />,
    title: "Celebrations Light Up",
    subtitle: "Watch the World Celebrate",
    description: "As each timezone hits midnight, sparkles illuminate the map. The celebration spreads westward as the night progresses."
  },
  {
    icon: <Thermometer size={48} strokeWidth={1} />,
    title: "Temperature Colors",
    subtitle: "Feel the Climate",
    description: "Sparkle colors reflect real temperatures from weather stations worldwide. Blue for cold, green for mild, amber for warm, red for hot."
  },
  {
    icon: <MapPin size={48} strokeWidth={1} />,
    title: "Local Greetings",
    subtitle: "Happy New Year in Every Language",
    description: "Select any city to see 'Happy New Year' in its local language. Hover over countries to explore temperature data."
  },
  {
    icon: <Heart size={48} strokeWidth={1} />,
    title: "One World, One Moment",
    subtitle: "We Celebrate Together",
    description: "When all timezones have celebrated, a special message reminds us that despite our differences, we share this planet together."
  }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/98 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg px-6">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? 'bg-indigo-400 w-6'
                  : idx < currentStep
                  ? 'bg-indigo-400/50'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-block mb-6 text-indigo-400/80"
            >
              {step.icon}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-2xl sm:text-3xl font-light text-white mb-2"
            >
              {step.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-sm sm:text-base text-indigo-300/70 mb-6 tracking-wide"
            >
              {step.subtitle}
            </motion.p>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="text-white/60 text-sm sm:text-base leading-relaxed max-w-md mx-auto"
            >
              {step.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex items-center justify-between mt-12"
        >
          {/* Previous / Skip */}
          <button
            onClick={currentStep > 0 ? handlePrev : handleSkip}
            className="flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors text-sm"
          >
            {currentStep > 0 ? (
              <>
                <ChevronLeft size={16} />
                <span>Back</span>
              </>
            ) : (
              <span>Skip</span>
            )}
          </button>

          {/* Next / Get Started */}
          <button
            onClick={handleNext}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all text-sm font-medium ${
              isLastStep
                ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <span>{isLastStep ? 'Get Started' : 'Next'}</span>
            <ChevronRight size={16} />
          </button>
        </motion.div>

        {/* Step counter */}
        <p className="text-center text-white/20 text-xs mt-8 tracking-widest">
          {currentStep + 1} / {steps.length}
        </p>
      </div>
    </motion.div>
  );
};

export default Onboarding;
