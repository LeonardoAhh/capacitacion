'use client';

import { Wrench, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import styles from './MaintenanceScreen.module.css';

function CountSegment({ value, label }) {
    return (
        <motion.div
            className={styles.segment}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <span className={styles.segmentValue}>{value}</span>
            <span className={styles.segmentLabel}>{label}</span>
        </motion.div>
    );
}

export default function MaintenanceScreen({ message, targetDate }) {
    const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00', indefinite: false });

    useEffect(() => {
        if (!targetDate) {
            setTimeLeft({ hours: '--', minutes: '--', seconds: '--', indefinite: true });
            return;
        }

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const distance = target - now;

            if (distance < 0) {
                setTimeLeft({ hours: '00', minutes: '00', seconds: '00', indefinite: false });
                return;
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setTimeLeft({
                hours: hours.toString().padStart(2, '0'),
                minutes: minutes.toString().padStart(2, '0'),
                seconds: seconds.toString().padStart(2, '0'),
                indefinite: false,
            });
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    const stagger = (i) => ({ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] } });

    return (
        <div className={styles.container}>

            {/* Subtle grid texture */}
            <div className={styles.grid} />

            {/* Top bar */}
            <div className={styles.topBar}>
                <div className={styles.logo}>
                    <Wrench size={16} strokeWidth={2} />
                    <span>Vertx System</span>
                </div>
                <div className={styles.statusPill}>
                    <span className={styles.statusDot} />
                    Mantenimiento activo
                </div>
            </div>

            {/* Main content */}
            <main className={styles.main}>

                {/* Eyebrow */}
                <motion.p className={styles.eyebrow} {...stagger(0)}>
                    — Sistema temporalmente no disponible
                </motion.p>

                {/* Big heading */}
                <motion.h1 className={styles.heading} {...stagger(1)}>
                    Volvemos<br />
                    <span className={styles.headingAccent}>muy pronto.</span>
                </motion.h1>

                {/* Description */}
                <motion.p className={styles.description} {...stagger(2)}>
                    {message || 'Estamos realizando mejoras importantes en nuestra plataforma para brindarte un mejor servicio. Por favor, vuelve a intentarlo más tarde.'}
                </motion.p>

                {/* Divider */}
                <motion.div className={styles.divider} {...stagger(3)} />

                {/* Countdown */}
                <motion.div className={styles.countdown} {...stagger(4)}>
                    <div className={styles.countdownHeader}>
                        <Clock size={13} strokeWidth={2} />
                        <span>Tiempo estimado de regreso</span>
                    </div>

                    {timeLeft.indefinite ? (
                        <p className={styles.indefinite}>Indefinido</p>
                    ) : (
                        <div className={styles.segments}>
                            <CountSegment value={timeLeft.hours} label="horas" />
                            <span className={styles.colon}>:</span>
                            <CountSegment value={timeLeft.minutes} label="min" />
                            <span className={styles.colon}>:</span>
                            <CountSegment value={timeLeft.seconds} label="seg" />
                        </div>
                    )}
                </motion.div>

                {/* Alert note */}
                <motion.div className={styles.alertNote} {...stagger(5)}>
                    <AlertTriangle size={13} strokeWidth={2} />
                    <span>Disculpá las molestias — Estamos trabajando para volver rápido</span>
                </motion.div>

            </main>

            {/* Footer */}
            <footer className={styles.footer}>
                &copy; {new Date().getFullYear()} Vertx System · Viñoplastic Training
            </footer>
        </div>
    );
}