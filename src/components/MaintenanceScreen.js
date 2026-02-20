'use client';

import { Wrench, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

import styles from './MaintenanceScreen.module.css';

export default function MaintenanceScreen({ message }) {
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
                    <span className={styles.infoText}>Tiempo estimado: 12 horas</span>
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
