import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioControlProps {
  isMuted: boolean;
  onToggle: () => void;
}

const AudioControl: React.FC<AudioControlProps> = ({ isMuted, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="fixed top-6 right-6 z-50 p-3 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md group"
      aria-label={isMuted ? "Unmute audio" : "Mute audio"}
    >
      {isMuted ? (
        <VolumeX size={20} className="group-hover:scale-110 transition-transform" />
      ) : (
        <Volume2 size={20} className="group-hover:scale-110 transition-transform" />
      )}
      <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
    </button>
  );
};

export default AudioControl;