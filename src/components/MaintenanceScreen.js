'use client';

import { Wrench, Clock, AlertTriangle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import styles from './MaintenanceScreen.module.css';

// Flip digit component for cinematic countdown
function FlipDigit({ value, label }) {
    const [current, setCurrent] = useState(value);
    const [prev, setPrev] = useState(value);
    const [flipping, setFlipping] = useState(false);

    useEffect(() => {
        if (value !== current) {
            setPrev(current);
            setFlipping(true);
            const t = setTimeout(() => {
                setCurrent(value);
                setFlipping(false);
            }, 300);
            return () => clearTimeout(t);
        }
    }, [value]);

    return (
        <div className={styles.flipUnit}>
            <div className={`${styles.flipCard} ${flipping ? styles.flipping : ''}`}>
                <div className={styles.flipTop}>
                    <span className={styles.flipDigitText}>{current}</span>
                </div>
                <div className={styles.flipBottom}>
                    <span className={styles.flipDigitText}>{current}</span>
                </div>
                {flipping && (
                    <>
                        <div className={styles.flipTopLeave}>
                            <span className={styles.flipDigitText}>{prev}</span>
                        </div>
                        <div className={styles.flipBottomEnter}>
                            <span className={styles.flipDigitText}>{current}</span>
                        </div>
                    </>
                )}
            </div>
            <span className={styles.flipLabel}>{label}</span>
        </div>
    );
}

export default function MaintenanceScreen({ message, targetDate }) {
    const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00', raw: '' });

    useEffect(() => {
        if (!targetDate) {
            setTimeLeft({ hours: '--', minutes: '--', seconds: '--', raw: 'Indefinido' });
            return;
        }

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const distance = target - now;

            if (distance < 0) {
                setTimeLeft({ hours: '00', minutes: '00', seconds: '00', raw: 'Finalizando...' });
                return;
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setTimeLeft({
                hours: hours.toString().padStart(2, '0'),
                minutes: minutes.toString().padStart(2, '0'),
                seconds: seconds.toString().padStart(2, '0'),
                raw: `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`,
            });
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    const isIndefinite = timeLeft.hours === '--';

    return (
        <div className={styles.container}>
            {/* Aurora background orbs */}
            <div className={styles.orb1} />
            <div className={styles.orb2} />
            <div className={styles.orb3} />

            {/* Noise overlay */}
            <div className={styles.noise} />

            {/* Status badge */}
            <motion.div
                className={styles.badge}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                <span className={styles.badgeDot} />
                <Zap size={12} />
                En mantenimiento
            </motion.div>

            {/* Icon */}
            <motion.div
                className={styles.iconContainer}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            >
                <Wrench size={40} strokeWidth={1.5} className={styles.wrenchIcon} />
            </motion.div>

            {/* Title */}
            <motion.h1
                className={styles.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                Plataforma en
                <span className={styles.titleAccent}> Mantenimiento</span>
            </motion.h1>

            {/* Message */}
            <motion.p
                className={styles.message}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
            >
                {message || 'Estamos realizando mejoras importantes en nuestra plataforma para brindarte un mejor servicio. Por favor, vuelve a intentarlo más tarde.'}
            </motion.p>

            {/* Flip Countdown */}
            <motion.div
                className={styles.countdownWrapper}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
            >
                <div className={styles.countdownLabel}>
                    <Clock size={14} />
                    Tiempo estimado
                </div>

                {isIndefinite ? (
                    <div className={styles.indefinite}>Indefinido</div>
                ) : (
                    <div className={styles.flipRow}>
                        <FlipDigit value={timeLeft.hours} label="horas" />
                        <span className={styles.separator}>:</span>
                        <FlipDigit value={timeLeft.minutes} label="min" />
                        <span className={styles.separator}>:</span>
                        <FlipDigit value={timeLeft.seconds} label="seg" />
                    </div>
                )}
            </motion.div>

            {/* Alert strip */}
            <motion.div
                className={styles.alertStrip}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.65 }}
            >
                <AlertTriangle size={14} />
                Disculpa las molestias — Volveremos pronto
            </motion.div>

            {/* Footer */}
            <div className={styles.footer}>
                &copy; {new Date().getFullYear()} Vertx System. Viñoplastic Training.
            </div>
        </div>
    );
}