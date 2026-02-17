'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import styles from './UpdatePrompt.module.css';

export default function UpdatePrompt() {
    const { updateAvailable, applyUpdate } = useServiceWorker();
    const [dismissed, setDismissed] = useState(false);

    if (!updateAvailable || dismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                className={styles.prompt}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <div className={styles.content}>
                    <RefreshCw size={20} className={styles.icon} />
                    <div className={styles.text}>
                        <p className={styles.title}>Nueva versión disponible</p>
                        <p className={styles.subtitle}>Actualiza para obtener las últimas mejoras</p>
                    </div>
                </div>
                <div className={styles.actions}>
                    <button
                        onClick={() => setDismissed(true)}
                        className={styles.dismissBtn}
                        aria-label="Descartar"
                    >
                        <X size={18} />
                    </button>
                    <button onClick={applyUpdate} className={styles.updateBtn}>
                        Actualizar
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
