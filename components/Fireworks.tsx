import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface FireworksProps {
    trigger: boolean;
}

const Fireworks: React.FC<FireworksProps> = ({ trigger }) => {
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (trigger) {
            const duration = 15 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };

            const randomInRange = (min: number, max: number) => {
                return Math.random() * (max - min) + min;
            }

            // Fire main burst immediately
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#a78bfa', '#f472b6', '#22d3ee', '#ffffff']
            });

            // Sustained fireworks
            intervalRef.current = window.setInterval(function() {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    return;
                }

                const particleCount = 50 * (timeLeft / duration);
                
                // since particles fall down, start a bit higher than random
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [trigger]);

    return null; // Logic only component that manipulates canvas overlay
};

export default Fireworks;