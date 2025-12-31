import React from 'react';

const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden bg-slate-950">
      {/* Deep gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 opacity-80" />
      
      {/* Animated Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-blob" />
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-blob animation-delay-4000" />
      <div className="absolute bottom-[-20%] right-[10%] w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-pulse-slow" />

      {/* Grid overlay for texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
    </div>
  );
};

export default Background;