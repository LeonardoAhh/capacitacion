'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './UpdatePrompt.module.css';

export default function UpdatePrompt() {
    const { updateAvailable, applyUpdate } = useServiceWorker();
    const [dismissed, setDismissed] = useState(false);

    const show = updateAvailable && !dismissed;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className={styles.pill}
                    role="status"
                    aria-live="polite"
                    initial={{ opacity: 0, scale: 0.9, y: "calc(-50% + 15px)", x: "-50%" }}
                    animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
                    exit={{ opacity: 0, scale: 0.9, y: "calc(-50% + 15px)", x: "-50%" }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                    <span className={styles.dot} aria-hidden="true" />
                    <span className={styles.label}>Nueva actualización disponible</span>
                    <button onClick={applyUpdate} className={styles.action}>
                        Actualizar
                    </button>
                    <button
                        onClick={() => setDismissed(true)}
                        className={styles.close}
                        aria-label="Descartar"
                    >
                        <X size={12} strokeWidth={2.5} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
