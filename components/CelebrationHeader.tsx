import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface CelebrationHeaderProps {
  subtitle?: string;
}

const CelebrationHeader: React.FC<CelebrationHeaderProps> = ({
  subtitle = "The world has celebrated together"
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mini fireworks animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      alpha: number;
      life: number;
      maxLife: number;
      gravity: number;
      trail: { x: number; y: number; alpha: number }[];

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 1;
        this.color = color;
        this.size = Math.random() * 2 + 1;
        this.alpha = 1;
        this.life = 0;
        this.maxLife = 40 + Math.random() * 30;
        this.gravity = 0.03;
        this.trail = [];
      }

      update(): boolean {
        this.life++;
        this.vy += this.gravity;

        // Store trail
        this.trail.push({ x: this.x, y: this.y, alpha: this.alpha * 0.5 });
        if (this.trail.length > 5) this.trail.shift();

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;

        this.alpha = 1 - (this.life / this.maxLife);
        return this.life < this.maxLife;
      }

      draw(ctx: CanvasRenderingContext2D) {
        // Draw trail
        this.trail.forEach((point, i) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, this.size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.globalAlpha = point.alpha * (i / this.trail.length) * 0.3;
          ctx.fill();
        });

        // Draw particle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    const colors = [
      '#fcd34d', // amber
      '#f472b6', // pink
      '#a78bfa', // violet
      '#60a5fa', // blue
      '#34d399', // emerald
      '#fb923c', // orange
      '#f87171', // red
    ];

    const spawnFirework = () => {
      if (!canvas) return;
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height * 0.6 + canvas.height * 0.2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const count = 8 + Math.floor(Math.random() * 8);

      for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
      }
    };

    // Spawn fireworks periodically
    const spawnInterval = setInterval(() => {
      if (Math.random() > 0.3) {
        spawnFirework();
      }
    }, 800);

    // Initial burst
    for (let i = 0; i < 3; i++) {
      setTimeout(() => spawnFirework(), i * 200);
    }

    const render = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (p.update()) {
          p.draw(ctx);
        } else {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearInterval(spawnInterval);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-4xl z-10 py-2">
      {/* Fireworks canvas behind text */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Happy New Year Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative text-center"
      >
        <div className="inline-flex items-center gap-1.5 text-amber-300/70 text-[8px] sm:text-[10px] font-medium tracking-wider mb-1 uppercase">
          <Sparkles size={10} className="sm:w-3 sm:h-3" />
          <span>2026</span>
          <Sparkles size={10} className="sm:w-3 sm:h-3" />
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight drop-shadow-lg">
          <span className="bg-gradient-to-r from-amber-200 via-pink-200 to-indigo-200 bg-clip-text text-transparent">
            Happy New Year
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-2 text-white/50 text-[10px] sm:text-xs font-light tracking-widest"
        >
          {subtitle}
        </motion.p>
      </motion.div>
    </div>
  );
};

export default CelebrationHeader;
