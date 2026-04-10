'use client';

import { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import styles from './UpdatePrompt.module.css';

export default function UpdatePrompt() {
    const { updateAvailable, applyUpdate } = useServiceWorker();
    const [dismissed, setDismissed] = useState(false);

    if (!updateAvailable || dismissed) return null;

    return (
        <div className={styles.prompt}>
            <div className={styles.icon}>
                <RefreshCw size={16} />
            </div>
            <div className={styles.text}>
                <p className={styles.title}>Nueva versión disponible</p>
                <p className={styles.subtitle}>Actualiza para obtener las últimas mejoras</p>
            </div>
            <div className={styles.actions}>
                <button
                    onClick={() => setDismissed(true)}
                    className={styles.dismissBtn}
                    aria-label="Descartar"
                >
                    <X size={14} />
                </button>
                <button onClick={applyUpdate} className={styles.updateBtn}>
                    Actualizar
                </button>
            </div>
        </div>
    );
}
