'use client';

import { Wrench, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

import styles from './MaintenanceScreen.module.css';

import { useState, useEffect } from 'react';

export default function MaintenanceScreen({ message, targetDate }) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!targetDate) {
            setTimeLeft('Indefinido');
            return;
        }

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const distance = target - now;

            if (distance < 0) {
                setTimeLeft('Finalizando...');
                return;
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // Formato HH:MM:SS
            setTimeLeft(`${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`);
        };

        // Calcular inmediatamente
        calculateTimeLeft();

        // Actualizar cada segundo
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <div className={styles.container}>
            <div className={styles.iconContainer}>
                <Wrench size={64} color="#3b82f6" strokeWidth={1.5} />
            </div>

            <motion.h1
                className={styles.title}
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                Plataforma en Mantenimiento
            </motion.h1>

            <p className={styles.message}>
                {message || 'Estamos realizando mejoras importantes en nuestra plataforma para brindarte un mejor servicio. Por favor, vuelve a intentarlo más tarde.'}
            </p>

            <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                    <Clock size={20} />
                    <span className={styles.infoText}>Tiempo estimado: {timeLeft}</span>
                </div>
                <div className={styles.infoItem}>
                    <AlertTriangle size={20} />
                    <span className={styles.infoText}>Disculpa las molestias</span>
                </div>
            </div>

            <div className={styles.footer}>
                &copy; {new Date().getFullYear()} Vertx System. Viñoplastic Training.
            </div>
        </div>
    );
}
