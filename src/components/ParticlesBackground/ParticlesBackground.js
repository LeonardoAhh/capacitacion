'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ParticlesBackground.module.css';

export default function ParticlesBackground() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);

    // Initialize particles
    useEffect(() => {
        const particleCount = 80;
        particlesRef.current = Array.from({ length: particleCount }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.2,
        }));
    }, []);

    // Track mouse position
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Animate particles
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        let animationFrameId;
        const animate = () => {
            if (!ctx || !canvas) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const particles = particlesRef.current;

            particles.forEach(particle => {
                // Calculate distance to mouse
                const dx = mousePos.x - particle.x;
                const dy = mousePos.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 150;

                // Repel from mouse
                if (distance < maxDistance) {
                    const force = (maxDistance - distance) / maxDistance;
                    particle.vx -= (dx / distance) * force * 0.5;
                    particle.vy -= (dy / distance) * force * 0.5;
                }

                // Update position
                particle.x += particle.vx;
                particle.y += particle.vy;

                // Apply friction
                particle.vx *= 0.98;
                particle.vy *= 0.98;

                // Boundary bounce
                if (particle.x < 0 || particle.x > canvas.width) {
                    particle.vx *= -1;
                    particle.x = Math.max(0, Math.min(particle.x, canvas.width));
                }
                if (particle.y < 0 || particle.y > canvas.height) {
                    particle.vy *= -1;
                    particle.y = Math.max(0, Math.min(particle.y, canvas.height));
                }

                // Get theme
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fillStyle = isDark
                    ? `rgba(139, 92, 246, ${particle.opacity})`
                    : `rgba(59, 130, 246, ${particle.opacity})`;
                ctx.fill();

                // Draw connections
                particles.forEach(other => {
                    if (particle === other) return;

                    const dx2 = other.x - particle.x;
                    const dy2 = other.y - particle.y;
                    const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);

                    if (dist < 120) {
                        const opacity = (1 - dist / 120) * 0.3;
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.strokeStyle = isDark
                            ? `rgba(139, 92, 246, ${opacity})`
                            : `rgba(59, 130, 246, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                });
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [mousePos]);

    return (
        <canvas
            ref={canvasRef}
            className={styles.particlesCanvas}
            aria-hidden="true"
        />
    );
}
