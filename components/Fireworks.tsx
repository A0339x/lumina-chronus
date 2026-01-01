import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface FireworksProps {
    trigger: boolean;
    brief?: boolean; // Short celebration (just a few bursts)
}

const Fireworks: React.FC<FireworksProps> = ({ trigger, brief = false }) => {
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (trigger) {
            const colors = ['#a78bfa', '#f472b6', '#22d3ee', '#ffffff'];

            if (brief) {
                // Brief mode: just 3 quick bursts
                confetti({
                    particleCount: 80,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors
                });

                setTimeout(() => {
                    confetti({
                        particleCount: 50,
                        spread: 90,
                        origin: { x: 0.3, y: 0.5 },
                        colors
                    });
                }, 300);

                setTimeout(() => {
                    confetti({
                        particleCount: 50,
                        spread: 90,
                        origin: { x: 0.7, y: 0.5 },
                        colors
                    });
                }, 600);
            } else {
                // Full celebration mode
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
                    colors
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
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [trigger, brief]);

    return null; // Logic only component that manipulates canvas overlay
};

export default Fireworks;