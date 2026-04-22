'use client';

import { Wrench, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/layout/ThemeToggle/ThemeToggle';
import styles from './MaintenanceScreen.module.css';

const stagger = (i) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
});

function CountSegment({ value, label }) {
    return (
        <motion.div className={styles.segment} {...stagger(0)}>
            <span className={styles.segmentValue}>{value}</span>
            <span className={styles.segmentLabel}>{label}</span>
        </motion.div>
    );
}

export default function MaintenanceScreen({ message, targetDate }) {
    const [timeLeft, setTimeLeft] = useState({
        hours: '00',
        minutes: '00',
        seconds: '00',
        indefinite: false,
    });

    useEffect(() => {
        if (!targetDate) {
            setTimeLeft({ hours: '--', minutes: '--', seconds: '--', indefinite: true });
            return;
        }

        const tick = () => {
            const distance = new Date(targetDate).getTime() - Date.now();

            if (distance <= 0) {
                setTimeLeft({ hours: '00', minutes: '00', seconds: '00', indefinite: false });
                return;
            }

            setTimeLeft({
                hours:   String(Math.floor(distance / 3_600_000)).padStart(2, '0'),
                minutes: String(Math.floor((distance % 3_600_000) / 60_000)).padStart(2, '0'),
                seconds: String(Math.floor((distance % 60_000) / 1_000)).padStart(2, '0'),
                indefinite: false,
            });
        };

        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <div className={styles.container}>

            {/* Grid texture */}
            <div className={styles.grid} aria-hidden="true" />

            {/* Top bar */}
            <header className={styles.topBar}>
                <div className={styles.logo}>
                    <Wrench size={15} strokeWidth={2} aria-hidden="true" />
                    <span>Vertx System</span>
                </div>
                <div className={styles.topBarRight}>
                    <div className={styles.statusPill} role="status">
                        <span className={styles.statusDot} aria-hidden="true" />
                        Mantenimiento activo
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            {/* Main content */}
            <main className={styles.main} id="main-content">

                <motion.p className={styles.eyebrow} {...stagger(0)}>
                    — Sistema temporalmente no disponible
                </motion.p>

                <motion.h1 className={styles.heading} {...stagger(1)}>
                    Volvemos<br />
                    <span className={styles.headingAccent}>muy pronto.</span>
                </motion.h1>

                <motion.p className={styles.description} {...stagger(2)}>
                    {message || 'Estamos realizando mejoras importantes en la plataforma para brindarte un mejor servicio. Por favor, vuelve a intentarlo más tarde.'}
                </motion.p>

                <motion.div className={styles.divider} {...stagger(3)} aria-hidden="true" />

                {/* Countdown */}
                <motion.div className={styles.countdown} {...stagger(4)}>
                    <div className={styles.countdownHeader}>
                        <Clock size={12} strokeWidth={2} aria-hidden="true" />
                        <span>Tiempo estimado de regreso</span>
                    </div>

                    {timeLeft.indefinite ? (
                        <p className={styles.indefinite}>Indefinido</p>
                    ) : (
                        <div className={styles.segments} aria-label={`${timeLeft.hours} horas, ${timeLeft.minutes} minutos, ${timeLeft.seconds} segundos`}>
                            <CountSegment value={timeLeft.hours}   label="horas" />
                            <span className={styles.colon} aria-hidden="true">:</span>
                            <CountSegment value={timeLeft.minutes} label="min" />
                            <span className={styles.colon} aria-hidden="true">:</span>
                            <CountSegment value={timeLeft.seconds} label="seg" />
                        </div>
                    )}
                </motion.div>

                {/* Alert note */}
                <motion.div className={styles.alertNote} {...stagger(5)} role="note">
                    <AlertTriangle size={13} strokeWidth={2} aria-hidden="true" />
                    <span>Disculpa las molestias — Estamos trabajando para volver rápido</span>
                </motion.div>

            </main>

            {/* Footer */}
            <footer className={styles.footer}>
                &copy; {new Date().getFullYear()} Vertx System · Viñoplastic Training
            </footer>

        </div>
    );
}
